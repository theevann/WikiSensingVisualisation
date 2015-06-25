var loadData;
var data;
var dateKey = "Created";
var p;

(function () {
	'use strict';

	d3.select("html")
		.attr("margin", 0)
		.attr("padding", 0);
		
	d3.select("body")
		.attr("margin", 0)
		.attr("padding", 0);
	
	var offset = {top : 15, left : 50},
		width = W,
		height = H - d3.select("#graph").node().offsetTop,
		widthPlot = width - 2 * offset.left,
		heightPlot = height - 2 * offset.top,
		newWidth,
		newHeight,
		newOffsetX = 0,
		newOffsetY = 0;
		
	var propertiesShown = ['temperature', 'humidity', 'light1', 'light2', 'batteryVoltage'],
		property = 'temperature',
		numberOfPointsToLoad = 1440, // 1440 minutes in a day
		date = new Date(+(new Date ()) - 1000 * 60 * 60 * 24),
		radius = H / 30;
		
	/*
	* Dimensions in meter
	*/
	
	var roomX = 9,
		roomY = 8.5,
		diameter = 6;
		
	/*
	* Position of sensors not on the cave
	*/
	
	var position = d3.map();
	position.set(133, [0, 0, 0]);
	position.set(134, [roomX, 0, 0]);
	position.set(135, [roomX, roomY]);
	position.set(136, [roomX / 2, roomY / 2 + diameter / 4, 0]);
	position.set(137, [roomX / 2, roomY / 2], 0);
	position.set(138, [roomX / 2, roomY / 2 - diameter / 4, 0]);
	position.set(139, [roomX / 2, 0, 0]);
	position.set(140, [roomX, roomY / 2, 0]);
	
	var corners = ['133', '134', '135'];
	var center = "137";
	
	var toScreen = (function () {		
		if (widthPlot / roomX > heightPlot / roomY) {
			newHeight = heightPlot;
			newWidth = newHeight * roomX / roomY;
			newOffsetX = (widthPlot - newWidth) / 2;
		} else {
			newWidth = widthPlot;
			newHeight = newWidth * roomY / roomX;
			newOffsetY = (heightPlot - newHeight) / 2;
		}
			
		return function (a) {
			var x = a[0] / roomX * newWidth + newOffsetX;
			var y = a[1] / roomY * newHeight + newOffsetY;
			
			return [x, y, a[2] || 0];
		};
	})();
		
	
	var serverAddress,
		sensorsToLoad,
		initialized = false,
		space = false,
		advanced = false,
		timeFormat = d3.time.format("%H : %M"),
		wikiSensingTimeFormat = d3.time.format("%Y%m%dT%H%M%SZ"),
		formatValue = d3.format(',.2f');
	
	/*
	*	Getting and preparing the data
	*/
	
	// Global function
	
	loadData = function (address, captorsNumber) {
		var end = captorsNumber.length;
		
		serverAddress = address;
		sensorsToLoad = captorsNumber;
		data = d3.map();

		initLoadingBar(captorsNumber);
		
		captorsNumber.forEach(function (d) {
			var previous = 0;
			d3.json(address + "Node_" + d + "/" + numberOfPointsToLoad + "/" + wikiSensingTimeFormat(date))
			.on("progress", function() { 
				updateLoadingBar(d);
			})
			.get(function (error, json) {
				try {
					if (error) {
						error.sensor = d;
						throw error;
					} else if (json.sensorRecords.length === 0) {
						error = {status : 0, sensor : d}
						throw error;
					}
				} catch (error) {
					if (error.status === 400) {
						console.warn("Server answered 'Bad request' (400) : The sensor " + error.sensor + " may not exist");
						sensorsToLoad.splice(sensorsToLoad.indexOf(d), 1);
						--end;
					} else if (error.status === 0) {
						console.warn("Empty response for sensor " + error.sensor);
						sensorsToLoad.splice(sensorsToLoad.indexOf(d), 1);
						--end;
					} else {
						showError(d);
						console.error(error.statusText);
					} 
					return;
				}
				
				var obj = d3.map();
				data.set(d, obj);
				
				json.sensorRecords.sort(function(a, b) {
					return (new Date (a.sensorObject[dateId(a)].value) - new Date (b.sensorObject[dateId(b)].value));
				});
				
				json.sensorRecords.forEach(function (d) {
					d.sensorObject.forEach(function (e) {
						// If problem, we may need to delete entries where there is not all fields present for a given time.
						obj.get(e.fieldName) ? "" : obj.set(e.fieldName , []);
						obj.get(e.fieldName).push(e.fieldName === dateKey ? new Date(e.value) : e.value);
					});
				});
				
				//console.log("Data from Sensor " + d + " loaded");
				if (--end === 0) {
					console.log("Loaded : " + sensorsToLoad + ".");
					endLoadingBar();
					
					updateOptions(advanced);
					listenMenu();
					initialize();
					interpolData();
					updateScale(frame);
					
					removeLoadingBar(500);
				}
			});
		});
	};

	var dateId = function (array) {
		var id = -1;
		array.sensorObject.forEach(function (d, i) {
			if (d.fieldName === dateKey) {
				id = i;
			}
		});
		return id;
	};
	
	var interpolData = function () {
		var a, t;

		data.forEach(function (k, v) {
			a = v.get(property);
			t = v.get(dateKey);

			v.current = data.time.map(function (e) {
				var id = d3.bisectRight(t, new Date(e));
				return (id === 0) ? false : (id === a.length) ? false : ((e - t[id - 1]) * a[id - 1] + (t[id] - e) * a[id]) / (t[id] - t[id - 1]);
			});
		});
	};
	
	/*
	*	Displaying the data
	*/
	
	var colors = ['blue', '#27f600', 'yellow','orange','red'],
		minScale, maxScale, colorScale,
		svg,
		active = false,
		frameBegin, frame, frameEnd,
		step, scalingPeriod, speed,
		ct;
	
	// Find extent over specific period of time around a given time

	var findExtent = function (frameTime) {
		var extentTime = [frameBegin, frameEnd],
			extentValue = [],
			hsp = ~~(scalingPeriod/2),
			dataValues = data.values();
		
		if (frameEnd - frameBegin <= scalingPeriod){
			extentValue[0] = d3.min(dataValues, function (c) { return d3.min(c.current, function (d) { return d === false ? undefined : d; }); });
			extentValue[1] = d3.max(dataValues, function (c) { return d3.max(c.current, function (d) { return d === false ? undefined : d; }); });
			return extentValue;
		} else if ((frameTime - frameBegin) < hsp){
			extentTime[1] = frameBegin + scalingPeriod;
		} else if ((frameEnd - frameTime) < hsp){
			extentTime[0] = frameEnd - scalingPeriod;
		} else {
			extentTime[0] = frameTime - hsp;
			extentTime[1] = frameTime + hsp;
		}
		
		extentValue[0] = d3.min(dataValues, function (d) {
			return d3.min(d.current.filter(function (d, i) {
				return extentTime[0] <= i && extentTime[1] >= i;
			}), function (d) { return d === false ? undefined : d; });
		});
		
		extentValue[1] = d3.max(dataValues, function (d) {
			return d3.max(d.current.filter(function (d, i) {
				return extentTime[0] <= i && extentTime[1] >= i;
			}), function (d) { return d === false ? undefined : d; });
		});
		
		return extentValue;	
	};

	// Function creating scale and axis

	var updateScale = function (frameTime) {
		var extent = [];

		//Find the extent of values for the scale depending on the chosen scaling period
		if (scalingPeriod === 0) { // Case if scaling period = whole time
			extent[0] = d3.min(data.values(), function (d) { return d3.min(d.current, function (d) { return d === false ? undefined : d; }); });
			extent[1] = d3.max(data.values(), function (d) { return d3.max(d.current, function (d) { return d === false ? undefined : d; }); });
		} else {
			extent = findExtent(frameTime);
		}
		
		// If nothing has changed and it's not the beggining, we do not redraw
		if (minScale === extent[0] && maxScale === extent[1] && frameTime !== frameBegin)
			return;
		
		// Define range and color range
		minScale = extent[0];
		maxScale = extent[1];
		colorScale = d3.scale.linear()
			.domain([minScale, minScale + (maxScale-minScale) / 4, (minScale+maxScale) / 2, minScale + 3 * (maxScale-minScale) / 4, maxScale])
			.range(colors);
		
		// Remove gradient and scale if existing
		
		d3.select('#scale-gradient').remove();
		d3.select('#scale').remove();
		
		// Draw Scale
		
		var dataGradient = [],
			l = colorScale.range().length;
		for (var j = 0 ; j < l ; j++) {
			dataGradient[j] = {offset: ~~(j * 100 / (l-1)) + '%', color: colorScale.range()[j]};
		}
		
		svg.append('linearGradient')                
			.attr('id', 'scale-gradient')            
			.attr('x1', '0%').attr('y1', '100%')         
			.attr('x2', '0%').attr('y2', '0%')
			.selectAll('stop')
			.data(dataGradient)      
			.enter().append('stop')
			.attr('offset', function (d) { return d.offset; })   
			.attr('stop-color', function (d) { return d.color; });
				
		var scaleAxis = d3.svg.axis()
			.ticks(5)
			.scale(d3.scale.linear().domain([minScale, maxScale]).range([heightPlot, 0]))
			.orient('left');
		
		var scale = svg.append('g')
			.attr('id', 'scale')
			.attr('transform', 'translate(' + (newWidth + newOffsetX * 5 / 4 + offset.left / 4) + ',' + newOffsetY + ')')
			.call(scaleAxis);
		
		scale.append('rect')
			.attr('width', (newOffsetX + offset.left) / 2)
			.attr('height', newHeight)
			.attr('fill', 'url(#scale-gradient)');  
		
		scale.append('text')
			.attr('transform', 'rotate(0)')
			.attr('y', -15)
			.attr('dy', '.71em')
			.style('text-anchor', 'start')
			.style('text-align','center')
			.text(property.capitalize());
	};

	// Initializing ...

	var initialize = function () {
		var minDate = d3.min(data.values(), function (c) { return d3.min(c.get(dateKey)); }),
			maxDate = d3.max(data.values(), function (c) { return d3.max(c.get(dateKey)); });
		data.time = d3.range(minDate.getTime(), maxDate.getTime(), 60000);
		
		step = parseInt(document.getElementById('step').value, 10);
		scalingPeriod = parseInt(document.getElementById('scalingPeriod').value, 10);
		speed = parseInt(document.getElementById('speed').value, 10);
		
		active = false;
		
		frameBegin = 0;
		frameEnd = data.time.length;
		frame = frameBegin;

		svg = d3.select('#graph').append('svg')
				.style('position', 'relative')
				.attr('width', width + 'px')
				.attr('height', height + 'px') 
				.append('g')
				.attr('transform', 'translate(' + offset.left + ',' + offset.top + ')');
		
		svg.append('g')
			.attr("id", "plot")
			.append('rect')
			.attr('x', newOffsetX)
			.attr('y', newOffsetY)
			.attr('width', newWidth)
			.attr('height', newHeight)
			.attr("fill", "transparent")
			.attr("stroke", "black")
			.attr("stroke-width", "4");
		
		data.forEach(function (k, v) {
			k = +k;
			var a = 19.6 * Math.PI / 180;
			var iX = roomX / 2,
				iY = roomY / 2;
				
			if (k <= 116) {
				a *= (k - 101);
				v.position = toScreen([-Math.cos(a) * (diameter / 2) + iX, -Math.sin(a) * (diameter / 2) + iY, 3]);
			} else if (k <= 132) {
				a *= (k - 117);
				v.position = toScreen([-Math.cos(a) * (diameter / 2) * 0.8 + iX, -Math.sin(a) * (diameter / 2)* 0.8 + iY, 1]);
			} else {
				v.position = toScreen(position.get(k));
			}
		});
		
		d3.select('#reset').attr('disabled', null);
		d3.select('#launch').attr('disabled', null);
		d3.select('#reload').attr('disabled', null);
		d3.select('#date').html("Press launch to start");
		
		initialized = true;
	};
	
	var listenMenu = function () {
		if (initialized)
			return;
		
		new Pikaday({
			field: document.getElementById('datepicker'),
			firstDay: 1,
			minDate: new Date('2014-06-01'),
			maxDate: new Date(),
			yearRange: 1,
			use24hour: true,
			defaultDate : date,
			setDefaultDate : true,
			onClose : function () {
				if ((~~(+this.getDate() - +date) / 100000) != 0) {
					date = this.getDate();
				}
			}
		});
		
		// Listen to Launch/Pause Button

		d3.select('#launch')
		.on('click', function () {
			if (active) {
				pause();
			} else {
				launch();
			}
		}, true);
		 
		// Listen to Reset Button
	
		d3.select('#reset')
		.on('click', function () {
			pause();
			d3.select('#launch').html('Launch');
			frame = frameBegin;
		}, true); 
		
		// Listen to Reload Button
	
		d3.select('#reload')
		.on('click', reload, true);
		
		// Listen to speed input
		
		d3.select('#speed')
		.on('change', function () {
			speed = (parseInt(this.value, 10) > 0)? parseInt(this.value, 10) : speed;
			if (active)
				launch(frame);
		}, true);
		 
		// Listen to step input
		
		d3.select('#step')
		.on('change', function () {
			step = (parseInt(this.value, 10) > 0) ? parseInt(this.value, 10) : step;
			if (active)
				launch(frame);
		}, true);
		 
		// Listen to number of measurements input
		
		d3.select('#measurements')
		.on('change', function () {
			numberOfPointsToLoad = (parseInt(this.value, 10) >= 10)? parseInt(this.value, 10) : numberOfPointsToLoad;
		}, true);
		
		// Listen to the time scale form
		
		d3.select('#scalingPeriod')
		.on('change', function () {
			scalingPeriod = +this.options[this.selectedIndex].value;
			updateScale(frame);
		}, true);
		
		// Listen to the property form
		
		d3.select('#property')
		.on('change', function () {
			property = this.options[this.selectedIndex].value;
			interpolData();
			updateScale(frame);
		}, true);
	};
	
	// Create options in the property form
	
	var updateOptions = function (all) {
		d3.select("#property").selectAll("select option").remove();
		
		var options = data.values()[0].keys().filter(function (d) { return all || propertiesShown.indexOf(d) >= 0; });
		
		d3.select("#property")
			.selectAll("select")
			.data(options)
			.enter()
			.append("option")
			.text(function (d) { return d; })
			.attr('value', function (d) { return d; })
			.each(function (d) { if (d === property) { this.selected = "selected"; }});
	};
	
	var reload = function () {
		pause();
		d3.selectAll("svg").remove();
		d3.select('#reset').attr('disabled', true);
		d3.select('#launch').attr('disabled', true);
		d3.select('#reload').attr('disabled', true);
		d3.select('#date').html("Loading...");
		loadData(serverAddress, sensorsToLoad);
	};
	
	var pause = function () {
		var launchButton = document.getElementById('launch');
		launchButton.innerHTML = 'Start';
		active = false;
		clearTimeout(ct);
	};
	
	// Launch representation
	
	var launch = function (begin) {
		if (active) {
			clearTimeout(ct);
		}
		
		var launchButton = document.getElementById('launch');
		launchButton.innerHTML = 'Pause';
		
		active = true;
		begin = typeof begin === "undefined" ? frame : +begin;
		
		var callback = function () {
			if (frame === data.time.length - 1) {
				active = false;
				return;
			} else if (frame + step >= data.time.length) {
				createRepresentation(frame = data.time.length - 1, callback);
			} else {
				createRepresentation(frame += step, callback);
			}
		};
		
		createRepresentation(begin, callback);
	};
	
	// Function for creating a color map at the time index given
	
	var createRepresentation  = function (time, callback) {
		if (!active)
			return;
		
		ct = setTimeout(callback, speed);
		
		var circles, lineH, lineV, stop, gr, g, text;
		// Redraw Scale depending on the scaling period
		updateScale(frame);
		
		// Display time and extent of displayed property
		var ext = d3.extent(data.values(), function (d) { return d.current[time] === false ? undefined : d.current[time]; });
		d3.select('#date').text(new Date(data.time[time]).toLocaleString() + ' - (' + formatValue(ext[0]) + "," + formatValue(ext[1])  + ')');
		
		// Update radial gradient
		g = svg.select('g#plot');
		gr = g.selectAll('.rg').data(data.values());

		gr.enter().append('radialGradient').classed('rg', true)                
			.attr('id', function (d,i) { return 'area-gradient' + i; })
			.attr('cx', '50%').attr('cy', '50%')         
			.attr('fx', '50%').attr('fy', '50%')         
			.attr('r', '50%');

		stop = gr.selectAll('stop')
			.data([
				{offset: '0%', opacity : 1},
				{offset: '15%', opacity : 1},
				{offset: '100%', opacity : 0}
			]);

		stop.enter().append('stop')
			.attr('offset', function (d) { return d.offset; })
			.attr('stop-opacity', function (d) { return d.opacity; })
			.attr('stop-color', 'white');

		gr.selectAll('stop').transition().duration(speed).attr('stop-color', function (d,i,j) { return  data.get(sensorsToLoad[j]).current[time] !== false ? colorScale(data.get(sensorsToLoad[j]).current[time]) : "white"; });
		
		// Update circles

		circles = g.selectAll('circle').data(data.values());

		circles.enter().append('circle')
			.style('opacity', 0)
			.attr('cx', function (d) { return d.position[0]; })
			.attr('cy', function (d) { return d.position[1]; })
			.attr('r', radius)
			.append('title');
			
		circles.selectAll("title").html(function (d, j) { return data.get(sensorsToLoad[j]).current[time] || "Unknown"; });
		circles.style('fill', function (d,j) { return 'url(#area-gradient' + j +')'; }).transition().duration(speed).style("opacity", function (d, j) { return data.get(sensorsToLoad[j]).current[time] !== false ? 0.8 : 0; });
		
		// Draw crosses representing the nodes
		lineH = g.selectAll('.horizontal').data(data.values());
		lineV = g.selectAll('.vertical').data(data.values());
		text = g.selectAll('.number').data(data.entries());

		lineH.enter().append('line').classed('horizontal', true)
			.attr('x1', function (d) { return d.position[0] + 5; })
			.attr('y1', function (d) { return d.position[1]; })
			.attr('x2', function (d) { return d.position[0] - 5; })
			.attr('y2', function (d) { return d.position[1]; })
			.attr('stroke','black')
			.attr('stroke-width','2px');

		lineV.enter().append('line').classed('vertical', true)
			.attr('x1', function (d) { return d.position[0]; })
			.attr('y1', function (d) { return d.position[1] - 5; })
			.attr('x2', function (d) { return d.position[0]; })
			.attr('y2', function (d) { return d.position[1] + 5; })
			.attr('stroke','black')
			.attr('stroke-width','2px');

		text.enter().append('text').classed('number', true)
			.attr('x', function (d) { return d.value.position[0]; })
			.attr('y', function (d) { return d.value.position[1]; })
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'central')
			.attr("transform", function (d) {
				var c = corners.indexOf(d.key) >= 0 ? 1.5 : 1;
				var p = d.value.position;
				var center = toScreen([roomX / 2, roomY / 2]);
				var offsets = [center[0] - p[0], center[1] - p[1]];
				var angle = -Math.atan2(offsets[0], offsets[1]) / Math.PI * 180 + (offsets[1] < 0 ? 180 : 0);
				var translation = normalize(offsets, radius / 1.8 * c);
				return "translate(" + translation + ")rotate(" + angle + "," + d.value.position.slice(0,2) + ")";
			})
			.attr('dy', function (d) { return d.key === center ? -radius/1.8 : 0})
			.text(function (d,i) { return d.key; });
	};
		

})();

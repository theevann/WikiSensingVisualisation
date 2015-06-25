var loadData;
var data;
var dateKey = "Created";

/*
(function () {
	'use strict';
//*/
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
	
	var roomX = 9,
		roomY = 8.5,
		diameter = 6;
	
	var position = d3.map();
	position.set(133, [0, 0, 0]);
	position.set(134, [roomX, 0, 0]);
	position.set(135, [roomX, roomY]);
	position.set(136, [roomX / 2, roomY / 2 + diameter / 4, 0]);
	position.set(137, [roomX / 2, roomY / 2], 0);
	position.set(138, [roomX / 2, roomY / 2 - diameter / 4, 0]);
	position.set(139, [roomX / 2, 0, 0]);
	position.set(140, [roomX, roomY / 2, 0]);
	
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
		
	var space = false, advanced = false,
		propertiesShown = ['temperature', 'humidity', 'light1', 'light2', 'batteryVoltage'],
		property = 'temperature',
		numberOfPointsToLoad = 100,
		date = new Date(+(new Date ()) - 1000 * 60 * 60 * 24),
		radius = 20;

	var serverAddress,
		sensorsToLoad,
		initialized = false,
		timeFormat = d3.time.format("%H : %M"),
		wikiSensingTimeFormat = d3.time.format("%Y%m%dT%H%M%SZ"),
		formatValue = d3.format(',.2f'),
		ct; // For timeout
	

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
			.get( function (error, json) {
				if (error) {
					showError(d);
					return console.warn(error);
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
				
				console.log("Data from Sensor " + d + " loaded");
				if (--end === 0) {
					console.log("Loaded");
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
	//Keep image scale and center it
	if (imgWidth / dimension.x > imgHeight / dimension.y) {
		dimensionImg.x = dimension.x;
		dimensionImg.y = imgHeight / imgWidth * dimension.x;
		offsetImg.top = (dimension.y - dimensionImg.y) / 2;
	} else {
		dimensionImg.y = dimension.y;
		dimensionImg.x = imgWidth / imgHeight * dimension.y;
		offsetImg.left = (dimension.x - dimensionImg.x) / 2;
	}
*/

	/*
	*	Displaying the data
	*/
	
	var minScale, maxScale, colorScale, svg, active = false, numRepresentation = 0, frame, frameEnd, step, frameBegin, scalingPeriod, numMes, startTime, speed;
	var colors = ['blue', '#27f600', 'yellow','orange','red'];
	
	//Find extent over specific period of time around a given time

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
		var minDate = startTime = d3.min(data.values(), function (c) { return d3.min(c.get(dateKey)); }),
			maxDate = d3.max(data.values(), function (c) { return d3.max(c.get(dateKey)); });
		data.time = d3.range(minDate.getTime(), maxDate.getTime(), 60000);
		
		step = parseInt(document.getElementById('step').value, 10);
		scalingPeriod = parseInt(document.getElementById('scalingPeriod').value, 10);
		speed = parseInt(document.getElementById('speed').value, 10);
		numMes = parseInt(document.getElementById('measurements').value, 10);
		
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
		
		initialized = true;
	};
	
	var listenMenu = function () {
		if (initialized)
			return;
		
		// Listen to Launch/Pause Button

		var launchButton = document.getElementById('launch');
		launchButton.addEventListener('click', function () {
			if (active === false) {
				launchButton.innerHTML = 'Pause';
				launch();
			} else {
				active = false;
				launchButton.innerHTML = 'Start';
			}
		}, true);
		d3.select('#launch').attr('disabled', null);
		 
		// Listen to Reset Button
	
		var resetButton = document.getElementById('reset');
		resetButton.addEventListener('click', function () {
				launchButton.innerHTML = 'Launch';
				active = false;
				frame = frameBegin;
		}, true);
		d3.select('#reset').attr('disabled', null);
		
		// Listen to speed input
		
		var speedInput = document.getElementById('speed');
		speedInput.addEventListener('change', function () {
			speed = (parseInt(speedInput.value, 10) > 0)? speedInput.value : speed;
			speed = parseInt(speed, 10);
			if (active)
				launch(frame);
		}, true);
		 
		// Listen to step input
		
		var stepInput = document.getElementById('step');
		stepInput.addEventListener('change', function () {
			step = (parseInt(stepInput.value, 10) > 0)? stepInput.value : step;
			step = parseInt(step, 10);
			if (active)
				launch(frame);
		}, true);
		 
		// Listen to number of measurements input
		
		var mesInput = document.getElementById('measurements');
		mesInput.addEventListener('change', function () {
			numMes = (parseInt(mesInput.value, 10) >= 10)? mesInput.value : numMes;
			numMes = parseInt(numMes, 10);
			
			launchButton.innerHTML = 'Launch';
			active = false;
			clearTimeout(ct);
			
			d3.selectAll("svg").remove();
			loadData(serverAddress, sensorsToLoad);
		}, true);
		
		// Listen to the time scale form
		
		var scalingList= document.getElementById('scalingPeriod');
		scalingList.addEventListener('change', function () {
			scalingPeriod = +scalingList.options[scalingList.selectedIndex].value;
			updateScale(frame);
		}, true);
		
		//Select initial property selected
		//d3.select('#Properties option:nth-child(' + 1 + ')').attr('selected','selected');

		// Listen to the property form
		
		var propertyList = document.getElementById('property');
		propertyList.addEventListener('change', function () {
			property = propertyList.options[propertyList.selectedIndex].value;
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
	
	// Launch representation
	
	var launch = function (begin) {
		if (active) {
			clearTimeout(ct);
		}
		
		active = true;
		begin = typeof begin === "undefined" ? frame : +begin;
		
		var callback = function () {
			if (frame + 1 >= data.time.length) {
				active = false;
				return;
			}
			createRepresentation(++frame, callback);
		};
		
		createRepresentation(begin, callback);
	};
	
	// Function for creating a color map at the time index given
	
	var createRepresentation  = function (time, callback) {
		if (!active)
			return;
		
		ct = setTimeout(callback, speed);
		
		var circles, lineH, lineV, stop, gr, text;
		// Redraw Scale depending on the scaling period
		updateScale(frame);
		
		// Display time and extent of displayed property
		var ext = d3.extent(data.values(), function (d) { return d.current[time] === false ? undefined : d.current[time]; });
		d3.select('#date').text(new Date(data.time[time]) + ' | (' + formatValue(ext[0]) + "," + formatValue(ext[1])  + ')');
		
		// Update radial gradient
		
		gr = svg.select('g#plot').selectAll('.rg').data(data.values());

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

		svg.selectAll('.rg').selectAll('stop').transition().duration(speed).attr('stop-color', function (d,i,j) { return  data.get(sensorsToLoad[j]).current[time] !== false ? colorScale(data.get(sensorsToLoad[j]).current[time]) : "white"; });
		
		// Update circles

		circles = svg.selectAll('circle').data(data.values());

		circles.enter().append('circle')
			.style('opacity', 0)
			.attr('cx', function (d) { return d.position[0]; })
			.attr('cy', function (d) { return d.position[1]; })
			.attr('r', radius);

		circles.style('fill', function (d,j) { return 'url(#area-gradient' + j +')'; }).transition().duration(speed).style("opacity", function (d, j) { return data.get(sensorsToLoad[j]).current[time] !== false ? 0.8 : 0; });

		// Draw crosses representing the nodes
		lineH = svg.selectAll('.horizontal').data(data.values());
		lineV = svg.selectAll('.vertical').data(data.values());
		text = svg.selectAll('.number').data(data.entries());

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
			.attr('alignment-baseline', 'middle')
			.attr("transform", function (d) {
				var p = d.value.position;
				var center = toScreen([roomX / 2, roomY / 2]);
				var offsets = [center[0] - p[0], center[1] - p[1]];
				var angle = -Math.atan2(offsets[0], offsets[1]) / Math.PI * 180 + (offsets[1] < 0 ? 180 : 0);
				var translation = normalize(offsets, radius / 2);
				return "translate(" + translation + ")rotate(" + angle + "," + d.value.position.slice(0,2) + ")";
			})
			.attr('dy', function (d) { return d.key === 137 ? -5 : 0})
			.text(function (d,i) { return d.key; });
	};
		
/*
})();
//*/
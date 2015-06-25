var data = d3.map();
var numberOfPointsToLoad = dev ? 500 : 1440;
var date = new Date(+(new Date ()) - 1000 * 60 * 60 * 24);
var dimensionGraph = 300; // 200
var p1 = "temperature";
var p2 = "humidity";
var configuration = c.ALL;
var H, W;
var charts = [];
var sync = false;
var propertiesShown = ['None', 'temperature', 'humidity', 'light1', 'light2', 'batteryVoltage'];
var space = false, advanced = false, dateModified = false;

//----

var header, content;
var ylExt = [], yrExt = [];
var numberHorizontally, numberVertically, rowVertically;
var timeFormat = d3.time.format("%H : %M");
var wikiSensingTimeFormat = d3.time.format("%Y%m%dT%H%M%SZ");
var sensorsToLoad, serverAddress;
var initiated = false;

var loadData = function (address, captorsNumber) {
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
					obj.get(e.fieldName) ? "" : obj.set(e.fieldName , []);
					obj.get(e.fieldName).push(e.value);
				});
			});
			
			//console.log("Data from Sensor " + d + " loaded");
			if (--end === 0) {
				console.log("Loaded : " + sensorsToLoad);
				endLoadingBar();
				createOptions(advanced);
				listenMenu();
				drawInterface();
				setTimeout(function () {
					drawConfiguration();
				}, 1000);
				initiated = true;
			}
		});
	});
};

var dateId = function (array) {
	var id = -1;
	array.sensorObject.forEach(function (d, i) {
		if (d.fieldName === "Created") {
			id = i;
		}
	});
	return id;
};

var listenMenu = function () {
	if (initiated) { return; }
	
	d3.select("#P1").on('change', function () {
		var name = getSelectedIn(this);
		p1 = name;
		drawConfiguration();
	});
	
	d3.select("#P2").on('change', function () {
		var name = getSelectedIn(this);
		p2 = name;
		drawConfiguration();
	});
	
	d3.select("#switchButton").on('click', function () { switchFunction(); });
	
	d3.select("#expandButton").on('click', function () {
		if (this.value === "false") {
			d3.selectAll(".hidden:not(.advanced)").style("display", "");
			advanced ? d3.selectAll(".hidden.advanced").style("display", "") : "";
			this.value = true;
			this.innerHTML = "<";
		} else {
			d3.selectAll(".hidden").style("display", "none");
			this.value = false;
			this.innerHTML = ">";
		}
	});
	
	d3.select("#refreshButton").on('click', function () {
		if (!dateModified) {
			date = new Date(+(new Date ()) - 1000 * 60 * 60 * 24);
		}
		content.select("g#conf").remove();
		loadData(serverAddress, sensorsToLoad);
	});
	
	d3.select("#measurements").on('change', function () {
		numberOfPointsToLoad = parseInt(this.value, 10) || 0;
		this.value = numberOfPointsToLoad;
	});
	
	d3.select("#rescaleAllButton").on('click', function () {
		rescale(-1, ylExt, yrExt);
	});
	
	d3.select("#sync").on('change', function () {
		sync = !sync;
	});
	
	d3.select("#guideLine").on('change', function () {
		charts.forEach(function (d) { d.toggleGuideLine(); });
	});
	
	d3.select("#showAllButton").on('click', function () {
		charts[0].showAll();
	});
	
	d3.select("#hideAllButton").on('click', function () {
		charts[0].hideAll();
	});
	
	d3.select("#inverseButton").on('click', function () {
		charts[0].visibility.forEach(function (d, i) { d === "hide" ? charts[0].show(i) : charts[0].hide(i); });
	});
	
	d3.select("#rescaleButton").on('click', function () {
		charts[0].rescale();
		charts[0].update(500);
	});
};

var switchFunction = function (conf, sensor) {
	configuration = conf || configuration;
	if (configuration === c.ONE) {
		d3.select("#switchButton").text("Comparison View");
		configuration = c.ALL;
	} else if (configuration === c.ALL) {
		d3.select("#switchButton").text("All Sensors View");
		configuration = c.ONE;
		d3.select("#content").node().scrollTop = 0;
	}
	drawConfiguration(sensor);
};

var createOptions = function (all) {
	d3.select("#P1").selectAll("select option").remove();
	d3.select("#P2").selectAll("select option").remove();
	
	var options = data.values()[0].keys().filter(function (d) { return all || propertiesShown.indexOf(d) >= 0; });
	
	d3.select("#P1")
		.selectAll("select")
		.data(options)
		.enter()
		.append("option")
		.text(function (d) { return d;})
		.attr('value', function (d) { return d;})
		.each(function (d) { if (d === p1) { this.selected = "selected"}});

	options.unshift('None');

	d3.select("#P2")
		.selectAll("select")
		.data(options)
		.enter()
		.append("option")
		.text(function (d) { return d;})
		.attr('value', function (d) { return d;})
		.each(function (d) { if (d === p2) { this.selected = "selected"}});
};

var drawInterface = function () {
	if (initiated) { return; }

	numberHorizontally = Math.round((W / dimensionGraph - 2 * 0.1 + 0.15) / (0.15 + 1));
	numberHorizontally = data.size() <= numberHorizontally ? data.size() : numberHorizontally;
	numberVertically = Math.round((H * 0.90 / dimensionGraph - 2 * 0.07 + 0.1) / (0.1 + 1));
	numberVertically = data.size() <= numberHorizontally ? 1 : numberVertically;
	rowVertically = H * 0.9 / numberVertically * Math.ceil(data.size() / numberHorizontally);

	var fontSize = 50 * W / 1530;
	
	header = d3.select("#header")
		.attr("height", 0.1 * H)
		.append("svg")
		.attr("height", 0.1 * H)
		.attr("width", W)
		.append("g")
		.attr("id", "svgHeader")
	
	var text = header
		.append("text")
		.attr('x', '50%')
		.attr('y', '50%')
		.attr('text-anchor', 'middle')
		.attr('dominant-baseline', 'middle')
		.attr('fill', 'white')
		.attr('font-size', fontSize);
	
	text.append("tspan").attr('dominant-baseline', 'middle')
		.text("Sensors Dashboard - Willia");
	text.append("tspan").attr('dominant-baseline', 'middle')
		.on("mousedown", function () {toggleAdvanced();})
		//.on("mouseover", function () {d3.select(this).attr("fill","red");})
		//.on("mouseout", function () {d3.select(this).attr("fill","white");})
		.style("pointer-events", "all")
		.text("m");
	text.append("tspan").attr('dominant-baseline', 'middle')
		.text(" Penney");
		
	content = d3.select("#content")
		.style("top", 0.1 * H)
		.style("height", 0.9 * H)
		.append("svg")
		.attr("height", rowVertically)
		.attr("width", W)
		.append("g")
		.attr("id", "svgContent");
		
	d3.select("#menu").style("display", "");
	
    picker = new Pikaday(
    {
        field: document.getElementById('datepicker'),
        firstDay: 1,
        minDate: new Date('2014-06-01'),
        maxDate: new Date(),
        yearRange: 1,
		use24hour: true,
		defaultDate : date,
		setDefaultDate : true,
		onClose : function () {
			if (+picker.getDate() != +date) {
				date = picker.getDate();
				dateModified = true;
			}
		}
    });
	
	context = contextMenu();
	context.add("Rescale");
	context.add("Rescale Globally");
	context.add("Rescale Others");
	context.add("Rescale All Graphs");
	context.add("See in Comparison View");
	
	context.onSelect(function (d) {
		var key = d3.select(this).datum().key;
		if (d === 0) {
			charts[sensorsToLoad.indexOf(+key)].rescale();
			charts[sensorsToLoad.indexOf(+key)].update(500);
		} else if (d === 1) {
			charts[sensorsToLoad.indexOf(+key)].rescale(false, ylExt, yrExt);
			charts[sensorsToLoad.indexOf(+key)].update(500);
		} else if (d === 2) {
			rescale(key);
			rezoom(key);
		} else if (d === 3) {
			rescale(-1, ylExt, yrExt);
		} else if (d === 4) {
			switchFunction(c.ONE, key);
		}
	});
	
};

var drawConfiguration = function (key) {
	content.select("g#conf").remove();
	var g = content.append("g").attr("id", "conf").style("opacity", "0");
	ylExt = [0,0];
	yrExt = [0,0];
	charts = [];
	
	if (configuration === c.ALL) {
		d3.select("#content").style("overflow-y", "auto");
		d3.select("#comparison-menu").style("display", "none");
		o1 = d3.scale.ordinal().domain(d3.range(numberHorizontally)).rangeBands([0, W], 0.15, 0.1);
		o2 = d3.scale.ordinal().domain(d3.range(Math.ceil(data.size() / numberHorizontally))).rangeBands([0, rowVertically], 0.1, 0.07);
		
		var myArgs = {
			guideLine : d3.select("#guideLine").property("checked")
			,width : o1.rangeBand()
			,height : o2.rangeBand()
			,showLegend : true
			,autoParseTime : true
			,zoomable : true
			,nameInBackground : {show : true, fontColor : "lightgrey", fontSize : 100} 
			,fontFamily : "din"
			,interpolate : "monotone"
			,y : {left : {label : p1, labelPosition : "in"}, right : {label : p2 === 'None' ? "" : p2, labelPosition : "in"}  }
			,x : {label : "Time", labelPosition : "in", format : d3.time.format("%H"), guideLineFormat : timeFormat}
		};
		
		myArgs.onZoom = function () {
			if (sync) {
				rezoom(this.name);
			}
		};
		
		g.selectAll("g").data(data.entries())
			.enter()
			.append("g")
			.classed("chart", true)
			.attr("transform", function (d, i) { return "translate(" + [o1.range()[i % numberHorizontally], o2.range()[ ~~(i / numberHorizontally)]]+ ')'; })
			.each(function (d, i) {
				var myData = [];
				var p1Data = d.value.get(p1),
					p2Data = d.value.get(p2);

				myData.push({ data : d.value.get("Created").map(function (e, j) { return [new Date(e), +p1Data[j]];}), label : p1, serieId : 0});
				if (p2Data) {
					myData.push({ data : d.value.get("Created").map(function (e, j) { return [new Date(e), +p2Data[j]];}), label : p2, serieId : 1});
				}
				
				myArgs.name = d.key;
				myArgs.series = myData;
				myArgs.container = this;
				
				var ch = new d3lib.chart(myArgs);
				ch.createVisualization();
				charts.push(ch);
				ylExt = [Math.min(ch.y.left.extent[0], ylExt[0] || ch.y.left.extent[0]), Math.max(ch.y.left.extent[1], ylExt[1] || ch.y.left.extent[1])];
				yrExt = [Math.min(ch.y.right.extent[0], yrExt[0] || ch.y.right.extent[0]), Math.max(ch.y.right.extent[1], yrExt[1] || ch.y.right.extent[1])];
			})
			.on("contextmenu", function (d, i) { d3.event.preventDefault(); context.show(d3.event.clientX, d3.event.clientY, this); d3.event.stopPropagation();})
		
			d3.select("body").on("click", function () {
				context.hide();
			});
			d3.select("body").on("contextmenu", function () {
				context.hide();
			});

			rescale(-1, ylExt, yrExt);
	} else if (configuration === c.ONE) {
		d3.select("#content").style("overflow-y", "hidden");
		var marginContent = 0.05;
		var widthSelectionMenu = 0.25;
		
		var widthGraph = W * (1 - marginContent - widthSelectionMenu);
		var heightGraph = H * 0.9 * (1 - 2 * marginContent);
		var myData = [];
		
		var myContainer = g.append("g")
			.attr("transform", "translate(" + [widthSelectionMenu * W, marginContent * H * 0.9] + ")");
	
		data.forEach(function (k, v) {
			var p1Data = v.get(p1);
			myData.push({ data : v.get("Created").map(function (e, j) { return [new Date(e), +p1Data[j]];}), label : " S-" + k + " (" + p1 + ")" , serieId : 0, visibility : key === undefined || +k === +key ? "show" : "hide"});
		});
		
		if (p2 !== 'None') {
			data.forEach(function (k, v) {
				var p2Data = v.get(p2);
				myData.push({ data : v.get("Created").map(function (e, j) { return [new Date(e), +p2Data[j]];}), label : " S-" + k + " (" + p2 + ")", serieId : 1, visibility : key === undefined || +k === +key ? "show" : "hide"});
			});
		}
		
		myArgs = {
			series : myData
			,container : myContainer.node()
			,margin :  [0,0,0,0]
			,width : widthGraph
			,height : heightGraph
			,guideLine : d3.select("#guideLine").property("checked")
			,highlight : true
			,showLegend : true
			,legendPosition : [-(widthSelectionMenu - marginContent) * W / widthGraph, 0.2]
			,limitRowLegend : ~~(data.size() / (p2 === 'None' ? 2 : 1))
			,autoParseTime : true
			,zoomable : true
			,fontFamily : "din"
			,interpolate : "monotone"
			,y : {left : {label : p1, labelPosition : "in"}, right : {label : p2 === 'None' ? "" : p2, labelPosition : "in"}  }
			,x : {label : "Time", labelPosition : "in", format : d3.time.format("%H"), guideLineFormat : timeFormat}
		};
		
		
		var ch = new d3lib.chart(myArgs);
		ch.createVisualization();
		charts = [ch];
		d3.select("#comparison-menu")
			.style("display", "")
			.transition()
			.duration(500)
			.style("width", d3.select("#chart-legend-" + charts[0].idGraph).node().getBBox().width);
		
		ylExt = ch.y.left.extent;
		yrExt = ch.y.right.extent;
	}
	
	removeLoadingBar(500);
	setTimeout(function () { g.transition().duration(700).style("opacity", "1") }, 500) ;
};

var rescale = function (sensor, extent1, extent2) {
	extent1 ? "" : charts.forEach(function (d) { if (sensor == d.name) { extent1 = d.y.left.extent} });
	extent2 ? "" : charts.forEach(function (d) { if (sensor == d.name) { extent2 = d.y.right.extent} });
	charts.filter(function (d) { return sensor != d.name; }).forEach(function (d) { d.rescale(false, extent1, extent2); d.update(500); });
};

var rezoom = function (sensor, zoom, translate) {
	zoom ? "" : charts.forEach(function (d) { if (sensor == d.name) { zoom = d.zoom.scale();} });
	translate ? "" : charts.forEach(function (d) { if (sensor == d.name) { translate = d.zoom.translate();} });
	charts.filter(function (d) { return sensor != d.name; }).forEach(function x(d) { d.rezoom(zoom, translate); d.update(1); });
};


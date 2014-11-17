	'use strict';
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		W = w.innerWidth || e.clientWidth || g.clientWidth,
		H = w.innerHeight|| e.clientHeight|| g.clientHeight;
		
	var toggleSecret, toggled = false, doubleSpace = false;
	var option = 'temperature';

	var width = W * 0.95,
		height = H * 0.85,
		dimension = {x : parseInt(0.90 * width), y : parseInt(0.99 * height)},
		dimensionImg = {};

	var papWidth = 26.8,
		papHeight = 7.7;

	var imgWidth = 1630,
		imgHeight = 474;

	var offset = {top : 15, left : 15},
		offsetImg = {top : 0, left : 0},
		propertiesShown = ['temperature', 'humidity', 'light1', 'light2', 'batteryVoltage'];

	var sensorFrom = 7,
		sensorTo = 30,
		numSensors = sensorTo - sensorFrom + 1;

	var papPos = [/*
			{x:24.9,y:2.9},
			{x:25.1,y:5.4},
			{x:22.6,y:1.3},
			{x:22.6,y:2.9},
			{x:22.8,y:5.4}, // 5
			{x:22.9,y:6.2},*/
			{x:20.5,y:1.4},
			{x:19.3,y:3.2},
			{x:19.5,y:4.3},
			{x:17.8,y:1.2}, // 10
			{x:17.8,y:3.2},
			{x:16,y:1.2},
			{x:16,y:3.2},
			{x:17,y:5.3},
			{x:12.9,y:1.4}, // 15
			{x:13,y:3.6},
			{x:12.6,y:5.3},
			{x:9,y:5},
			{x:8.4,y:1.2},
			{x:8.4,y:3.3}, // 20
			{x:6.7,y:1.2},
			{x:6.7,y:3.3},
			{x:5,y:1.2},
			{x:5,y:3.3},
			{x:3.3,y:1.2}, // 25
			{x:3.3,y:3.3},
			{x:1.6,y:1.2},
			{x:1.6,y:3.3},
			{x:1.5,y:5.1},
			{x:4.1,y:5.1}
		];

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

	var radius = 80 * dimensionImg.x / 1400;

	var pos = papPos.map(function (d) {return {x : d.x / papWidth * dimensionImg.x + offsetImg.left, y : d.y / papHeight * dimensionImg.y + offsetImg.top};});

	var formatValue = d3.format(',.2f');

	//Loading Data
	
	var data = []; // To contain data
	var computedData = []; // To contain data
	var bar = d3.select('#progBar');
	bar.attr('max', numSensors);

	var getFile = function (file, firstTime){
		d3.json('http://wikisensing.org/WikiSensingServiceAPI/DCEWilliamPenneyUpperFloorzYyYFkLwEygj7B0vvQWQ/Node_' + (file) + '/' + numMes, function (error, json) {
			if (error) {
				d3.select('#downloadProgress').text('Impossible to load data');
				return console.warn(error);
			}
			data[file - sensorFrom] = json;
			//Display loading of data
			bar.attr('value', file - sensorFrom + 1);
			d3.select('#downloadProgress').text('Retrieving Data ... ' + (file - sensorFrom + 1) + "/" + numSensors);
			if (file === sensorTo) {
				d3.select('#progress').style('display','none');
				initialize();
				if (firstTime)
					initializeListeners();
			} else if (file < sensorTo) {
				getFile(file + 1, firstTime);
			}
		});
	};
	
	getFile(sensorFrom, true);
	
	//End Loading Data
	//----------------------
	
	var min, max, color, svg, active, numRepresentation = 0, frame, dataEnd, repEnd, repPas, dataStart, repStart, scalingPeriod, numMes, startTime, speed;
	
	//Find extent over specific period of time around a given time
	
	var findExtent = function (frameTime) {
		var extentTime = [dataStart, dataEnd];
		var extentValue = [];
		
		if(dataEnd - dataStart <= scalingPeriod){
			extentValue[0] = d3.min(computedData, function (c) { return d3.min(c); });
			extentValue[1] = d3.max(computedData, function (c) { return d3.max(c); });
			return extentValue;
		} else if((frameTime - dataStart) < parseInt(scalingPeriod/2)){
			extentTime[1] = dataStart + scalingPeriod;
		} else if((dataEnd - frameTime) < parseInt(scalingPeriod/2)){
			extentTime[0] = dataEnd - scalingPeriod;
		} else {
			 extentTime[0] = frameTime-parseInt(scalingPeriod/2);
			 extentTime[1] = frameTime+parseInt(scalingPeriod/2);
		}
		
		extentValue[0] = d3.min(computedData, function (d) {
			var min = d[extentTime[0]];
			for (var j = extentTime[0]+1 ; j < extentTime[1]; j++) {
				min = (d[j] < min)? d[j] : min;
			}
			return min;
		});
		
		extentValue[1] = d3.max(computedData, function (d) {
			var max = d[extentTime[0]];
			for (var j = extentTime[0]+1 ; j < extentTime[1]; j++) {
				max = (d[j] > max)? d[j] : max;
			}
			return max;
		});
		
		return extentValue;	
	}
	

	//Function creating scale and axis
	
	var initColorAndScale = function () {
		var extent = [];

		//Find the extent of values for the scale depending on the chosen scaling period
		if(scalingPeriod === 0){ //Case if scaling period = whole time
			extent[0] = d3.min(computedData, function (c) { return d3.min(c); });
			extent[1] = d3.max(computedData, function (c) { return d3.max(c); });
		}
		else if(scalingPeriod === 1){ //Case if scaling period = one frame
			extent[0] = d3.min(computedData, function (d) { return d[frame]; });
			extent[1] = d3.max(computedData, function (d) { return d[frame]; });
		}
		else
			extent = findExtent(frame);
		
		//If nothing has changed and it's not the beggining, we do not redraw
		if(min === extent[0] && max === extent[1] && frame !== repStart)
			return;
		
		//Define range and color range
		min = extent[0];
		max = extent[1];
		color = d3.scale.linear()
			.domain([min,min+(max-min)/4,(min+max)/2,min+3*(max-min)/4,max])
			.range(['blue', '#27f600', 'yellow','orange','red']);
		
		//Remove gradient and scale if existing
		
		d3.select('#scale-gradient').remove();
		d3.select('#scale').remove();
		
		// Draw Scale
		
		var dataGradient = [],
			crl = color.range().length;
		for (var j = 0 ; j < crl ; j++) {
			dataGradient[j] = {offset: parseInt(j * 100 / (crl-1)) + '%', color: color.range()[j]};
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
		
		var heightScale = parseInt(dimension.y);
		
		var scaleAxis = d3.svg.axis()
			.ticks(5)
			.scale(d3.scale.linear().domain([min, max]).range([heightScale, 0]))
			.orient('left');
		
		var scale = svg.append('g')
		  .attr('id', 'scale')
		  .attr('transform', 'translate(' + parseInt(10 + 0.95*width) + ',10)')
		  .call(scaleAxis);
		
		scale.append('rect')
			.attr('width', parseInt(0.05*width))
			.attr('height', heightScale)
			.attr('fill', 'url(#scale-gradient)');  
		
		var p = document.getElementById('Properties');

		scale.append('text')
			.attr('transform', 'rotate(0)')
			.attr('y', -10)
			.attr('dy', '.71em')
			.style('text-anchor', 'start')
			.style('text-align','center')
			.text(p.options[p.selectedIndex].text);
	};

	// Initializing ...

	var initialize = function () {
		repPas = parseInt(document.getElementById('step').value);
		scalingPeriod = parseInt(document.getElementById('scalingPeriod').value);
		speed = parseInt(document.getElementById('speed').value);
		numMes = parseInt(document.getElementById('measurements').value);
		
		active = false;
		
		//Create variable for more practical use

		computeData();

		repStart = dataStart = 0;
		repEnd = dataEnd = computedData[0].length;
		frame = repStart;

		//Create SVG
		var bodyRect = document.body.getBoundingClientRect();

		var backImg = d3.select('#graph').append('div').attr('id','divImg')
			.style('position','absolute')
			.style('top', (offset.top + offsetImg.top) + 'px')
			.style('left', (offset.left + offsetImg.left) + 'px')
			.append('img')
			.attr('src', 'img.png')
            .attr('height', dimensionImg.y)
            .attr('width', dimensionImg.x);

		d3.select('#graph').selectAll('svg').remove();
		svg = d3.select('#graph').append('svg')
				.style('position', 'relative')
				.attr('width', width + 'px')
				.attr('height', height + 'px') 
				.append('g')
				.attr('transform', 'translate(' + offset.left + ',' + offset.top + ')');
	};

	var computeData = function () {
		var propertyList = document.getElementById('Properties');

		data.forEach(function (c,i) {
			var propId, dateId;
			c.sensorRecords.forEach(function (d) {
				propId = findId(d.sensorObject, option);
				dateId = findId(d.sensorObject, 'Created');
				d.date = new Date(d.sensorObject[dateId].value);
				d.prop = propId >= 0 ? parseFloat(d.sensorObject[propId].value) : false;
			});
			c.sensorRecords = c.sensorRecords.filter(function (d) {return d.prop !== false;});

			c.sensorRecords.sort(function (a, b) {
				return a.date - b.date;
			});
		});

		var min = d3.min(data, function (c) { return d3.min(c.sensorRecords, function (d) { return d.date; }); });
		var max = d3.max(data, function (c) { return d3.max(c.sensorRecords, function (d) { return d.date; }); });
		startTime = min;
		var b = d3.bisector(function (d) {return d.date;}).right;
		var array = [];

		computedData = data.map(function (d,i) {
			array = [];
			var s = d.sensorRecords;
			d3.range(min.getTime(), max.getTime(), 60000).map(function (e,i) {
				var id = b(s, new Date(e));
				var val = (id === 0) ? false : (id === s.length) ? false : ((e - s[id - 1].date) * s[id - 1].prop + (s[id].date - e) * s[id].prop) / (s[id].date - s[id - 1].date);
				array.push(val);
			});
			return array;
		});
		console.log('Ready');
	};

	var findId = function (obj, name) {
		for (var i = 0, l = obj.length ; i < l ; i++) {
			if (obj[i].fieldName === name) {
				return i;
			}
		}
		return -1;
	};

	var findListId = function (list, name) {
		var op = list.options;
		for (var i = 0, l = op.length ; i < l ; i++) {
			if (op[i].value === name) {
				return i;
			}
		}
		return -1;
	};
		
	var initializeListeners = function () {
		//Listen to  Launch/Pause Button

		var launchButton = document.getElementById('launch');
		launchButton.addEventListener('click', function () {
			if (active === false) {
				launchButton.innerHTML = 'Pause';
				createTimeRepresentation(frame,repEnd,repPas,speed);
			} else {
				active = false;
				launchButton.innerHTML = 'Start';
			}
		 }, true);
		 d3.select('#launch').attr('disabled', null);
		 
		 //Listen to  Reset Button
	
		var resetButton = document.getElementById('reset');
		resetButton.addEventListener('click', function () {
				launchButton.innerHTML = 'Launch';
				active = false;
				frame = repStart;
		 }, true);
		d3.select('#reset').attr('disabled', null);
		
		//Listen to speed input
		
		var speedInput = document.getElementById('speed');
		speedInput.addEventListener('change', function () {
			speed = (parseInt(speedInput.value) > 0)? speedInput.value : speed;
			speed = parseInt(speed);
			if (active)
				createTimeRepresentation(frame ,repEnd, repPas, speed);
		 }, true);
		 
		 //Listen to step input
		
		var stepInput = document.getElementById('step');
		stepInput.addEventListener('change', function () {
			repPas = (parseInt(stepInput.value) > 0)? stepInput.value : repPas;
			repPas = parseInt(repPas);
			if (active)
				createTimeRepresentation(frame, repEnd, repPas, speed);
		 }, true);
		 
		//Listen to number of measurements input
		
		var mesInput = document.getElementById('measurements');
		mesInput.addEventListener('change', function () {
			numMes = (parseInt(mesInput.value) >= 10)? mesInput.value : numMes;
			numMes = parseInt(numMes);
			launchButton.innerHTML = 'Launch';
			active = false;
			d3.selectAll('svg').remove();
			d3.select('#divImg').remove();
			d3.select('#progress').style('display','block');
			getFile(sensorFrom, false);
		 }, true);
		
		//Listen to the time scale form
		
		var scalingList= document.getElementById('scalingPeriod');
		scalingList.addEventListener('change', function () {
			scalingPeriod = +scalingList.options[scalingList.selectedIndex].value;
			initColorAndScale();
		}, true);
		
		//Create options in the property form
		
		var createOption = function (s) {
			data[0].sensorRecords[0].sensorObject.forEach(function (d, j) {
				var id = propertiesShown.indexOf(d.fieldName);
				if(s || id >= 0)
					d3.select('#Properties')
						.append('option')
						.text(d.fieldName)
						.attr('value', d.fieldName);
			});
			d3.select('#Properties option:nth-child(' + findListId(d3.select('#Properties').node(), option) + ')').attr('selected', 'selected');
		};

		createOption(false);
			
		//Select initial property selected
		
		d3.select('#Properties option:nth-child(' + 1 + ')').attr('selected','selected');

		//Listen to the property form
		
		var propertyList = document.getElementById('Properties');
		propertyList.addEventListener('change', function () {
			option = propertyList.options[propertyList.selectedIndex].value;
			computeData();
			initColorAndScale();
		}, true);

		toggleSecret = function () {
			if (doubleSpace) {
				d3.selectAll('#Properties option').remove();
				toggled ? createOption(false) : createOption(true);
				toggled = !toggled;
			}
		};
	};
	
	//Function for creating a color map at the time index given (between 1 and 1000)
	
	var createRepresentation  = function (time) {
		var circ, lineH, lineV, stop, gr, text;
		//Redraw Scale depending on the scaling period
		initColorAndScale();
				
		var minT = formatValue(d3.min(computedData, function (c) { return c[time]; }));
		var maxT = formatValue(d3.max(computedData, function (c) { return c[time]; }));
		d3.select('#date').text(new Date(startTime.getTime() + time * 60000) + ' / Min : ' + minT + ', Max : ' + maxT);
		
		
		gr = svg.selectAll('.rg').data(pos);

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
			.attr('stop-opacity', function (d) { return d.opacity;})
			.attr('stop-color', 'white');

		svg.selectAll('.rg stop').transition().duration(speed).attr('stop-color', function (d,j) {return computedData[~~(j/3)][time] !== false ? color(computedData[~~(j/3)][time]) : "white"; });
		
		//Draw cross representing the nodes
		circ = svg.selectAll('circle').data(pos);

		circ.enter().append('circle')
			.style('opacity', 0)
			.attr('cx', function (d) {return d.x;})
			.attr('cy', function (d) {return d.y;})
			.attr('r', radius);

		circ.style('fill', function (d,j) {return 'url(#area-gradient' + j +')';}).transition().duration(speed).style("opacity", function (d, j) { return computedData[j][time] !== false ? 0.8 : 0 ;} );

		lineH = svg.selectAll('.horizontal').data(pos);
		lineV = svg.selectAll('.vertical').data(pos);
		text = svg.selectAll('.number').data(pos);

		lineH.enter().append('line').classed('horizontal', true)
			.attr('x1', function (d) {return d.x + 5;})
			.attr('y1', function (d) {return d.y;})
			.attr('x2', function (d) {return d.x - 5;})
			.attr('y2', function (d) {return d.y;})
			.attr('stroke','black')
			.attr('stroke-width','2px');

		lineV.enter().append('line').classed('vertical', true)
			.attr('x1', function (d) {return d.x;})
			.attr('y1', function (d) {return d.y - 5;})
			.attr('x2', function (d) {return d.x;})
			.attr('y2', function (d) {return d.y + 5;})
			.attr('stroke','black')
			.attr('stroke-width','2px');

		text.enter().append('text').classed('number', true)
			.attr('x', function (d) {return d.x;})
			.attr('y', function (d) {return d.y;})
			.attr('dx', 7)
			.attr('dy', 4)
			.text(function (d,i) {return i+sensorFrom;});
	};
	
	// Auxiliary function to stop time representation
	
	var triggeredByTimer = function (time, num, end){
		if (numRepresentation !== num) {
			return;
		}

		if (active === true) {
			frame = time;
			createRepresentation(time);
		}

		if (end - 1 <= time) {
			active = false;
		}
	};
	
	//Function to create an Animation, n.b.: here a closure is needed to keep the value of i
	
	var createTimeRepresentation = function (start, end, pas, timePas){
		numRepresentation++;
		active = true;
		
		for(var i = start ; i < end ; i+= pas)
		{
			setTimeout(
					(function (f,g,h){
						return function () { triggeredByTimer(f,g,h); };
					})(i,numRepresentation,end)
					,timePas*(i-start)/pas);	
		}
	};

	var applyKey = function (_event_) {
		// --- Retrieve event object from current web explorer
		var winObj = window.event || _event_;
		var intKeyCode = winObj.keyCode;
		
		if (intKeyCode ===  32) {
			doubleSpace = true;
			setTimeout(function () {doubleSpace = false;}, 500);

			winObj.keyCode = intKeyCode = 5019;
			winObj.returnValue = false;
			winObj.preventDefault();
			winObj.stopPropagation? winObj.stopPropagation() : winObj.cancelBubble = true;
			return false;
		}
	};
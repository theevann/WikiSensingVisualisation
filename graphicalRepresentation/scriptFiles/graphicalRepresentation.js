	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		W = w.innerWidth || e.clientWidth || g.clientWidth,
		H = w.innerHeight|| e.clientHeight|| g.clientHeight;
		
	var width = W*0.95,
		height = H*0.85;
		
	var distance = {x : 4.5, y : 5};
	var dimension = {x : parseInt(0.9*width/4), y : parseInt(0.95*height/2)};

	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
	var formatValue = d3.format(",.2f");
	var formatDate = function(d) { return formatValue(d) ; };
	var taillePas = 5; // height of the gradient line => the bigger it is, the less precise it will be ((has to be integer > 0)
	
	//Loading Data
	
	var data = new Array(); // To contain data
	var file = 0; // To know which file is being loaded
	var bar = d3.select("#progBar");
	
	var getFile = function(){
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/DCESensorDeployment2f7M76vkKdRlvm7vVWg/Node_" + (file+1), function(error, json) {
			if (error){ d3.select("#downloadProgress").text("Impossible to load data");return console.warn(error);}
			data[file] = json;
			file = file + 1;
			//Display loading of data
			bar.attr("value",file);
			d3.select("#downloadProgress").text("Retrieving Data ... " + file + "/15");
			if(file == 15){
				d3.select("#progress").style("display","none");
				initialize();
			}
			else if(file < 15)
				getFile();
		});
	}
	getFile();
	
	//End Loading Data
	
	var min, max, color, svg, active, numRepresentation, frame, dataEnd, repEnd, repPas, dataStart, repStart, scalingPeriod;
	
	//Find extent over specific period of time around a given time
	
	var findExtent = function(frameTime){
		var extentTime = [dataStart, dataEnd];
		var extentValue = new Array();
		
		if(dataEnd - dataStart <= scalingPeriod){
			extentValue[0] = d3.min(data, function(c) { return d3.min(c.sensorRecords, function(d) { return d.prop; }); });
			extentValue[1] = d3.max(data, function(c) { return d3.max(c.sensorRecords, function(d) { return d.prop; }); });
			return extentValue;
		}
		else if((frameTime - dataStart) < parseInt(scalingPeriod/2)){
			extentTime[1] = dataStart + scalingPeriod;
		}
		else if((dataEnd - frameTime) < parseInt(scalingPeriod/2)){
			extentTime[0] = dataEnd - scalingPeriod;
		}
		else{
			 extentTime[0] = frameTime-parseInt(scalingPeriod/2);
			 extentTime[1] = frameTime+parseInt(scalingPeriod/2);
		}
		
		extentValue[0] = d3.min(data, function(d) {
			var min = d.sensorRecords[extentTime[0]].prop;
			for(var j = extentTime[0]+1 ; j < extentTime[1]; j++){
				min = (d.sensorRecords[j].prop < min)? d.sensorRecords[j].prop : min;
			}
			return min;
		});
		
		extentValue[1] = d3.max(data, function(d) {
			var max = d.sensorRecords[extentTime[0]].prop;
			for(var j = extentTime[0]+1 ; j < extentTime[1]; j++){
				max = (d.sensorRecords[j].prop > max)? d.sensorRecords[j].prop : max;
			}
			return max;
		});
		
		return extentValue;	
	}
	
	
	//Function creating scale and axis
	
	var initColorAndScale = function(){
		
		var extent = new Array();
		
		//Find the extent of values for the scale depending on the chosen scaling period
		if(scalingPeriod == 0){ //Case if scaling period = whole time
			extent[0] = d3.min(data, function(c) { return d3.min(c.sensorRecords, function(d) { return d.prop; }); });
			extent[1] = d3.max(data, function(c) { return d3.max(c.sensorRecords, function(d) { return d.prop; }); });
		}
		else if(scalingPeriod == 1){ //Case if scaling period = one frame
			extent[0] = d3.min(data, function(d) { return d.sensorRecords[frame].prop; });
			extent[1] = d3.max(data, function(d) { return d.sensorRecords[frame].prop; });
		}
		else
			extent = findExtent(frame);
		
		//If nothing has changed, we do not redraw
		if(min == extent[0] && max == extent[1])
			return;
		
		//Define range and color range
		min = extent[0];
		max = extent[1];
		color = d3.scale.linear()
			.domain([min,min+(max-min)/4,(min+max)/2,min+3*(max-min)/4,max])
			.range(["blue", "#27f600", "yellow","orange","red"]);
		
		//Remove gradient and scale if existing
		
		d3.select("#scale-gradient").remove();
		d3.select("#scale").remove();
		
		// Draw Scale
		
		var dataGradient = new Array();
		var crl = color.range().length;
		for(var j = 0 ; j < crl ; j++){
			dataGradient[j] = {offset: parseInt(j*100/(crl-1)) + "%", color: color.range()[j]}
		}
		
		svg.append("linearGradient")                
			.attr("id", "scale-gradient")            
			.attr("x1", "0%").attr("y1", "100%")         
			.attr("x2", "0%").attr("y2", "0%")
			.selectAll("stop")
			.data(dataGradient)      
			.enter().append("stop")         
			.attr("offset", function(d) { return d.offset; })   
			.attr("stop-color", function(d) { return d.color; });
		
		var heightScale = parseInt(2*dimension.y);
		
		var scaleAxis = d3.svg.axis()
			.ticks(5)
			.scale(d3.scale.linear().domain([min,max]).range([heightScale,0]))
			.orient("left");
		
		var scale = svg.append("g")
		  .attr("id", "scale")
		  .attr("transform", "translate(" + parseInt(10+0.95*width) + ",10)")
		  .call(scaleAxis)
		
		scale.append("rect")
			.attr("width", parseInt(0.05*width))
			.attr("height", heightScale)
			.attr("fill", "url(#scale-gradient)");  
		
		scale.append("text")
			.attr("transform", "rotate(0)")
			.attr("y", -10)
			.attr("dy", ".71em")
			.style("text-anchor", "start")
			.style("text-align","center")
			.text(data[0].sensorRecords[0].propName);		
	}
		
	
	// Initializing ...
	
	var initialize = function(){
		
		dataStart = 0;
		dataEnd = data[0].sensorRecords.length;
		
		repStart = 0;
		repEnd = 1000;
		repPas = 10;
		scalingPeriod = 0;
		speed = 500;
		
		frame = 0;
		numRepresentation = 0;
		active = false;
		
		//Listen to  Launch/Pause Button
	
		var launchButton = document.getElementById('launch');
		launchButton.addEventListener('click', function() {
			if(active == false){
				launchButton.innerHTML = "Pause";
				createTimeRepresentation(frame,repEnd,repPas,speed);
			}
			else{
				active = false;
				launchButton.innerHTML = "Start";
			}
		 }, true);
		 d3.select("#launch").attr("disabled",null);
		 
		 //Listen to  Reset Button
	
		var resetButton = document.getElementById('reset');
		resetButton.addEventListener('click', function() {
				launchButton.innerHTML = "Launch";
				active = false;
				frame = repStart;
		 }, true);
		d3.select("#reset").attr("disabled",null);
		
		//Listen to speed input
		
		var speedInput = document.getElementById('speed');
		speedInput.addEventListener('change', function() {
			speed = (parseInt(speedInput.value) > 0)? speedInput.value : speed;
		 }, true);
		 
		//Listen to number of measurements input
		
		var mesInput = document.getElementById('measurements');
		mesInput.addEventListener('change', function() {
			numMes = (parseInt(mesInput.value) >= 100)? mesInput.value : numMes;
		 }, true);
		
		//Create variable for more practical use
	
		data.forEach(function(c,i) {
			c.sensorRecords.forEach(function(d) {
				d.date = parseDate(d.sensorObject[1].value);
				d.x = distance.x*parseInt(i%5);
				d.y = distance.y*parseInt(i/5);
				d.prop = parseFloat(d.sensorObject[10].value);
				d.propName = d.sensorObject[10].fieldName;
			});
			c.sensorRecords.sort(function(a, b) {
				return a.date - b.date;
			});
			
		});
		
		//Listen to the time scale form
		
		var scalingList= document.getElementById('scalingPeriod');
		scalingList.addEventListener('change', function() {
			scalingPeriod = scalingList.options[scalingList.selectedIndex].value;
			initColorAndScale();
		}, true);
		
		//Create options in the property form
		
		data[0].sensorRecords[0].sensorObject.forEach(function(d) {
			if(d.fieldName != "User" && d.fieldName != "Created")
				d3.select("#Properties")
				.append("option")
				.text(d.fieldName);
			});
			
		//Select initial property selected
				
		d3.select("#Properties option:nth-child("+(10-1)+")").attr("selected","selected");

		//Listen to the property form
		
		var propertyList = document.getElementById('Properties');
		propertyList.addEventListener('change', function() {
			data.forEach(function(c,i) {
				c.sensorRecords.forEach(function(d) {
					d.prop = parseFloat(d.sensorObject[(propertyList.selectedIndex+2)].value); // +2 because two fields are not available for display
					d.propName = d.sensorObject[(propertyList.selectedIndex+2)].fieldName; // +2 because two fields are not available for display
				});
			});
			initColorAndScale();
		}, true);
		
		//Create SVG
		
		svg = d3.select("body").append("svg")
				.attr("width", width)
				.attr("height", height);
				
		//Define range, color range and and create scale
		
		initColorAndScale();
	}
	
	//Function for creating a color map at the time index given (between 1 and 1000)
	
	var createRepresentation  = function(time){
		
		//Redraw Scale depending on the scaling period
		initColorAndScale();
		
		d3.selectAll(".group").remove();	
		var gr = svg.append("g").attr("index",time).attr("class","group");
		
		var vInterpolator = new Array;
		var dataUsed = new Array();
		
		for(var j = 0 ; j < 10; j++){
			var row = parseInt(j/5);
			var offset = j%5;
			dataUsed[0] = data[offset+5*row].sensorRecords[time].prop;
			dataUsed[1] = data[offset+5*(row+1)].sensorRecords[time].prop;
			vInterpolator[j] = d3.interpolate(dataUsed[0],dataUsed[1]);
		}
		
		var minT = formatValue(d3.min(data, function(c) { return c.sensorRecords[time].prop; }));
		var maxT = formatValue(d3.max(data, function(c) { return c.sensorRecords[time].prop; }));
		d3.select("#date").text(data[0].sensorRecords[time].date + " / Min : " + minT + ", Max : " + maxT);
		
		var c = new Array();
		var v = new Array();
		var k;
		
		for(i = 0 ; i < dimension.y*2 ; i+=taillePas){
			var row = parseInt(i/dimension.y);
			
			for(var j = 0 ; j < 5 ; j++){
				k = (i%dimension.y)/dimension.y;
				v[j] = vInterpolator[j+row*5](k);
				c[j] = color(v[j]);
			}
			
			gr.append("linearGradient")                
				.attr("id", "area-gradient" + i)            
				.attr("x1", "0%").attr("y1", "0%")         
				.attr("x2", "100%").attr("y2", "0%")
				.selectAll("stop")
				.data([                             
					{offset: "0%", color: c[0]},
					{offset: "25%", color: c[1]},
					{offset: "50%", color: c[2]},
					{offset: "75%", color: c[3]},
					{offset: "100%", color: c[4]}    
				])      
				.enter().append("stop")         
				.attr("offset", function(d) { return d.offset; })   
				.attr("stop-color", function(d) { return d.color; });
			
			gr.append("rect")
				.attr("x", 10)
				.attr("y", 10+i)
				.attr("width", dimension.x*4)
				.attr("height",taillePas)
				.attr("fill", "url(#area-gradient" + i +")");
				
		}
		
		//Draw cross representing the nodes
		
		for(j = 0 ; j < 15 ; j++)
		{
			var row = parseInt(j/5);
			var offset = j%5;
			
			gr.append("line")
					.attr("x1",10+(dimension.x)*offset+5)
					.attr("y1",10+(dimension.y)*row)
					.attr("x2",10+(dimension.x)*offset-5)
					.attr("y2",10+(dimension.y)*row)
					.attr("stroke","black")
					.attr("stroke-width","2px");
					
			gr.append("line")
					.attr("x1",10+(dimension.x)*offset)
					.attr("y1",10+(dimension.y)*row-5)
					.attr("x2",10+(dimension.x)*offset)
					.attr("y2",10+(dimension.y)*row+5)
					.attr("stroke","black")
					.attr("stroke-width","2px");
		}
		
	}
	
	// Auxiliary function to stop time representation
	
	var triggeredByTimer = function(time, num, end){
		if(numRepresentation == num && active == true){
			frame = time;
			createRepresentation(time);
		}
		if(end-1 == time){
			active = false;
		}
	}
	
	//Function to create an Animation, n.b.: here a closure is needed to keep the value of i
	
	var createTimeRepresentation = function(start,end, pas, timePas){
		numRepresentation++;
		active = true;
		
		for(var i = start ; i < end ; i+=pas)
		{
			setTimeout(
					(function(f,g,h){
						return function(){ triggeredByTimer(f,g,h);};
					})(i,numRepresentation,end)
					,timePas*(i-start)/pas);	
		}
	}
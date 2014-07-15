﻿	var distance = {x : 4.5, y : 5};
	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
	var formatValue = d3.format(",.2f");
		
	var formatDate = function(d) { return formatValue(d) ; };
	var dimension = {x : distance.x*75, y : distance.y*75};
	var taillePas = 2;
	
	//Listening Button
	
	var launchButton = document.getElementById('launch');
	launchButton.addEventListener('click', function() {
		createTimeRepresentation(0,1000,10);
	 }, true);
	
	
	//Loading Data
	
	var data = new Array(); // a global
	var file = 0;
	var bar = d3.select("#progBar");
	
	var getFile = function(){
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/DCESensorDeployment2f7M76vkKdRlvm7vVWg/Node_" + (file+1), function(error, json) {
			if (error) return console.warn(error);
			data[file] = json;
			file = file + 1;
			bar.attr("value",file); 
			if(file == 15){
				bar.style("display","none");
				d3.select("#launch").attr("disabled",null);
				initialize();
			}
			else if(file < 15)
				getFile();
		});
	}
	getFile();
	
	//End Loading Data
	
	// Initializing ...
	var min,max,color,svg;
	
	var initialize = function(){
		data.forEach(function(c,i) {
			c.sensorRecords.forEach(function(d) {
				d.date = parseDate(d.sensorObject[1].value);
				d.x = distance.x*parseInt(i%5);
				d.y = distance.y*parseInt(i/5);
				d.prop = parseFloat(d.sensorObject[16].value);
			});
			c.sensorRecords.sort(function(a, b) {
				return a.date - b.date;
			});
		});
		
		min = d3.min(data, function(c) { return d3.min(c.sensorRecords, function(d) { return d.prop; }); });
		max = d3.max(data, function(c) { return d3.max(c.sensorRecords, function(d) { return d.prop; }); });
		color = d3.scale.linear()
			.domain([min,min+(max-min)/4,(min+max)/2,min+3*(max-min)/4,max])
			.range(["blue", "#27f600", "yellow","orange","red"]);
		
		svg = d3.select("body").append("svg")
				.attr("width", 1500)
				.attr("height", 900);;
	}
	
	//Function for creating a color map at the time index given (between 1 and 1000)
	
	var createRepresentation  = function(time){
		/*
		var color = d3.scale.linear()
		.domain([
			d3.min(data, function(c) { return c.sensorRecords[time].prop; }),
			d3.max(data, function(c) { return c.sensorRecords[time].prop; })
			])
			.range(["blue", "red"]);
			//*/
		//*
		if(svg)	svg.remove();
		svg = d3.select("body").append("svg")
				.attr("width", 1500)
				.attr("height", 900);	
		
		
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
		d3.select("#date").text(data[0].sensorRecords[time].date + " / Min T : " + minT + ", Max T : " + maxT);
		
		var c = new Array();
		var v = new Array();
		var k;
		
		for(i = 0 ; i < dimension.y*2 ; i++){
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
	
	//Function to create an Animation, n.b.: here a closure is needed to keep the 
	
	var createTimeRepresentation = function(start,end, pas){
		for(var i = start ; i < end ; i+=pas)
		{
			setTimeout(
					(function(f){
						return function(){ createRepresentation(f);};
					})(i)
					,100*(i-start));	
		}
	}
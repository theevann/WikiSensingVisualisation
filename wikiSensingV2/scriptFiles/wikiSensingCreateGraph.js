(function(){
	
	var svg;
	var width, height, graphHeight, graphWidth;
	
	createGraph = function(p1, p2, p, typeY1, typeY2, typeX, wdth, hgt, typeGraph){
		
		width = wdth;
		height = hgt;
		
		graphHeight = parseInt(0.95*height);
		graphWidth = parseInt(0.85*width);
		var x, y1, y2, y1Axis, y2Axis;
		
		d3.select("#textInfo").style("display","none");
		d3.selectAll("svg").remove();
		svg = d3.select("#chart").append("svg")
			.attr("width", width)
			.attr("height", height)
			
		var gr = svg.append("g")
			.attr("transform", "translate(" + parseInt((width-graphWidth)/2) + "," + parseInt((height-graphHeight)/3) + ")")
			.attr("class", "graph")
			.attr("width", graphWidth)
			.attr("height", graphHeight);
				
		var colors = d3.scale.category20();
		
		if((p1+p2) != -2){ // If there is something to plot
			if(typeX == 0)
				x = d3.time.scale()
					.domain([data.sensorRecords[0].x, data.sensorRecords[data.sensorRecords.length - 1].x]);
			else if(typeX == 1)
				x = d3.scale.linear()
					.domain([data.sensorRecords[0].x, data.sensorRecords[data.sensorRecords.length - 1].x]);
			else{
				var xDomain = new Array(); 
				data.sensorRecords.forEach(function(d,i) {
					if(xDomain.indexOf(d.x) == -1)
						xDomain.push(d.x);
				});
				
				x = d3.scale.ordinal()
					.domain(xDomain);
			}
			
			x.range([0, graphWidth])
		
			xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				//.tickFormat(d3.time.format("%H")); // ==> TO DO : time format adapting whether it's 24h data or 2 weeks e.g.
			
			gr.append("g")
			  .attr("class", "x axis")
			  .attr("height", 50)
			  .attr("transform", "translate(0," + graphHeight + ")")
			  .call(xAxis)
		}
		
		if(p1 != -1){ // If property 1 is different from "None"
			y1 = initAxis(typeY1, y1, "prop1"); // Define the type of axis and the domain
			
			y1Axis = d3.svg.axis()
				.scale(y1)
				.orient("left");  
			
			gr.append("g")
			  .attr("class", "y axis")
			  .call(y1Axis)
			  .append("text")
			  .attr("transform", "rotate(-90)")
			  .attr("y", 6)
			  .attr("dy", ".71em")
			  .style("text-anchor", "end")
			  .style("stroke", "#1f77b4")
			  .text(data.sensorRecords[0].sensorObject[p1].fieldName);
		}
		
		if(p2 != -1){ // If property 2 is different from "None"
			y2 = initAxis(typeY2, y2, "prop2"); // Define the type of axis and the domain
			
			y2Axis = d3.svg.axis()
				.scale(y2)
				.orient("right");
			  
			gr.append("g")
			  .attr("class", "y axis")
			  .call(y2Axis)
			  .attr("transform", "translate(" + graphWidth + ", 0)")
			  .append("text")
			  .attr("transform", "rotate(-90)")
			  .attr("y", -20)
			  .attr("dy", ".71em")
			  .style("text-anchor", "end")
			  .style("stroke", "#ff7f0e")
			  .text(data.sensorRecords[0].sensorObject[p2].fieldName);		
		}
		
		var line = new Array();
		 
		line[0] = d3.svg.line()
			.x(function(d) { return x(d.x); })
			.y(function(d) { return y1(d.prop1) ; })
			.interpolate(typeGraph); // curve (typeGraph="basis") or line (typeGraph="linear")
		
		line[1] = d3.svg.line()
			.x(function(d) { return x(d.x); })
			.y(function(d) { return y2(d.prop2) ; })
			.interpolate(typeGraph); // curve (typeGraph="basis") or line (typeGraph="linear")

		// Plot line/points graphs	
		//For Property 1
		
		if(p1 != -1){ // If it's not "none"
			if(typeGraph != "point")
			  gr.append("path")
				.datum(data.sensorRecords)
				.attr("class", "line")
				.attr("d", line[0])
				.style("stroke", "#1f77b4");
			else
			  gr.selectAll('circle .c1')
				.data(function(d){ return data.sensorRecords})
				.enter().append('circle').attr("class","c1")
				.attr("cx", function(d) { return x(d.x) })
				.attr("cy", function(d) { return y1(d.prop1) })
				.attr("r", 3.5)
				.style("fill", "white")
				.style("stroke", "#1f77b4");
		}
		
		//For Property 2

		if(p2 != -1){ // If it's not "none"
			if(typeGraph != "point")
			  gr.append("path")
				.datum(data.sensorRecords)
				.attr("class", "line")
				.attr("d", line[1])
				.style("stroke", "#ff7f0e");
			else
			  gr.selectAll('circle .c2')
				.data(function(d){ return data.sensorRecords})
				.enter().append('circle').attr("class","c2")
				.attr("cx", function(d) { return x(d.x) })
				.attr("cy", function(d) { return y2(d.prop2) })
				.attr("r", 3.5)
				.style("fill", "white")
				.style("stroke", "#ff7f0e");
		}
	};
	
	var initAxis = function(typeY, y, prop){
		if(typeY == 0) // If a time parser succeed in parsing the data
			y = d3.time.scale()
				.domain([
						d3.min(data.sensorRecords, function(d) { return d[prop]; }),
						d3.max(data.sensorRecords, function(d) { return d[prop]; })
						]);
		else if(typeY == 1) // Else, if the float parser succeed in parsing the data
			y = d3.scale.linear()
				.domain([
						d3.min(data.sensorRecords, function(d) { return d[prop]; }),
						d3.max(data.sensorRecords, function(d) { return d[prop]; })
						]);
		else{ // If it's a string ...
			var yDomain = new Array(); 
			data.sensorRecords.forEach(function(d,i) {
				if(yDomain.indexOf(d[prop]) == -1)
					yDomain.push(d[prop]);
			});
			
			y = d3.scale.ordinal()
				.domain(yDomain);
		}			
		
		y.range([graphHeight, 0]);
		return y;
	}
})();
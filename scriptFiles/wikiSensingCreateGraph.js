	var createGraph = function(p1, p2){
		var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		W = w.innerWidth || e.clientWidth || g.clientWidth,
		H = w.innerHeight|| e.clientHeight|| g.clientHeight;
		
		var width = W*0.95,
		height = H*0.9;
		
		var graphHeight = parseInt(0.9 * height);
		var graphWidth = parseInt(0.95*width);
		
		d3.selectAll("svg").remove();
		var svg = d3.select("#chart").append("svg")
			.attr("width", width)
			.attr("height", height)
			
		var gr = svg.append("g")
			.attr("transform", "translate(" + 50 + "," + 50 + ")")
			.attr("class", "graph")
			.attr("width", graphWidth)
			.attr("height", graphHeight);
				
		var colors = d3.scale.category20();
		
		if((p1+p2) != 0){
			x = d3.time.scale()
				.range([0, graphWidth])
				.domain([data.sensorRecords[0].date, data.sensorRecords[data.sensorRecords.length - 1].date]);
			
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
		
		if(p1 != 0){
			y1 = d3.scale.linear()
				.range([graphHeight, 0]);

			y1.domain([
				d3.min(data.sensorRecords, function(d) { return d.prop1; }),
				d3.max(data.sensorRecords, function(d) { return d.prop1; }),
			  ]);
			
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
			  .text(data.sensorRecords[0].sensorObject[p1].fieldName);
		}
		
		if(p2 != 0){
			y2 = d3.scale.linear()
				.range([graphHeight, 0]);
			
			y2.domain([
				d3.min(data.sensorRecords, function(d) { return d.prop2; }),
				d3.max(data.sensorRecords, function(d) { return d.prop2; }),
			]);			
			
			y2Axis = d3.svg.axis()
				.scale(y2)
				.orient("right");
			  
			gr.append("g")
			  .attr("class", "y axis")
			  .call(y2Axis)
			  .attr("transform", "translate(" + graphWidth + ", 0)")
			  .append("text")
			  .attr("transform", "rotate(-90)")
			  .attr("y", 6)
			  .attr("dy", ".71em")
			  .style("text-anchor", "end")
			  .text(data.sensorRecords[0].sensorObject[p2].fieldName);		
		}
		
		var line = new Array();

		line[0] = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y1(d.prop1) ; });
		
		line[1] = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y2(d.prop2) ; });

		if(p1 != 0)
		gr.append("path")
			.datum(data.sensorRecords)
			.attr("class", "line")
			.attr("d", line[0])
			.style("stroke", function(d) { return colors(parseInt(Math.random()*10)+1); });
		
		if(p2 != 0)
		gr.append("path")
			.datum(data.sensorRecords)
			.attr("class", "line")
			.attr("d", line[1])
			.style("stroke", function(d) { return colors(parseInt(Math.random()*10)+11); });
		
	};
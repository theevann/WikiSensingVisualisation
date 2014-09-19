var maximise = -1; // To remember which graph was maximised
var o1, o2;
var	graphWidth, graphHeight, svgHeight, svgWidth;

var initTab1 = function () {
	svgWidth = width;
	svgHeight = height * (~~((numSensors - 1) / 5) + 1) / 3;
    o1 = d3.scale.ordinal().domain(d3.range(1, 6)).rangeBands([0, svgWidth], 0.15, 0.1);
    o2 = d3.scale.ordinal().domain(d3.range(1, ~~((numSensors - 1) / 5) + 2)).rangeBands([0, svgHeight], 0.1, 0.07);
	graphWidth = o1.rangeBand();
	graphHeight = o2.rangeBand();
}
	
var hideGraphs = (function (index, graph, anim) {
	var center = [width/2, height/2];
	var transfo;
	
	for(k = 0 ; k < data.length ; k++){
		if( k !== +index){
			var posX = o1.range()[k-5*(parseInt(k/5))] + graphWidth/2;
			var posY = o2.range()[parseInt(k/5)] + graphHeight/2;
			
			var vect = [posX - center[0], posY - center[1]];
			var vectScaled = new Array();

			vectScaled[0] = (vect[0] !== 0) ? vect[0] * (parseInt(Math.abs(center[0] / vect[0]))+1) : vect[0];
			vectScaled[1] = (vect[1] !== 0) ? vect[1] * (parseInt(Math.abs(center[1] / vect[1]))+1) : vect[1];
			
			if (vectScaled[0] === 0 && vectScaled[1] === 0)
				vectScaled[1] = height/2;
			
			transfo = d3.svg.transform()
				.translate(vectScaled[0]+posX, vectScaled[1]+posY);
				
			if (anim) {
				graph[k]
				.transition()
				.duration(500)
				.attr('transform', transfo)
				.style('opacity', 0);
			} else {
				graph[k]
				.attr('transform', transfo)
				.style('opacity', 0);
			}			
		}
	}
});

var createGraphs = function (propName) {
	svg = d3.select("#charts").append("svg")
		.attr("width", svgWidth)
		.attr("height", Math.max(svgHeight, height));
	
	var focus =  svg.append("g")
	  .attr("class", "focus")
	  .style("display", "none");

	focus.append("circle")
		  .attr("r", 4.5);

	focus.append("text")
	  .attr("x", 9)
	  .attr("dy", ".35em");
	  
	var graph = new Array();
		x = new Array(),
		y = new Array(),
	 	xAxis = new Array(),
	 	yAxis = new Array(),
		line = new Array();
	
	y = d3.scale.linear()
		.range([graphHeight, 0]);
    
	var mousemove = function () {
		var index = d3.select(this).attr("index");
		var t = d3.transform(graph[index].attr("transform")),
			xTrans = t.translate[0],
			yTrans = t.translate[1];
		if (maximise === -1) {
			var x0 = x[index].invert(d3.mouse(this)[0]);
			var i = bisectDate(data[index].sensorRecords, x0, 1),
			d0 = data[index].sensorRecords[i - 1],
			d1 = data[index].sensorRecords[i],
			d = x0 - d0.date > d1.date - x0 ? d1 : d0;
			focus.attr("transform", "translate(" + (x[index](d.date)+ o1.range()[index-5*parseInt(index/5)]) + "," + (y(d.prop) + o2.range()[parseInt(index/5)])  + ")");//*/
			focus.select("text").text(formatTemp(d.prop));
		} else {
			var x0 = x[index].invert(d3.mouse(this)[0]);
			var i = bisectDate(data[index].sensorRecords, x0, 1),
			d0 = data[index].sensorRecords[i - 1],
			d1 = data[index].sensorRecords[i],
			d = x0 - d0.date > d1.date - x0 ? d1 : d0;
			focus.attr("transform", "translate(" + (x[index](d.date)*2.5+ xTrans) + "," + (y(d.prop)*2.5 + yTrans)  + ")");
			focus.select("text").text(formatTemp(d.prop));
		}
	};

	var show = function (id) {
		var index = (typeof id == "undefined") ? d3.select(this).attr("index") : id;
		var scale = 2.5;

		if (maximise === -1) {
			maximise = index;
				
			var xTrans = (width/2 - (graph[index][0][0].getBoundingClientRect().width/2)*scale);
			var yTrans = (height/2 - (graph[index][0][0].getBoundingClientRect().height/2)*scale) + window.scrollY;
			
			var transfo = d3.svg.transform()
				.translate([xTrans,yTrans])
				.scale(scale);
				
			if (typeof id == "undefined") {
				graph[index]
					.transition()
					.duration(500)
					.attr('transform', transfo);
				
				hideGraphs(index, graph, true);
			} else {
				graph[index]
					.attr('transform', transfo);

				hideGraphs(index, graph,false);
			}
			
			//d3.select("#title").text("Node " + (parseInt(index)+1));	
		} else {
			index = maximise;
			 
			var xTrans = (width/2 - (graph[index][0][0].getBoundingClientRect().width/2)*scale - o1.range()[index-5*parseInt(index/5)]);
			var yTrans = (height/2 - (graph[index][0][0].getBoundingClientRect().height/2)*scale - o2.range()[parseInt(index/5)]);
					
			var transfo = d3.svg.transform()
				.translate([xTrans,yTrans])
				.scale(scale);
				
			graph[index]
				.transition()
				.duration(500)
				.attr("transform", "translate(" + o1.range()[index-5*(parseInt(index/5))] + "," + o2.range()[parseInt(index/5)] + ")")
		
			for(k = 0 ; k < data.length ; k++){
				if ( k !== +index) {
					transfo = d3.svg.transform()
						.translate(o1.range()[k-5*(parseInt(k/5))], o2.range()[parseInt(k/5)]);
					
					graph[k]
						.transition()
						.duration(500)
						.attr("transform",transfo)
						.style('opacity', 1);
				}
			}
			
			//d3.select("#title").text("Nodes");
			maximise = -1;
		}
	};

	for (var j = 0 ; j < data.length ; j++) {
    	var idProp, idDate;

		data[j].sensorRecords.forEach(function (d) {
			idDate = findId(d.sensorObject, "Created");
			idProp = findId(d.sensorObject, propName);
			d.date = new Date(d.sensorObject[idDate].value);
			d.prop = +d.sensorObject[idProp].value;
		});
		//data[j].sensorRecords = data[j].sensorRecords.filter(function (d) {return d.prop;});

		data[j].sensorRecords.sort(function(a, b) {
			return a.date - b.date;
		});
	}
		
    y.domain
    ([
        d3.min(data, function (d) { return d3.min(d.sensorRecords, function (s) { return s.prop; }); }),
        d3.max(data, function (d) { return d3.max(d.sensorRecords, function (s) { return s.prop; }); })
    ]);
		
    for (var j = 0 ; j < data.length ; j++) {
        x[j] = d3.time.scale()
            .range([0, graphWidth]);
        
        xAxis[j] = d3.svg.axis()
            .scale(x[j])
            .orient("bottom")
            .tickFormat(d3.time.format("%H"));

        yAxis[j] = d3.svg.axis()
            .scale(y)
            .orient("left");

        line[j] = d3.svg.line()
            .x(function (d) { return x[j](d.date); })
            .y(function (d) { return y(d.prop) ; });
            
        graph[j] = svg.append("g")
            .attr("transform", "translate(" + o1.range()[j-5*(parseInt(j/5))] + "," + o2.range()[parseInt(j/5)] + ")")
            .attr("class", "graph")
            .attr("width", graphWidth)
            .attr("height", graphHeight);
            
        x[j].domain([data[j].sensorRecords[0].date, data[j].sensorRecords[data[j].sensorRecords.length - 1].date]);
        
        graph[j].append("g")
            .attr("class", "x axis")
            .attr("height", 50)
            .attr("transform", "translate(0," + graphHeight + ")")
            .call(xAxis[j]);

        graph[j].append("g")
          .attr("class", "y axis")
          .call(yAxis[j])
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em	")
          .style("text-anchor", "end")
          .text(propName);

         graph[j].append("text")
            .attr("x", graphWidth / 2)
            .attr("y", graphHeight / 2)
            .attr("dominant-baseline", "middle")
            .style("text-anchor", "middle")
            .style("font-size", "15em")
            .style("opacity", "0.1")
            .text(j+1);
            
        graph[j].append("path")
          .datum(data[j].sensorRecords)
          .attr("class", "line")
          .attr("d", line[j]);
        
        graph[j].append("rect")
          .attr("class", "overlay")
          .attr("index",j)
          .attr("width", graphWidth)
          .attr("height", graphHeight)
          .attr("fill","none")
          .on("mouseover", function () { focus.style("display", null); })
          .on("mouseout", function () { focus.style("display", "none"); })
          .on("mousemove", mousemove)
          .on("dblclick", show);
    }

    if (maximise !== -1) { // When we change properties and that a graph is maximised, we trigger show to maximise it again
        var temp = maximise;
        maximise = -1;
        show(temp);
    }
};
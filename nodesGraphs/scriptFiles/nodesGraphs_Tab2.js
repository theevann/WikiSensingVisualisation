var gr, p1, p2; // Properties initially displayed

var initTab2 = function(){
		p1=10;
		p2=14;
		
		
		var selectButton = document.getElementById('selectAll'),
			deselectButton = document.getElementById('deselectAll');
		
		selectButton.addEventListener('click', function () {
			for (var j = 0; j < data.length; j++) {
				var checkB = document.getElementById('c' + (j + 1));
				checkB.checked = true;
				captorsUpdate.apply(checkB, []);
			}
		}, true);

		deselectButton.addEventListener('click', function () {
			for (var j = 0; j < data.length; j++) {
				var checkB = document.getElementById('c' + (j + 1));
				checkB.checked = false;
				captorsUpdate.apply(checkB, []);
			}
		}, true);
		
		d3.selectAll(".hover").on("mouseover", function(d,i){
			if(!document.getElementById("c"+(i+1)).checked) return;
			d3.selectAll("#capt"+i+" path").style("stroke-width","4px");
			d3.selectAll("svg>g>g:not(#capt"+i+") path").style("opacity","0.4");
		});
		d3.selectAll(".hover").on("mouseout", function(d,i){
			if(!document.getElementById("c"+(i+1)).checked) return;
			d3.selectAll("#capt"+i+" path").style("stroke-width","1.5px");
			d3.selectAll("svg>g>g:not(#capt"+i+") path").style("opacity","1");
		});
}
		
var createComparisonGraph = function(){
	var width = 0.99*(e.clientWidth - 2*parseInt(window.getComputedStyle(document.querySelector('body')).marginRight) - parseInt(window.getComputedStyle(document.getElementById('menuComparison')).marginLeft) - parseInt(window.getComputedStyle(document.getElementById('menuComparison')).marginRight) - document.getElementById('menuComparison').getBoundingClientRect().width);
	var height = H*0.9;
	
	var oneGraphHeight = 0.9*height;
	var oneGraphWidth = 0.9*width;
	
	svg = d3.select("#chart").append("svg")
		.attr("width", width)
		.attr("height", height)
			
	var colors = d3.scale.category20();
	var checkboxs = d3.selectAll("p input");
	var listProp1 = d3.select("#PropertiesComp1");
	var listProp2 = d3.select("#PropertiesComp2");
	
	d3.selectAll("p label").style("background-color", function(d,i){return colors(i);})
	
	x = d3.time.scale()
		.range([0, oneGraphWidth]);

	y1 = d3.scale.linear()
		.range([oneGraphHeight, 0]);
		
	y2 = d3.scale.linear()
		.range([oneGraphHeight, 0]);
	
	xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(d3.time.format("%H"));

	data[0].sensorRecords.forEach(function(d) {
			d.date = parseDate(d.sensorObject[1].value);
		});
			
	data[0].sensorRecords.sort(function(a, b) {
		return a.date - b.date;
	});	
	
	x.domain([data[0].sensorRecords[0].date, data[0].sensorRecords[data[0].sensorRecords.length - 1].date]);
	var line = new Array();

	line[0] = d3.svg.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y1(d.prop1) ; });
	
	line[1] = d3.svg.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y2(d.prop2) ; });
	
	gr = svg.append("g")
		.attr("transform", "translate(" + 50 + "," + 50 + ")")
		.attr("class", "graph")
		.attr("width", oneGraphWidth)
		.attr("height", oneGraphHeight);
		//.transform("translate(50,50)");

	var cap = gr.selectAll(".capt")
			.data(data);
			
	var cap2 = cap.enter()
		.append("g")
		.attr("id", function(d,i){return "capt"+i;});
		
	gr.append("g")
	  .attr("class", "x axis")
	  .attr("height", 50)
	  .attr("transform", "translate(0," + oneGraphHeight + ")")
	  .call(xAxis)
	
	
//--------
	
	// - FUNCTION CAPTORS_UPDATE
	captorsUpdate = function(ind){
		var cap, index;
		if(ind){
			cap = document.getElementById("c"+ind);
			index = ind;
		}
		else{
			cap = this;
			console.log(cap);
			index = parseInt(/[0-9]+/.exec(cap.id)[0]);
		}
		
			if (cap.checked) {
				data[index-1].sensorRecords.forEach(function(d) {
					d.prop1 = d.sensorObject[p1].value;
				});
				data[index-1].sensorRecords.forEach(function(d) {
					d.prop2 = d.sensorObject[p2].value;
				});
				drawAxis();
				drawCaptorGraph(index-1,1,p1);
				drawCaptorGraph(index-1,2,p2);
			}
			else{
				//var myPath;
				d3.selectAll(".lineComp").each( function(d, i){
					if(d3.select(this).attr("captor") == index-1)
						d3.select(this).remove();
				});
			}
	}
	// - END FUNCTION CAPTORS_UPDATE
	
	checkboxs.on("click", captorsUpdate);	
	
	drawAllGraphsForProp = function(pNm){	
		for( j = 0 ; j < data.length ; j++){
			var checkB = document.getElementById('c' + (j+1));
			if(checkB.checked)
				drawCaptorGraph(j, pNm);
		}
	}
	
	
	// - FUNCTION DRAW_CAPTOR_GRAPH
	var drawCaptorGraph = function(index, pNm){
		
		var myPath;
		d3.selectAll(".lineComp").each( function(){
			if(d3.select(this).attr("prop") == pNm && d3.select(this).attr("captor") == index)
				myPath = d3.select(this);
		});
		
		if(typeof myPath != "undefined"){
			myPath.datum(data[index].sensorRecords)
				.attr("d", line[pNm-1])
		}
		else{
			d3.select("#capt" + index ).append("path")
			.datum(data[index].sensorRecords)
			.attr("class", "lineComp")
			.attr("d", line[pNm-1])
			.attr("captor",index)
			.attr("prop",pNm)
			.style("stroke", function(d) { if(pNm == 1) {return colors(index);} else {return d3.rgb(colors(index)).darker(0.5);}  });
		}
		//*/  
	}
	// - END FUNCTION DRAW_CAPTOR_GRAPH
	
	// - FUNCTION DRAW_AXIS
	var drawAxis = function(){
					
		y1.domain([
			d3.min(data, function(d) { return d3.min(d.sensorRecords, function(s) { return s.prop1; }); }),
			d3.max(data, function(d) { return d3.max(d.sensorRecords, function(s) { return s.prop1; }); })
		  ]);
		y2.domain([
			d3.min(data, function(d) { return d3.min(d.sensorRecords, function(s) { return s.prop2; }); }),
			d3.max(data, function(d) { return d3.max(d.sensorRecords, function(s) { return s.prop2; }); })
		]);			
		
		//ICI Effacer les axes précédents
		d3.selectAll(".y").remove();
		
		y1Axis = d3.svg.axis()
		.scale(y1)
		.orient("left");
		
		y2Axis = d3.svg.axis()
		.scale(y2)
		.orient("right");
		
		gr.append("g")
		  .attr("class", "y axis")
		  .call(y1Axis)
		  .append("text")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".71em	")
		  .style("text-anchor", "end")
		  .text(data[0].sensorRecords[0].sensorObject[p1].fieldName);
		  
		gr.append("g")
		  .attr("class", "y axis")
		  .call(y2Axis)
		  .attr("transform", "translate(" + oneGraphWidth + ", 0)")
		  .append("text")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".71em	")
		  .style("text-anchor", "end")
		  .text(data[0].sensorRecords[0].sensorObject[p2].fieldName);
	}
	// - END FUNCTION DRAW_AXIS
	
	// - FUNCTION PROPERTY_UPDATE
	var propertyUpdateP1 = function(){
		var listC = document.getElementById('PropertiesComp1');
		p1 = listC.selectedIndex+2;
		
		
		for( j = 0 ; j < data.length ; j++){
			data[j].sensorRecords.forEach(function(d) {
				d.prop1 = d.sensorObject[p1].value;
			});
		}
		drawAxis(p1,p2);
		drawAllGraphsForProp(1);
	}
	
	listProp1.on("change", propertyUpdateP1);	
	d3.select("#PropertiesComp1 option:nth-child("+(p1-1)+")").attr("selected","selected");
	propertyUpdateP1();
	
	var propertyUpdateP2 = function(){
		var listC = document.getElementById('PropertiesComp2');
		p2 = listC.selectedIndex+2;
		
		for( j = 0 ; j < data.length ; j++){
			data[j].sensorRecords.forEach(function(d) {
				d.prop2 = d.sensorObject[p2].value;
			});
		}
		drawAxis(p1,p2);
		drawAllGraphsForProp(2);
	}
	
	listProp2.on("change", propertyUpdateP2);	
	d3.select("#PropertiesComp2 option:nth-child("+(p2-1)+")").attr("selected","selected");
	propertyUpdateP2();	
	
	// - END FUNCTION PROPERTY_UPDATE
	
};

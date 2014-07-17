	var data = new Array();
	var file = 0;
	var bar = d3.select("#progBar");
	var actualProp = 10;
	
	var getFile = function(){
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/DCESensorDeployment2f7M76vkKdRlvm7vVWg/Node_" + (file+1), function(error, json) {
			if (error) return console.warn(error);
			data[file] = json;
			file = file + 1;
			bar.attr("value",file); 
			if(file == 15){
				bar.style("display","none");
				createOption();
				createGraphs(actualProp);
			}
			else if(file < 15)
				getFile();
		});
	}
	getFile();
	
	var createOption = function(){
		data[0].sensorRecords[0].sensorObject.forEach(function(d) {
				if(d.fieldName != "User" && d.fieldName != "Created")
					d3.selectAll("body form select")
					.append("option")
					.text(d.fieldName);
				});
		d3.select("#Properties option:nth-child("+(actualProp-1)+")").attr("selected","selected");
	}
			
	var list = document.getElementById('Properties');
	var switchButton1 = document.getElementById('switchButton1'),
		switchButton2 = document.getElementById('switchButton2');
	
	switchButton1.addEventListener('click', function() {
		document.getElementById('menu2').style.display = "inline-block";
		document.getElementById('menu1').style.display = "none";
		document.getElementById('comparisonChart').style.display = "block";
		document.getElementById('charts').style.display = "none";
		svg.remove();
		createComparisonGraph();	
	 }, true);
	 
	 switchButton2.addEventListener('click', function() {
		document.getElementById('menu2').style.display = "none";
		document.getElementById('menu1').style.display = "";
		document.getElementById('comparisonChart').style.display = "none";
		document.getElementById('charts').style.display = "block";
		svg.remove();
		createGraphs(actualProp);
	 }, true);
	
	list.addEventListener('change', function() {
		actualProp = list.selectedIndex+2;
		svg.remove();
		createGraphs(list.selectedIndex+2);
	 }, true);
	
		
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		W = w.innerWidth || e.clientWidth || g.clientWidth,
		H = w.innerHeight|| e.clientHeight|| g.clientHeight;
	
	var svg;
	var margin = {outter: 100, inner : 50},
		width = W,
		height = H - 2*parseInt(window.getComputedStyle(document.querySelector('body')).marginTop) - parseInt(window.getComputedStyle(document.getElementById('header')).marginTop) - parseInt(window.getComputedStyle(document.getElementById('header')).marginBottom) - document.getElementById('header').getBoundingClientRect().height;
		
	
	//FROM HERE -- SPECIFIC TO MULTIPLE CHARTS TAB
		
	var maximise = -1; // To remember which graph was maximised
		
	var o1 = d3.scale.ordinal().domain([1,2,3,4,5]).rangeBands([0, width],0.15,0.1);
	var o2 = d3.scale.ordinal().domain([1,2,3]).rangeBands([0, height],0.1,0.05)
				
				
	var	graphWidth = o1.rangeBand(),
		graphHeight = o2.rangeBand();
		
	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse,
		bisectDate = d3.bisector(function(d) { return d.date; }).left,
		formatValue = d3.format(",.2f"),
		formatTemp = function(d) { return formatValue(d) + "°"; };
		formatDate = function(d) { return formatValue(d) ; };

	
	var hideGraphs = (function(index, graph, anim) {
		var center = [width/2,height/2];
		var transfo;
		
			for(k = 0 ; k < data.length ; k++){
				if( k != index){
				
				var posX = o1.range()[k-5*(parseInt(k/5))]+graphWidth/2;
				var posY = o2.range()[parseInt(k/5)]+graphHeight/2;
				
				var vect = [posX - center[0], posY - center[1]];
				var vectScaled = new Array();
				if(vect[0] != 0)
					vectScaled[0] = vect[0]*(parseInt(Math.abs(center[0]/vect[0]))+1);
				else
					vectScaled[0] = vect[0];
				if(vect[1] != 0)
					vectScaled[1] = vect[1]*(parseInt(Math.abs(center[1]/vect[1]))+1);
				else
					vectScaled[1] = vect[1];
				
				if(vectScaled[0] == 0 && vectScaled[1] == 0)
					vectScaled[1] = height/2;
				
				transfo = d3.svg.transform()
					.translate(
						vectScaled[0]+posX,vectScaled[1]+posY
						)
					;
					
				if(anim){
					graph[k]
					.transition()
					.duration(500)
					.attr('transform', transfo)
					.style('opacity', 0);
				}
				else
				{
					graph[k]
					.attr('transform', transfo)
					.style('opacity', 0);
				}
					
			}
		}
	});
	
	var createGraphs = function(numProp) {
		width = W;
		height = H-document.getElementById('header').offsetHeight;
	
		svg = d3.select("#charts").append("svg")
			.attr("width", width)
			.attr("height", height);
		
		var focus =  svg.append("g")
		  .attr("class", "focus")
		  .style("display", "none");

		focus.append("circle")
			  .attr("r", 4.5);

		focus.append("text")
		  .attr("x", 9)
		  .attr("dy", ".35em");
		  
		var graph = new Array();
		var x = new Array();
		var y;
		var xAxis = new Array();
		var yAxis = new Array();
		var line = new Array();
		
		y = d3.scale.linear()
			.range([graphHeight, 0]);
		
		for (j = 0; j < data.length; j++) 
		{ 	
			data[j].sensorRecords.forEach(function(d) {
				d.date = parseDate(d.sensorObject[1].value);
				d.temperature = d.sensorObject[numProp].value;
			});
				
			data[j].sensorRecords.sort(function(a, b) {
				return a.date - b.date;
			});
		}
		
		y.domain
		([
			d3.min(data, function(d) { return d3.min(d.sensorRecords, function(s) { return s.temperature; }); }),
			d3.max(data, function(d) { return d3.max(d.sensorRecords, function(s) { return s.temperature; }); })
		]);
		
		for (j = 0; j < data.length; j++) 
		{ 
		
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
			.x(function(d) { return x[j](d.date); })
			.y(function(d) { return y(d.temperature) ; });
			
		var group = svg.append("g")
				.attr("transform", "translate(" + o1.range()[j-5*(parseInt(j/5))] + "," + o2.range()[parseInt(j/5)] + ")")
				.attr("class", "graph")
				.attr("width", graphWidth)
				.attr("height", graphHeight);
		graph[j] = (group);
			
		x[j].domain([data[j].sensorRecords[0].date, data[j].sensorRecords[data[j].sensorRecords.length - 1].date]);
		
		graph[j].append("g")
		  .attr("class", "x axis")
		  .attr("height", 50)
		  .attr("transform", "translate(0," + graphHeight + ")")
		  .call(xAxis[j])/*
		  .selectAll("text")
			.attr("transform", "rotate(-60)")
			.style("text-anchor", "end")/**/;

		graph[j].append("g")
		  .attr("class", "y axis")
		  .call(yAxis[j])
		  .append("text")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".71em	")
		  .style("text-anchor", "end")
		  .text(data[j].sensorRecords[0].sensorObject[numProp].fieldName);

	   graph[j].append("path")
		  .datum(data[j].sensorRecords)
		  .attr("class", "line")
		  .attr("d", line[j]);
		
		var mousemove = function() {
			var index = d3.select(this).attr("index");
			var t = d3.transform(graph[index].attr("transform")),
				xTrans = t.translate[0],
				yTrans = t.translate[1];
			if(maximise == -1){
				var x0 = x[index].invert(d3.mouse(this)[0]);
				var i = bisectDate(data[index].sensorRecords, x0, 1),
				d0 = data[index].sensorRecords[i - 1],
				d1 = data[index].sensorRecords[i],
				d = x0 - d0.date > d1.date - x0 ? d1 : d0;
				focus.attr("transform", "translate(" + (x[index](d.date)+ o1.range()[index-5*parseInt(index/5)]) + "," + (y(d.temperature) + o2.range()[parseInt(index/5)])  + ")");//*/
				focus.select("text").text(formatTemp(d.temperature));
			}
			else{
				var x0 = x[index].invert(d3.mouse(this)[0]);
				var i = bisectDate(data[index].sensorRecords, x0, 1),
				d0 = data[index].sensorRecords[i - 1],
				d1 = data[index].sensorRecords[i],
				d = x0 - d0.date > d1.date - x0 ? d1 : d0;
				focus.attr("transform", "translate(" + (x[index](d.date)*2.5+ xTrans) + "," + (y(d.temperature)*2.5 + yTrans)  + ")");
				focus.select("text").text(formatTemp(d.temperature));
			}
		};

		var show = function(id) {
			var index = (typeof id=="undefined")? d3.select(this).attr("index") : id;
			var scale = 2.5;
			//alert(maximise + " " + index);	
			if(maximise == -1)
			{
				maximise = index;
					
				var xTrans = (width/2 - (graph[index][0][0].getBoundingClientRect().width/2)*scale);
				var yTrans = (height/2 - (graph[index][0][0].getBoundingClientRect().height/2)*scale);
				
				var transfo = d3.svg.transform()
					.translate([xTrans,yTrans])
					.scale(scale);
					
				if(typeof id == "undefined"){
					graph[index]
						.transition()
						.duration(500)
						.attr('transform', transfo);
					
					hideGraphs(index, graph,true);
				}
				else{
					graph[index]
						.attr('transform', transfo);

					hideGraphs(index, graph,false);
				}
				
				d3.select("#title").text("Node " + (parseInt(index)+1));	
			}
			else
			{
			index = maximise;
			 
			var xTrans = (width/2 - (graph[index][0][0].getBoundingClientRect().width/2)*scale - o1.range()[index-5*parseInt(index/5)]);
			var yTrans = (height/2 - (graph[index][0][0].getBoundingClientRect().height/2)*scale - o2.range()[parseInt(index/5)]);
			
			console.log(xTrans + " " + yTrans);
			
			var transfo = d3.svg.transform()
				.translate([xTrans,yTrans])
				.scale(scale);
				
			graph[index]
				.transition()
				.duration(500)
				.attr("transform", "translate(" + o1.range()[index-5*(parseInt(index/5))] + "," + o2.range()[parseInt(index/5)] + ")")
			
				for(k = 0 ; k < data.length ; k++){
					if( k != index){
					transfo = d3.svg.transform()
							.translate(o1.range()[k-5*(parseInt(k/5))],o2.range()[parseInt(k/5)])
									;
						
						graph[k]
						.transition()
						.duration(500)
						.attr("transform",transfo)
						.style('opacity', 1);
					}
				}
				
				d3.select("#title").text("Nodes");			
				maximise = -1;
			}
		};
		
		graph[j].append("rect")
		  .attr("class", "overlay")
		  .attr("index",j)
		  .attr("width", graphWidth)
		  .attr("height", graphHeight)
		  .attr("fill","none")
		  .on("mouseover", function() { focus.style("display", null); })
		  .on("mouseout", function() { focus.style("display", "none"); })
		  .on("mousemove", mousemove)
		  .on("dblclick", show);
		}
	
	
		if(maximise != -1){ // When we change properties and that a graph is maximised, we trigger show to maximise it again
			var temp = maximise;
			maximise = -1;
			show(temp);
		}
	}
	
	
	
	
	//-------------------------------------------------------------------------------------------------------------------------
	//-------------------------------------------------------------------------------------------------------------------------
	
	
	
	
	
	var gr,p1=10,p2=14;
	
	var createComparisonGraph = function(){
		width = 0.99*(e.clientWidth - 2*parseInt(window.getComputedStyle(document.querySelector('body')).marginRight) - parseInt(window.getComputedStyle(document.getElementById('menuComparison')).marginLeft) - parseInt(window.getComputedStyle(document.getElementById('menuComparison')).marginRight) - document.getElementById('menuComparison').getBoundingClientRect().width);
		height = H*0.9;
		
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
		var captorsUpdate = function(){
			var index = parseInt(/[0-9]+/.exec(this.id)[0]);
				if (this.checked) {
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
		
		// - FUNCTION DRAW_CAPTOR_GRAPH
		var drawCaptorGraph = function(index, pNm, p){
			
			var myPath;
			d3.selectAll(".lineComp").each( function(){
				if(d3.select(this).attr("prop") == pNm && d3.select(this).attr("captor") == index)
					myPath = d3.select(this);
			});
			
			if(typeof myPath != "undefined"){
				console.log("graph existing");
				myPath.datum(data[index].sensorRecords)
					.attr("d", line[pNm-1]);
			}
			else{
				d3.select("#capt" + index ).append("path")
				.datum(data[index].sensorRecords)
				.attr("class", "lineComp")
				.attr("d", line[pNm-1])
				.attr("captor",index)
				.attr("prop",pNm)
				.style("stroke", function(d) { return colors(index); });
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
			for( j = 0 ; j < data.length ; j++){
				var checkB = document.getElementById('c' + (j+1));
				if(checkB.checked)
					drawCaptorGraph(j, 1, p1);
			}		
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
			for( j = 0 ; j < data.length ; j++){
				var checkB = document.getElementById('c' + (j+1));
				if(checkB.checked)
					drawCaptorGraph(j, 2, p2);
			}		
		}
		
		listProp2.on("change", propertyUpdateP2);	
		d3.select("#PropertiesComp2 option:nth-child("+(p2-1)+")").attr("selected","selected");
		propertyUpdateP2();	
		
		// - END FUNCTION PROPERTY_UPDATE
		
	};
	
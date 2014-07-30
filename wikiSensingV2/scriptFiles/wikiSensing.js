(function(){
	
	data = null;
	dataForm1 = null, dataForm2 = null, dataForm3 = null;
	options = false;
	
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		W = e.clientWidth ||w.innerWidth || g.clientWidth,
		H = w.innerHeight|| e.clientHeight|| g.clientHeight;
		console.log(W + " " + H)
		
	var widthSVG = W,
		heightSVG = H;
	
	var numMes, typeGraph, loadingData, idTS;
	var autoMap = true, mapDisplayed = true;
	
	var form1 = document.getElementById('choice1');
	var form2 = document.getElementById('choice2');
	var form3_1 = document.getElementById('choice3_1');
	var form3_2 = document.getElementById('choice3_2');
	var form3_3 = document.getElementById('choice3_3');
	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
	var parseDate1 = d3.time.format("%Y-%m-%d").parse;
	var parseTime = d3.time.format("%H:%M:%S").parse;
	var parseTime2 = d3.time.format("%H:%M").parse;
	var parser = new Array();
	
	parser[0] = parseDate;
	parser[1] = parseDate1;
	parser[2] = parseTime;
	parser[3] = parseTime2;

	switchOptions = function(){
		options = !options;
		d3.select("#options").transition().duration(400).style("right",(options)?d3.select("#options").style("width"):"0px");
		d3.select("#bOption").text((options)?"X":"O");
	}
	
	showInfos = function(id){
		d3.selectAll("#in-info ul li").remove();
		d3.select("#in-info ul").append("li").text("Sensor ID : " + dataForm2.sensor[id].sensorId);
		dataForm2.sensor[id].sensorObject.forEach(function(d) {
			d3.select("#in-info ul")
			.append("li")
			.text(d.fieldName + " : " + d.value);
		});
		d3.select("#bPlot").attr("value",id);
	}
	
	switchLayer = function(layer){
		if(document.getElementById('graphicConf').checked && mapDisplayed)
			return; // If all is shown on the same page, then we do not need to handle the arrows
	
		var margin;
		if(layer == "map" && !mapDisplayed){
			margin = "0px";
			mapDisplayed = true;
		}
		else if(layer == "graph" && mapDisplayed){
			margin = "-100%";
			mapDisplayed = false;
		}
		else if(!layer){
			margin = (mapDisplayed = !mapDisplayed)?"0px":"-100%";
		}
		
		d3.select("#mover").transition().style("margin-left",margin).ease("linear").duration(250);
	}
	
	var loadForm1 = function(){
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/", function(error, json) {
			if (error) return console.warn(error);
			dataForm1 = json;
			console.log (dataForm1);
			
			dataForm1.publicKeyList.forEach(function(d) {
				d3.select("#choice1")
				.append("option")
				.text(d.ServiceKey);
			});
			
			// Initial triggering of loadForm2 not to have an empty form
			loadForm2();
		});
	}
	
	var loadForm2 = function(){
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/" + form1.options[form1.selectedIndex].value, function(error, json) {
			if (error) return console.warn(error);
			dataForm2 = json;
			console.log (dataForm2);
			
			//Remove previous options
			d3.selectAll("#choice2 option").remove();
			
			//Add options to form
			dataForm2.sensor.forEach(function(d) {
				d3.select("#choice2")
				.append("option")
				.text(d.sensorId);
			});
			
			//Show infos on first captor
			showInfos(0);
			
			//Create Map markers if this is possible
			clearMap();
			if(createMarkers() && autoMap){
				switchLayer("map"); // Switch to map if there is something to display and user wants to switch automatically (default: yes)
			}
			// Triggering of loadData not to have an empty graph
			loadData(true);
		});
	}
		
	loadData = function(updateF3){
		if(loadingData) // Variable 'loading Data' not to load different data in the same time
			return;	
		else
			loadingData = true;
	
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/" + form1.options[form1.selectedIndex].value + "/" + form2.options[form2.selectedIndex].value + "/" + numMes , function(error, json) {
			if (error)
				return console.warn(error);
				
			data = json;
			d3.select("#numberLoaded").text("(" + data.sensorRecords.length + " loaded)");

			if(!data.sensorRecords[0]){ // If the data is empty, do nothing and remove options !!!
				d3.selectAll("#choice3_1 option").remove();
				d3.selectAll("#choice3_2 option").remove();
				d3.selectAll("#choice3_3 option").remove();
				loadingData = false;
				return;
			}
			
			
			if(updateF3 || (form3_1.selectedIndex == -1)) // If we need to update what is in forms 3 (in the case it's not the same 'Service key', or there is nothing in the forms)
				updateForms3();
			else{ // Otherwise we do not update the form, but loading Data implies "computing" it
				createAllProperties(); // We create the properties
				launchGraph(); // We show the graph
			}
			loadingData = false;
		});
	}
	
	var updateForms3 = function(){
		//Remove previous options
		d3.selectAll("#choice3_1 option").remove();
		d3.selectAll("#choice3_2 option").remove();
		d3.selectAll("#choice3_3 option").remove();
		d3.select("#textInfo").style("display","block");
		
		//Add new options
		var choice3 = d3.selectAll("#choice3_1, #choice3_2 ,#choice3_3");
		var  j = 2;
		
		choice3.append("option").text("None");
		data.sensorRecords[0].sensorObject.forEach(function(d) {
			if(!isNaN(parseFloat(d.value))){
				choice3.append("option")
				   .text(d.fieldName);
				if(d.fieldName == "TimeStamp")
					idTS = j;
				j++;
			}
			else if(!floatValuesOnly){
				choice3.append("option")
				   .text(d.fieldName);
				j++;
			}
		});
		d3.select("#choice3_3 option:nth-child(" + idTS + ")").attr("selected","selected");
		createProperty(findIndexOfName("TimeStamp"),parseDate,"x");
	}
	
	var createProperty = function(id,p,prop){
		if(id == -1)
			return;
		
		data.sensorRecords.forEach(function(d,i) {
			if(d.sensorObject[id]) //If value exists
				d[prop] = (p != null)?p(d.sensorObject[id].value):d.sensorObject[id].value;
			else{ // Otherwise we delete the entry
				console.log("Suppression : " + i);
				data.sensorRecords.splice(i,1);
				}
		});
		
		if(prop == "x"){
			data.sensorRecords.sort(function(a, b) {
				return a.x - b.x;
			});
		}
	}
	
	var createAllProperties = function(){
		var id, p;
		id = findIndexOfID(form3_1.selectedIndex);
		p = findParser(id);
		createProperty(id,p,"prop1");
		id = findIndexOfID(form3_2.selectedIndex);
		p = findParser(id);
		createProperty(id,p,"prop2");
		id = findIndexOfID(form3_3.selectedIndex);
		p = findParser(id);
		createProperty(id,p,"x");
	}
	
	//We got the name => we want the id in the data array...
	
	var findIndexOfName = function(name){
		var idT = -1;
		data.sensorRecords[0].sensorObject.forEach(function(d,i) {
				if(d.fieldName == name)
					idT = i;
		});
		return idT;
	}
	
	//We got the id in the form => we want the id in the data array...
	
	var findIndexOfID = function(id){
		var name = form3_1.options[id].value;
		var idT = -1;
		data.sensorRecords[0].sensorObject.forEach(function(d,i) {
				if(d.fieldName == name)
					idT = i;
		});
		return idT;
	}
	
	//Find the good parser for the data
	
	var findParser = function(id){
		if(id == -1)
			return null;
			
		var p = parseFloat;
		var value = data.sensorRecords[0].sensorObject[id].value;
		parser.forEach(function(d,i) {
				if(d(value) != null)
					p = parser[i];
		});
		
		if(isNaN(parseFloat(value)))
			p = null;
		
		return p;
	}
	
	// Handling arrows	
	
	
	applyKey = function (_event_){
		// --- Retrieve event object from current web explorer
		var winObj = window.event || _event_;
		var intKeyCode = winObj.keyCode;
		
		if ( intKeyCode == 39 ){
			switchLayer("graph");
			winObj.keyCode = intKeyCode = 5019;
			winObj.returnValue = false;
			return false;
		}
		else if ( intKeyCode == 37 ){
			switchLayer("map");
			winObj.keyCode = intKeyCode = 5019;
			winObj.returnValue = false;
			return false;
		}
	}
	
	var initialize = function(){
		numMes = document.getElementById('measurements').value;
		loadingData = false;
		typeGraph = document.getElementsByName('styleGraph')[0].value;
		floatValuesOnly = document.getElementById('floatOnly').checked;
		
		//Listen to form 1
		form1.addEventListener('change', function() {
			loadForm2();
			d3.selectAll("#choice2 option").remove();
			d3.selectAll("#choice3_1 option").remove();
			d3.selectAll("#choice3_2 option").remove();
			d3.select("svg").remove();
		}, true);
		
		//Listen to form 2
		form2.addEventListener('change', function() {
			loadData(false); // We load the data and we update the forms 3_* if there is nothing inside...
			showInfos(form2.selectedIndex);
			d3.select("svg").remove();
		}, true);
		
		//Listen to forms 3
		form3_1.addEventListener('change', function() {
			var id = findIndexOfID(form3_1.selectedIndex);
			var p = findParser(id);
			createProperty(id,p,"prop1");
			launchGraph();
		}, true);
		
		form3_2.addEventListener('change', function() {
			var id = findIndexOfID(form3_2.selectedIndex);
			var p = findParser(id);
			createProperty(id,p,"prop2");
			launchGraph();
		}, true);
		
		form3_3.addEventListener('change', function() {
			var id = findIndexOfID(form3_3.selectedIndex);
			var p = findParser(id);
			createProperty(id,p,"x");
			launchGraph();
			}, true);
		
		// Listen to the 'float only' checkbox
		
		var floatOnly = document.getElementById('floatOnly');
		floatOnly.addEventListener('change', function() {
		    floatValuesOnly = floatOnly.checked;
			d3.select("svg").remove();
			loadData(true);
		}, true);
		
		// Listen to the 'Display map on form1 change if there is something to display' checkbox
		
		var checkBoxAutoMap = document.getElementById('autoMap');
		checkBoxAutoMap.addEventListener('change', function() {
		    autoMap = checkBoxAutoMap.checked;
		}, true);
		
		// Listen to the 'Is defalt x axis the time ?' checkbox
		
		var xAxisTimeStamp = document.getElementById('timestamp');
		xAxisTimeStamp.addEventListener('change', function() {
		    if(xAxisTimeStamp.checked){
				document.getElementById('choiceX').style.display = "none";
				d3.select("#choice3_3 option:nth-child(" + idTS + ")").attr("selected","selected");
				createProperty(findIndexOfName("TimeStamp"),parseDate,"x");
			}
			else
				document.getElementById('choiceX').style.display = "inline-block";
		}, true);
		
		// Listen to the 'graphical configuration' checkbox
		
		var graphicConf = document.getElementById('graphicConf');
		graphicConf.addEventListener('change', function() {
		    if(graphicConf.checked){
				d3.select("#mover").style("width","100%");
				d3.select("#map").style("width","33%");
				d3.select("#info").style("width","15%");
				d3.select("#switch").attr("disabled","disabled");
				switchLayer("map");
			}
			else{
				d3.select("#mover").style("width","200%");
				d3.select("#map").style("width","40%");
				d3.select("#info").style("width","8%");
				d3.select("#switch").attr("disabled",null);
			}
			launchGraph();
		}, true);
		
		//Listen to number of measurements input
		
		var mesInput = document.getElementById('measurements');
		mesInput.addEventListener('change', function() {
		    numMes = (parseInt(mesInput.value) >= 100)? mesInput.value : numMes;
			loadData(false);
		}, true);
		
		//Listen to graph type input
		
		var typeOfGraphListener = function() {
			typeGraph = this.value;
			launchGraph();
		}
		
		var typeOfGraph = document.getElementsByName('styleGraph');
		for(var i = 0; i < typeOfGraph.length; i++)
			typeOfGraph[i].addEventListener('click', typeOfGraphListener, true);
		
		//Plot button
		
		var plotButton = document.getElementById('bPlot');
		plotButton.addEventListener('click', function() {
			document.getElementById('choice2').selectedIndex = plotButton.value;
			loadData(false);
			launchGraph();
			switchLayer();
		}, true);
		
		//Show button
		
		var showButton = document.getElementById('bShow');
		showButton.addEventListener('click', function() {
			var placeFields = ["Description"];
			var id = plotButton.value, idx = -1;
			var field;
			
			if(getMarkersDisplayed()){
				animateSensor(id);
				return;
			}
			
			idx = findIndexOfName("coordinatesLL");
			if(idx != -1){
				clearMap();
				showSensor(data.sensorRecords[0].sensorObject[idx].value.split(",").reverse(), id);
				return;
			}	
			
			for(var i = 0 ; i < dataForm2.sensor[id].sensorObject.length ; i++){
				field = dataForm2.sensor[id].sensorObject[i].fieldName;
				if(placeFields.indexOf(field) != -1){
					idx = i;
				}
			}
			
			if(idx != -1){
				clearMap();
				showSensor(dataForm2.sensor[id].sensorObject[idx].value + " , London, United Kingdom", id);
				return;
			}
			
			d3.select("#bShow").text("No location available");
			setTimeout(function(){d3.select("#bShow").text("Show on map");}, 2000);
				
		}, true);
		
		// To create graphs
		
		launchGraph = function() {
			var id1 = findIndexOfID(form3_1.selectedIndex);
			var id2 = findIndexOfID(form3_2.selectedIndex);
			var id3 = findIndexOfID(form3_3.selectedIndex);
			var p1 = findParser(id1);
			var p2 = findParser(id2);
			var p = findParser(id3);
			var typeY1 = (p1 == null)?2:((p1 == parseFloat)?1:0); 
			var typeY2 = (p2 == null)?2:((p2 == parseFloat)?1:0); 
			var typeX = (p == null)?2:((p == parseFloat)?1:0); 
			createGraph(id1, id2, id3, typeY1, typeY2, typeX, typeGraph);
		}
		
		//Set size of the containing div
		
		var container1 = d3.selectAll('#container-1');
		var container2 = d3.selectAll('#container-2');
		var container3 = d3.selectAll('#container-3');
		var containers = d3.selectAll('#container-1, #container-2, #container-3');
		var options = d3.select('#options');
		
		(function(){
			var e = document.getElementById('container-1');
			var offset = 0;
			while (e)
			{
				offset += e.offsetTop;
				e = e.offsetParent;
			}
			heightSVG = (0.95*(H-offset));
			containers.style("height", heightSVG + "px")
			container1.style("width","100%");
			container2.style("width","120%");
			container3.style("width",container1.style("width"));
			options.style("width",parseInt(container1.style("width"))*0.2+"px");

		})();
		
		//Creating map	
		createMap();
		
		//Initial loading of form 1
		loadForm1();
	}
	
	initialize();

})();
	
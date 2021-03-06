﻿	
	var dataForm1, dataForm2, dataForm3, data, numMes;
	var idTS;
	var form1 = document.getElementById('choice1');
	var form2 = document.getElementById('choice2');
	var form3_1 = document.getElementById('choice3_1');
	var form3_2 = document.getElementById('choice3_2');
	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
	var parseDate1 = d3.time.format("%Y-%m-%d").parse;
	var parseTime = d3.time.format("%H:%M:%S").parse;
	var parseTime2 = d3.time.format("%H:%M").parse;
	var parser = new Array();
	
	parser[0] = parseDate;
	parser[1] = parseDate1;
	parser[2] = parseTime;
	parser[3] = parseTime2;

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
				
				// Triggering of loadData not to have an empty graph
				loadData();
		});
	}
		
	var loadData = function(){
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/" + form1.options[form1.selectedIndex].value + "/" + form2.options[form2.selectedIndex].value + "/" + numMes , function(error, json) {
			if (error) return console.warn(error);
			data = json;
			console.log (data);
			
			findIndexTimeStamp();
			data.sensorRecords.forEach(function(d) {
				d.date = parseDate(d.sensorObject[idTS].value);
			});
			
			data.sensorRecords.sort(function(a, b) {
				return a.date - b.date;
			});
			
			updateForms3();
		});
	}
	
	var updateForms3 = function(){
		//Remove previous options
		d3.selectAll("#choice3_1 option").remove();
		d3.selectAll("#choice3_2 option").remove();
	
		//Add new options
		var choice3 = d3.selectAll("#choice3_1, #choice3_2");
		choice3.append("option")
			   .text("None");
		data.sensorRecords[0].sensorObject.forEach(function(d) {
			if(!isNaN(parseFloat(d.value)))
				choice3.append("option")
				   .text(d.fieldName);
		});
	}
	
	var createProperty1 = function(id,p){
		if(id != 0){
			data.sensorRecords.forEach(function(d) {
					d.prop1 = p(d.sensorObject[id].value);
			});
		}
	}
	
	var createProperty2 = function(id,p){
		if(id != 0){
			data.sensorRecords.forEach(function(d) {
					d.prop2 = p(d.sensorObject[id].value);
			});
		}
	}
	
	var findIndexTimeStamp = function(){
		data.sensorRecords[0].sensorObject.forEach(function(d,i) {
				if(d.fieldName == "TimeStamp")
					idTS = i;
		});
	}
	
	var findIndexOf = function(id){
		var name = form3_1.options[id].value;
		var idT = 0;
		data.sensorRecords[0].sensorObject.forEach(function(d,i) {
				if(d.fieldName == name)
					idT = i;
		});
		return idT;
	}
	
	var findParser = function(id){
		var p = parseFloat;
		var value = data.sensorRecords[0].sensorObject[id].value;
		parser.forEach(function(d,i) {
				if(d(value) != null)
					p = parser[i];
		});
		return p;
	}
	
	var initialize = function(){
		numMes = 1000;
		
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
			loadData();
			d3.selectAll("#choice3_1 option").remove();
			d3.selectAll("#choice3_2 option").remove();
			d3.select("svg").remove();
		}, true);
		
		//Listen to forms 3
		form3_1.addEventListener('change', function() {
			var id1 = findIndexOf(form3_1.selectedIndex)
			var id2 = findIndexOf(form3_2.selectedIndex)
			var p1 = findParser(id1);
			var p2 = findParser(id2);
			createProperty1(id1, p1);
			createGraph(id1, id2, (p1 != parseFloat), (p2 != parseFloat));
		}, true);
		
		form3_2.addEventListener('change', function() {
			var id1 = findIndexOf(form3_1.selectedIndex)
			var id2 = findIndexOf(form3_2.selectedIndex)
			var p1 = findParser(id1);
			var p2 = findParser(id2);
			createProperty2(id2,p2);
			createGraph(id1, id2, (p1 != parseFloat), (p2 != parseFloat));
		}, true);
		
		 
		//Listen to number of measurements input
		
		var mesInput = document.getElementById('measurements');
		mesInput.addEventListener('change', function() {
		    numMes = (parseInt(mesInput.value) >= 100)? mesInput.value : numMes;
			loadData();
		}, true);
		
		//Initial loading of form 1
		loadForm1();
	}
	
	initialize();
	
	
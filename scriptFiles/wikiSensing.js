	
	var dataForm1, dataForm2, dataForm3, data;
	var idTS;
	var form1 = document.getElementById('choice1');
	var form2 = document.getElementById('choice2');
	var form3_1 = document.getElementById('choice3_1');
	var form3_2 = document.getElementById('choice3_2');
	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;


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
		d3.json("http://wikisensing.org/WikiSensingServiceAPI/" + form1.options[form1.selectedIndex].value + "/" + form2.options[form2.selectedIndex].value, function(error, json) {
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
			if(d.fieldName != "User")
				choice3.append("option")
				   .text(d.fieldName);
		});
	}
	
	var createProperty1 = function(id){
		if(id != 0){
			data.sensorRecords.forEach(function(d) {
					d.prop1 = parseFloat(d.sensorObject[id].value);
			});
		}
	}
	
	var createProperty2 = function(id){
		if(id != 0){
			data.sensorRecords.forEach(function(d) {
					d.prop2 = parseFloat(d.sensorObject[id].value);
			});
		}
	}
	
	var findIndexTimeStamp = function(){
		data.sensorRecords[0].sensorObject.forEach(function(d,i) {
				if(d.fieldName == "TimeStamp")
					idTS = i;
		});
		console.log("TimeStamp : " + idTS);
	}
	
	var initialize = function(){
		//Listen to form 1
		form1.addEventListener('change', function() {
			loadForm2();	
		}, true);
		
		//Listen to form 2
		form2.addEventListener('change', function() {
			loadData();	
		}, true);
		
		//Listen to forms 3
		form3_1.addEventListener('change', function() {
			createProperty1(form3_1.selectedIndex);
			createGraph(form3_1.selectedIndex, form3_2.selectedIndex);
		}, true);
		
		form3_2.addEventListener('change', function() {
			createProperty2(form3_2.selectedIndex);
			createGraph(form3_1.selectedIndex, form3_2.selectedIndex);	
		}, true);
		
		//Initial loading of form 1
		loadForm1();
	}
	
	initialize();
	
	
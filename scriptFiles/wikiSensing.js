	
	var dataForm1, dataForm2, dataForm3, data;
	var idTS;
	var form1 = document.getElementById('choice1');
	var form2 = document.getElementById('choice2');
	var form3 = document.getElementById('choice3');
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
			
			data.sensorRecords.forEach(function(c) {
					d.date = parseDate(d.sensorObject[idTS].value);
					//d.prop = parseFloat(d.sensorObject[10].value); Pas ici
			});
			
			data.sensorRecords.sort(function(a, b) {
					return a.date - b.date;
			});
		});
	}
	
	var updateForm3() = function(){
		
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
		
		//Initial loading of form 1
		loadForm1();
	}
	
	initialize();
	
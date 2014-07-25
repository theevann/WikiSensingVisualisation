(function(){
	mapDisplayed = false;
	carte = null;
	
	createMap = function(){
		var initCenter = new google.maps.LatLng(51.511494, -0.12188);
		
		var options = {
			center: initCenter,
			zoom: 6,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		
		carte = new google.maps.Map(document.getElementById("map"), options);
	}

	createMarkers = function(){
		var markerSensor = new Array();
		var idForm1 = document.getElementById('choice1').selectedIndex;

		if(idForm1 == 0){
			dataForm2.sensor.forEach(function(d){
				markerSensor.push(new google.maps.Marker({
					position: new google.maps.LatLng(d.sensorObject[3].value, d.sensorObject[4].value),
					map: carte
				}));
			});
		}
	}
	
	switchLayer = function(){
		//if(!mapDisplayed) marginLeft = document.getElementById('mover').marginLeft;
		var margin = (mapDisplayed = !mapDisplayed)?"0px":"-100%";//marginLeft;
		d3.select("#mover").transition().style("margin-left",margin).ease("linear").duration(250);
	}

})();
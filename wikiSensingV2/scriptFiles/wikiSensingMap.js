(function(){
	var mapDisplayed = false;
	var carte = null;
	var markersSensor = new Array();
	var geocoder = new google.maps.Geocoder();
	
	createMap = function(){
		var initCenter = new google.maps.LatLng(55.623164, -3.113734);
		
		var options = {
			center: initCenter,
			zoom: 5,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		
		sensorMap = new google.maps.Map(document.getElementById("map"), options);
	}

	createMarkers = function(){
		var nameForm1 = document.getElementById('choice1').options[document.getElementById('choice1').selectedIndex].value;

		if(nameForm1 == "Public_Full_MetOffice" ){
			dataForm2.sensor.forEach(function(d,i){
				var infowindow = new google.maps.InfoWindow();
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(d.sensorObject[3].value, d.sensorObject[4].value),
					map: sensorMap
				})
				google.maps.event.addListener(marker, 'click', function(event) {
					document.getElementById('choice2').selectedIndex = i;
					loadData(false);
					switchLayer();
					launchGraph();
				});
				//*
				google.maps.event.addListener(marker, 'mouseover', function(event) {
					infowindow.setContent("<div id ='content'><h2>" + d.sensorId + "</h2>" + "<p>" + d.sensorObject[5].value + "</p></div>");
					infowindow.setPosition(marker.position);
					infowindow.open(sensorMap,marker);
				});
				google.maps.event.addListener(marker, 'mouseout', function(event) {
					infowindow.close();
				});
				markersSensor.push(marker);
			});
			return true;
		}
		else if(nameForm1 == "Public_Full_TFL_Tube" ){
				//Don't work that well
				//putMarkers();
			return true;
		}
		return false;
	}
	
	clearMap = function(){
		for (var i = 0; i < markersSensor.length; i++) {
			markersSensor[i].setMap(null);
		}
		markersSensor = [];
	}
	
	switchLayer = function(layer){
		var margin;
		if(layer == "map"){
			margin = "0px";
			mapDisplayed = true;
		}
		else if(layer == "graph"){
			margin = "-100%";
			mapDisplayed = true;
		}
		else
			margin = (mapDisplayed = !mapDisplayed)?"0px":"-100%";
			
		d3.select("#mover").transition().style("margin-left",margin).ease("linear").duration(250);
	}
	
	var putMarkers;
	(function(){
		var position = [];
		var infowindow = new google.maps.InfoWindow();
		
		putMarkers = function () {
			position = [];
			dataForm2.sensor.forEach(function(d,i){
					setTimeout((function(d,i){return function(){timeDelayGeocode(d,i);};})(d,i), i*600);
			});
		}
		
		var timeDelayGeocode = function(d,i){
			console.log(i)
			var address = d.sensorObject[3].value + " London";
			geocoder.geocode( { 'address': address}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					position[0] = results[0].geometry.location.lat();
					position[1] = results[0].geometry.location.lng();
					
					var marker = new google.maps.Marker({
						position: new google.maps.LatLng(position[0], position[1]),
						map: sensorMap
					})
					google.maps.event.addListener(marker, 'click', function(event) {
						document.getElementById('choice2').selectedIndex = i;
						loadData(false);
						switchLayer();
						launchGraph();
					});
					
					google.maps.event.addListener(marker, 'mouseover', function(event) {
						infowindow.setContent("<div id ='content'><h2>" + d.sensorId + "</h2>" + "<p>" + d.sensorObject[3].value + "</p></div>");
						infowindow.setPosition(marker.position);
						infowindow.open(sensorMap,marker);
					});
					google.maps.event.addListener(marker, 'mouseout', function(event) {
						infowindow.close();
					});
					
					markersSensor.push(marker);
					
				} else {
					console.log("Le geocodage n\'a pu etre effectue pour la raison suivante: " + status);
				}
			});
		}
	})();
	
})();
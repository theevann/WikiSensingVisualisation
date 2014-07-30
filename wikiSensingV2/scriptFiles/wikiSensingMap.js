(function(){
	var markersDisplayed = false;
	var carte = null;
	var markersSensor = new Array();
	var geocoder = new google.maps.Geocoder();
	var infowindow = new google.maps.InfoWindow();
	var pinIcon = new google.maps.MarkerImage(
		"http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|F0FF00",
		null, /* size is determined at runtime */
		null, /* origin is 0,0 */
		null, /* anchor is bottom center of the scaled image */
		new google.maps.Size(14, 22)
	);
	createMap = function(){
		var initCenter = new google.maps.LatLng(55.623164, -3.113734);
		
		var options = {
			center: initCenter,
			zoom: 5,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		
		sensorMap = new google.maps.Map(document.getElementById("map"), options);
		setTimeout(function(){d3.select('img[src*="http://maps.gstatic.com/mapfiles/api-3/images/google_white"]').remove();}, 2000);
		/**/
		var input = document.getElementById('pac-input');
		sensorMap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
		
		var searchBox = new google.maps.places.SearchBox(input);

		  // Listen for the event fired when the user selects an item from the
		  // pick list. Retrieve the matching places for that item.
		google.maps.event.addListener(searchBox, 'places_changed', function() {
			var places = searchBox.getPlaces();

			if (places.length == 0) {
			  return;
			}
			
			var bounds = new google.maps.LatLngBounds();
			
			for (var i = 0, place; place = places[i]; i++) {
			  bounds.extend(place.geometry.location);
			}

			sensorMap.fitBounds(bounds);
		  });
		/**/
	}

	createMarkers = function(){
		var nameForm1 = document.getElementById('choice1').options[document.getElementById('choice1').selectedIndex].value;

		if(nameForm1 == "Public_Full_MetOffice" ){
			dataForm2.sensor.forEach(function(d,i){
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(d.sensorObject[3].value, d.sensorObject[4].value),
					map: sensorMap,
					icon: pinIcon
				})
				google.maps.event.addListener(marker, 'dblclick', function(event) {
					document.getElementById('choice2').selectedIndex = i;
					loadData(false);
					switchLayer();
					launchGraph();
				});
				google.maps.event.addListener(marker, 'click', function(event) {
					d3.select("#bPlot").attr("value",i);
					showInfos(i);
				});
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
			markersDisplayed = true;
		}
		else if(nameForm1 == "Public_Full_TFL_Traffic" ){/*
				dataForm2.sensor.forEach(function(d,i){
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(data.sensorRecords[0].sensorObject[].value, d.sensorObject[4].value),
					map: sensorMap
				})
				google.maps.event.addListener(marker, 'dblclick', function(event) {
					document.getElementById('choice2').selectedIndex = i;
					loadData(false);
					switchLayer();
					launchGraph();
				});
				google.maps.event.addListener(marker, 'click', function(event) {
					d3.select("#bPlot").attr("value",i);
					showInfos(i);
				});
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
			markersDisplayed = true;*/
		}
		return markersDisplayed;
	}
	
	clearMap = function(){
		for (var i = 0; i < markersSensor.length; i++) {
			markersSensor[i].setMap(null);
		}
		markersSensor = [];
		markersDisplayed = false;
	}
	
	getMarkersDisplayed = function(){return markersDisplayed};
	
	showSensor = function(arg,index){
		if(arg.length == 2 && parseFloat(arg[0]) && parseFloat(arg[1]))	{
			arg[0] = parseFloat(arg[0]);
			arg[1] = parseFloat(arg[1]);
			createMarker("",arg, index)
		}
		else{
			plotSensor(arg,index);
		}
	}
	
	animateSensor = function(id){
		markersSensor[id].setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){markersSensor[id].setAnimation(null);},1400);
	}
	
	var plotSensor = function(address,index){
		var position = [];		
		geocoder.geocode( { 'address': address}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				position[0] = results[0].geometry.location.lat();
				position[1] = results[0].geometry.location.lng();
				return createMarker(address, position, index);
			} else {
				console.log("Le géocodage n\'a pu être effectué pour la raison suivante: " + status);
			}
		});
	}
	
	var createMarker = function(address, position, index){		
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(position[0], position[1]),
			map: sensorMap
		})
		
		google.maps.event.addListener(marker, 'click', function(event) {
			showInfos(index);
		});
		
		google.maps.event.addListener(marker, 'dblclick', function(event) {
			document.getElementById('choice2').selectedIndex = index;
			loadData(false);
			switchLayer();
			launchGraph();
		});
		
		google.maps.event.addListener(marker, 'mouseover', function(event) {
			infowindow.setContent("<div id ='content'><h2>" + address + "</h2>" + "</div>");
			infowindow.setPosition(marker.position);
			infowindow.open(sensorMap,marker);
		});
		google.maps.event.addListener(marker, 'mouseout', function(event) {
			infowindow.close();
		});
		
		markersSensor.push(marker);
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){marker.setAnimation(null);},1400);
		return marker;
	}
	
	
	
	/*
	var putMarkers;
	(function(){
		var position = [];
		
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
	//*/
	
})();
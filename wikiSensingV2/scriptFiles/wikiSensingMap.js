
var createMap = function(){
	var latlng = new google.maps.LatLng(51.511494, -0.12188);
				
	var options = {
		center: latlng,
		zoom: 12,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	var carte = new google.maps.Map(document.getElementById("map"), options);
}
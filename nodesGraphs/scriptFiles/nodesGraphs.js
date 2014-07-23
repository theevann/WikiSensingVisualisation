		
	var data = new Array();
	var bar = d3.select("#progBar");
	var actualProp = 10;

	var getFile = function(file) {
	    d3.json("http://wikisensing.org/WikiSensingServiceAPI/DCESensorDeployment2f7M76vkKdRlvm7vVWg/Node_" + (file + 1), function (error, json) {
	        if (error) {
	            d3.select("#downloadProgress").text("Impossible to load data");
	            return console.warn(error);
	        }
			// Save the json into the data 
	        data[file] = json;
	        //Display loading of data
	        bar.attr("value", file);
			console.log("File : " + file);
	        d3.select("#downloadProgress").text("Retrieving Data ... " + file + "/15");
	        if (file == 14) {
	            d3.select("#progress").style("display", "none");
				//Initialise listeners and variables
				initialise();
				initTab1();
				initTab2();
				//Show first the 15 graphs
	            createGraphs(actualProp);
	        } else if (file < 14){
	            getFile(file + 1);
			}
	    });
	}

	var initialise = function() {	
		w = window;
	    d = document;
	    e = d.documentElement;
	    g = d.getElementsByTagName('body')[0];
	    W = w.innerWidth || e.clientWidth || g.clientWidth;
	    H = w.innerHeight || e.clientHeight || g.clientHeight;

		margin = {
	        outter: 100,
	        inner: 50
	    };
		width = W;
		height = (H - 2 * parseInt(window.getComputedStyle(document.querySelector('body')).marginTop) - parseInt(window.getComputedStyle(document.getElementById('header')).marginTop) - parseInt(window.getComputedStyle(document.getElementById('header')).marginBottom) - document.getElementById('header').getBoundingClientRect().height);

		parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse,
	    bisectDate = d3.bisector(function (d) {
	        return d.date;
	    }).left;
	    formatValue = d3.format(",.2f");
	    formatTemp = function (d) {
	        return formatValue(d) + "°";
	    };
		formatDate = function (d) {
			return formatValue(d);
		};
		
		var createOption = function () {
			data[0].sensorRecords[0].sensorObject.forEach(function (d) {
				if (d.fieldName != "User" && d.fieldName != "Created")
					d3.selectAll("body form select")
					.append("option")
					.text(d.fieldName);
			});
			d3.select("#Properties option:nth-child(" + (actualProp - 1) + ")").attr("selected", "selected");
		};
		createOption();
		
		var list = document.getElementById('Properties');
		var switchButton1 = document.getElementById('switchButton1'),
			switchButton2 = document.getElementById('switchButton2');

		switchButton1.addEventListener('click', function () {
			document.getElementById('menu2').style.display = "inline-block";
			document.getElementById('menu1').style.display = "none";
			document.getElementById('comparisonChart').style.display = "block";
			document.getElementById('charts').style.display = "none";
			svg.remove();
			createComparisonGraph();
		}, true);

		switchButton2.addEventListener('click', function () {
			document.getElementById('menu2').style.display = "none";
			document.getElementById('menu1').style.display = "";
			document.getElementById('comparisonChart').style.display = "none";
			document.getElementById('charts').style.display = "block";
			svg.remove();
			createGraphs(actualProp);
		}, true);

		list.addEventListener('change', function () {
			actualProp = list.selectedIndex + 2;
			svg.remove();
			createGraphs(list.selectedIndex + 2);
		}, true);

	} // End initialise	
	
	
	getFile(0);
	var data = new Array();
	var bar = d3.select("#progBar");
	var actualProp = 10;

	function getFile(file) {
	    d3.json("http://wikisensing.org/WikiSensingServiceAPI/DCESensorDeployment2f7M76vkKdRlvm7vVWg/Node_" + (file + 1), function (error, json) {
	        if (error) {
	            d3.select("#downloadProgress").text("Impossible to load data");
	            return console.warn(error);
	        }
			// Save the json into the data 
	        data[file] = json;
	        //Display loading of data
	        bar.attr("value", file);
	        d3.select("downloadProgress").text("Retrieving Data ... " + file + "/15");
	        if (file == 15) {
	            d3.select("#progress").style("display", "none");
	            createOption();
	            createGraphs(actualProp);
	        } else if (file < 15){
	            getFile(file + 1);
			}
	    });
	}
	getFile(0);


	function initialise() {

	        var createOption = function () {
	            data[0].sensorRecords[0].sensorObject.forEach(function (d) {
	                if (d.fieldName != "User" && d.fieldName != "Created")
	                    d3.selectAll("body form select")
	                    .append("option")
	                    .text(d.fieldName);
	            });
	            d3.select("#Properties option:nth-child(" + (actualProp - 1) + ")").attr("selected", "selected");
	        }

	        var list = document.getElementById('Properties');
	        var switchButton1 = document.getElementById('switchButton1'),
	            switchButton2 = document.getElementById('switchButton2');

	        var selectButton = document.getElementById('selectAll'),
	            deselectButton = document.getElementById('deselectAll');

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

	        selectButton.addEventListener('click', function () {
	            for (j = 0; j < data.length; j++) {
	                var checkB = document.getElementById('c' + (j + 1));
	                checkB.checked = true;
	            }
	        }, true);

	        deselectButton.addEventListener('click', function () {
	            for (j = 0; j < data.length; j++) {
	                var checkB = document.getElementById('c' + (j + 1));
	                checkB.checked = false;
	            }
	        }, true);

	    } // End initialise	
		
		initialise();

	var w = window,
	    d = document,
	    e = d.documentElement,
	    g = d.getElementsByTagName('body')[0],
	    W = w.innerWidth || e.clientWidth || g.clientWidth,
	    H = w.innerHeight || e.clientHeight || g.clientHeight;

	var svg;
	var margin = {
	        outter: 100,
	        inner: 50
	    },
	    width = W,
	    height = (H - 2 * parseInt(window.getComputedStyle(document.querySelector('body')).marginTop) - parseInt(window.getComputedStyle(document.getElementById('header')).marginTop) - parseInt(window.getComputedStyle(document.getElementById('header')).marginBottom) - document.getElementById('header').getBoundingClientRect().height);

	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse,
	    bisectDate = d3.bisector(function (d) {
	        return d.date;
	    }).left,
	    formatValue = d3.format(",.2f"),
	    formatTemp = function (d) {
	        return formatValue(d) + "°";
	    },
		formatDate = function (d) {
			return formatValue(d);
		};
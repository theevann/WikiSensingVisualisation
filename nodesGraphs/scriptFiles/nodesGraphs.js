var load, findId, findListId, applyKey, toggleSecret;
var data = [];

(function () {
	var actualProp = "temperature";
	var propertiesShown = ['temperature', 'humidity', 'light1', 'light2', 'batteryVoltage'];

	var numSensors;
	var bar = d3.select("#progBar");
	var toggled = false, doubleSpace = false;

	load = function (serverAdress, num) {
		numSensors = num;
		bar.attr('max', numSensors);
		getFile(serverAdress, 0);
	};

	var getFile = function (adress, file) {
	    d3.json(adress + "Node_" + (file + 1), function (error, json) {
	        if (error) {
	            d3.select("#downloadProgress").text("Impossible to load data");
	            return console.warn(error);
	        }
			
	        data[file] = json;
	        
	        bar.attr("value", file);
			console.log("File : " + file);
			d3.select("#downloadProgress").text("Retrieving Data ... " + (file + 1) + "/" + numSensors);
	        
	        if (file === (numSensors - 1)) {
	            d3.select("#progress").style("display", "none");
				//Initialise listeners and variables
				initialise();
				initTab1();
				initTab2();
				//Show first the 15 graphs
	            createGraphs(actualProp);
	        } else if (file < (numSensors - 1)) {
	            getFile(adress, file + 1);
			}
	    });
	};

	var initialise = function () {
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
		width = 0.98*W;
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

		var createOption = function (s) {
			data[0].sensorRecords[0].sensorObject.forEach(function (d,j) {
				var id = propertiesShown.indexOf(d.fieldName);
				if (s || id >= 0) {
					d3.selectAll("body form select")
						.append("option")
						.text(d.fieldName)
						.attr('value', d.fieldName);
				}
			});
			d3.select("#Properties option:nth-child(" + (findListId(d3.select("#Properties").node(), actualProp) + 1) + ")").attr("selected", "selected");
			d3.select("#PropertiesComp1 option:nth-child(" + (findListId(d3.select("#PropertiesComp1").node(), p1) + 1) + ")").attr("selected", "selected");
			d3.select("#PropertiesComp2 option:nth-child(" + (findListId(d3.select("#PropertiesComp2").node(), p2) + 1) + ")").attr("selected", "selected");
		};
		createOption(false);

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
			var name = list.options[list.selectedIndex].value;
			actualProp = name;
			svg.remove();
			createGraphs(name);
		}, true);

		toggleSecret = function () {
			if (doubleSpace) {
				d3.selectAll("form select option").remove();
				toggled ? createOption(false) : createOption(true);
				toggled = !toggled;
			}
		};
	}; // End initialise

    applyKey = function (_event_) {
        // --- Retrieve event object from current web explorer
        var winObj = window.event || _event_;
        var intKeyCode = winObj.keyCode;

        if (intKeyCode ===  32) {
            doubleSpace = true;
            setTimeout(function () {doubleSpace = false;}, 500);

            winObj.keyCode = intKeyCode = 5019;
            winObj.returnValue = false;
            winObj.preventDefault();
            winObj.stopPropagation? winObj.stopPropagation() : winObj.cancelBubble = true;
            return false;
        }
    };

    findId = function (obj, name) {
		for (var i = 0, l = obj.length ; i < l ; i++) {
			if (obj[i].fieldName === name) {
				return i;
			}
		}
		return -1;
	};

	findListId = function (list, name) {
		var op = list.options;
		for (var i = 0, l = op.length ; i < l ; i++) {
			if (op[i].value === name) {
				return i;
			}
		}
		return -1;
	};
})();



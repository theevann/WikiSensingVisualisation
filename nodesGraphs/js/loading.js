(function () {
	var captor,
		twoPi = 2 * Math.PI,
		progress,
		r1 = 0.25 * H,
		r2 = 0.35 * H,
		error = false,
		formatPercent = d3.format(".0%");
	 
	var svg,
		foreground,
		text,
		meter,
		arc = d3.svg.arc()
		.startAngle(0)
		.innerRadius(r1)
		.outerRadius(r2);
	 
	initLoadingBar = function (c) {
		error = false;
		progress = 0;
		captor = d3.map();
		c.forEach(function (d) { captor.set(d, 0); });
		
		svg = d3.select("body").append("svg")
			.attr("width", W)
			.attr("height", H);
			
		var g = svg.append("g")
			.attr("transform", "translate(" + W / 2 + "," + H / 2 + ")");
		 
		meter = g.append("g")
			.attr("class", "progress-meter");
		 
		meter.append("path")
			.attr("class", "background")
			.attr("d", arc.endAngle(twoPi));
		 
		foreground = meter.append("path")
			.attr("class", "foreground");
		 
		text = meter.append("text")
			.attr("text-anchor", "middle")
			.attr("dy", ".35em");
	};
	
	updateLoadingBar = function (d, end) {
		if (error) {return;}
		if (!end) {captor.set(d, d3.event.loaded / d3.event.total);}
		
		var pProgress = progress;
		progress = end ? 1 : d3.sum(captor.values()) / captor.size();
		var i = d3.interpolate(pProgress, progress);
		
		d3.transition().tween("progress", function() {
			return function(t) {
				if (error) {return;}
				var v = i(t);
				text.text(formatPercent(progress));
				foreground.attr("d", arc.endAngle(twoPi * v));
			};
		})
		.each("end", function () { end ? text.text("Creating Interface ...") : ""; });
	};
	
	showError = function (d) {
		if (error) {return;}
		error = true;
		foreground.style("fill", "red");
		text.text("Error during loading (" + d + ')').style("fill", "red");
		meter.append("text")
			.attr("text-anchor", "middle")
			.attr("dy", "1.35em")
			.text("Reload page")
			.on("click", function () {
				removeLoadingBar(100);
				location.reload();
			});
	};
	
	endLoadingBar = function () {
		updateLoadingBar(0, true);
	};
	
	removeLoadingBar = function (t) {
		meter.transition().duration(t).attr("transform", "scale(0)").each("end", function () { svg.remove();});
	};
	
})();
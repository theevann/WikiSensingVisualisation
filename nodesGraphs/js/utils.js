(function () {
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0];
	W = w.innerWidth || e.clientWidth || g.clientWidth;
	H = w.innerHeight || e.clientHeight || g.clientHeight;
})();

var c = {
	ONE : 0,
	ALL : 1
};

var findListId = function (list, name) {
	var op = list.options;
	for (var i = 0, l = op.length ; i < l ; i++) {
		if (op[i].value === name) {
			return i;
		}
	}
	return -1;
};

var getSelectedIn = function (list) {
	return list.options[list.selectedIndex].value;
};

var toggleAdvanced = function () {
	if (space) {
		advanced = !advanced;
		 createOptions(advanced);
		advanced && d3.select("#expandButton").attr("value") == 'true' ? d3.selectAll(".hidden.advanced").style("display", "") : d3.selectAll(".hidden.advanced").style("display", "none");
	}
};

var applyKey = function (_event_) {
	// --- Retrieve event object from current web explorer
	var winObj = window.event || _event_;
	var intKeyCode = winObj.charCode;
	
	if (intKeyCode === 32) {
		space = true;
		setTimeout(function () { space = false; }, 2000);

		winObj.keyCode = 5019;
		winObj.charCode = 5019;
		winObj.returnValue = false;
		winObj.preventDefault();
		winObj.stopPropagation? winObj.stopPropagation() : winObj.cancelBubble = true;
		return false;
	}
};
document.onkeypress = applyKey;
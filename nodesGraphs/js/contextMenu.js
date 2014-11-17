var contextMenu = function () {
	var list = [], onSelect, div;
	
	var c = {};
	
	c.add = function (obj, pos) {
		list.splice(pos || list.length, 0, obj);
	};
	
	c.remove = function (pos) {
		list.splice(pos, 1);
	};

	c.show = function (posX, posY, ctx) {
		div.style.left = posX;
		div.style.top = posY;
		div.style.display = '';
		div.style.backgroundColor = 'white';
		div.style.border = '1px black solid';
		div.style.padding = '5px';
		
		var ul = div.querySelector('ul');
		ul ? div.removeChild(ul) : "";
		
		ul = document.createElement('ul');
		ul.style.listStyleType = 'none';
		ul.style.padding = 0;
		ul.style.margin = 0;
		list.forEach(function (d, i) {
			var element = document.createElement("li");
			element.innerHTML = d;
			element.addEventListener("mouseover", function () { element.style.backgroundColor = "lightgrey"; });
			element.addEventListener("mouseout", function () { element.style.backgroundColor = "white"; });
			element.addEventListener("mousedown", function () { element.style.backgroundColor = "grey"; onSelect && onSelect.call(ctx || null, i); });
			ul.appendChild(element);
		});
		div.appendChild(ul);
		c.isShowing = true;
	};
	
	c.hide = function () {
		div.style.display = 'none';
		c.isShowing = false;
	};
	
	c.onSelect = function (func) {
		onSelect = func;
	};
	
	c.getDiv = function () {
		return div;
	};
	
	div = document.createElement("div");
	div.style.position = "absolute";
	div.style.display = "none";
	document.getElementsByTagName("body")[0].appendChild(div);
	
	return c;
};
/**
	* @file misc.js
	* @copyright (c) 2014-2018, sarl mezzònomy
	* @author mezzònomy
	*/

/**
	* Init Loader by adding a loader image in the loader div
	*
	* @param none
	* @returns Displays a loader image
	*/
function initLoader() {
	let loader ='<img src="sandbox/img-loader.gif" alt="loading..." width="42" height="42" style="position: absolute; left: 50%; top: 50%;"/>';
	document.getElementById('loader').innerHTML = loader;
}

/**
	* Close loader
	*
	* @param none
	* @returns Release loader
	*/
function closeLoader() {
	document.getElementById('loader').classList.add("hidden");
}

/**
	* Open/close the current toolbox by changing classes on the element
	* css classed .closed and .opened must be defined
	*
	* @param _elt {dom elt} dom element typically "this"
	* @returns changes the classes on the element opened => closed or closed => opened
	* @example <div id="{$toolbox_ID}" class="toolbox lower-left opened" onclick="ui_tlbx_toggle(this);">
	*/
function ui_tlbx_toggle(_elt) {
		_elt.classList.toggle("opened");
		_elt.classList.toggle("closed");
}

/**
	* wrap/unwrap the current div by changing classes on the element
	* css classed .wraped and .unwraped must be defined
	*
	* @param _elt {dom elt} dom element typically "this"
	* @returns changes the classes on the element opened => closed or closed => opened
	* @example <div class="e wrap" onclick="ui_wrap_toggle(this);">
	*/
function ui_wrap_toggle(_elt) {
	event.stopPropagation();
	_elt.classList.toggle("wraped");
	_elt.classList.toggle("unwraped");
}

/**
	* Simulate a click event.
	* @public
	* @param {Element} elem  the element to simulate a click
	*/
var simulateClick = function (_elem) {
	// Create our event (with options)
	var evt = new MouseEvent('click', {
		bubbles: true,
		cancelable: true,
		view: window
	});
	// If cancelled, don't dispatch our event
	var canceled = !_elem.dispatchEvent(evt);
};

/**
	* Simulate a change event.
	* @public
	* @param {Element} elem  the element to simulate a change
	*/
var simulateOnchange = function(_elem) {
	// Create our event (with options)
	var evt = new Event('change', {
		bubbles: true,
		cancelable: true,
		view: window
	});
	// If cancelled, don't dispatch our event
	var canceled = !_elem.dispatchEvent(evt);
};

/**
	* Opens a modal window with a close button and title and content
	* @public
	* @param {string} _text  text content of the window
	* @param {string} _title  Title on window
	* @param {string} _style  The style on dialog div, to give dimensions ie : 'max-width: 90%; margin-top: 10px;'
	*/
function openModal(_text, _title, _style) {
	let universe = document.getElementById('universe');
	const modal =
	'<div id="modal-js-generated" class="modal show" tabindex="-1" role="dialog"> \
		<div class="modal-dialog" tabindex="-1" role="document" style="'+ _style +'"> \
			<div class="modal-content"> \
				<div class="modal-header"> \
					<h5 class="modal-title"> \
						<h1>'
+ _title +
					'</h1> \
					</h5> \
					<button type="button" class="close" onclick="removeModal();">  \
						<span>&#215;</span> \
					</button> \
				</div> \
			<div class="modal-body">'
+ _text +
			'</div> \
				<div class="modal-footer"> \
				</div> \
			</div> \
		</div> \
	</div>';
	universe.insertAdjacentHTML('beforeend', modal);
}

/**
	* Close an opened modal
	* @public
	*/
function removeModal() {
	var modal = document.getElementById("modal-js-generated");
	modal.parentNode.removeChild(modal);
	return false;
}

/**
	* complete amendment for xml wellformedness
	* and send validation code
	*
	* @param txt {sring} string for a valid dom element id
	* @returns fire xml validation
	*/
function validateAmendment(txt) {
	var text = document.getElementById(txt).value.trim();
	if (text == "") { // if the text is empty then no validation
		amendmentAlertInit();
		return;
	}
	var initTxt = "";
	if (!text.startsWith('<?xml')) {
		initTxt += '<?xml version="1.0" encoding="UTF-8"?>';
		initTxt += '<xsl:stylesheet version = "1.0" xmlns:sandbox="bhb://the.sandbox" xmlns:xsl = "http://www.w3.org/1999/XSL/Transform" xmlns:bhb = "bhb://the.hypertext.blockchain" xmlns:on  = "bhb://sourced.events">'
	}
	text = initTxt + text + "</xsl:stylesheet>";
	//console.log("Amendment to validate:", text);
	validateXML(text);
}

/***********************************************************************
***********************************************************************/
/**
	* Code for exporting csv
	*/

function convertArrayOfObjectsToCSV(_data, _sorted) {
	var result, ctr, keys, mainKeys=[], infoKeys=[], pointsIds=[],  pointsIdsEncoded=[], columnDelimiter, lineDelimiter, data, sorted, res;
	// sort columns (the columns not stated will be listed anyway, at the end & not sorted)
	var mainColsOrder = ["path","order","point","next","peer"];
	var infoColsOrder = ["xsl_element"];
	var colsId = ["point", "next", "peer"];

	data = _data || null;
	if (data == null || !data.length) {return null;}
	sorted = _sorted || false;

	// sort data
	if (sorted) {
		data.sort(function(a,b){
			var aa = a.path + a.order;
			var bb = b.path + b.order;
			return aa.localeCompare(bb);
		});
	}

	columnDelimiter = ';';
	lineDelimiter = '\n';

	// construct column header
	data.forEach(function(item) {
		mainKeys = mainKeys.concat(Object.keys(item));
		infoKeys = infoKeys.concat(Object.keys(item.info));
	});

	mainKeys = arrayUnique(mainKeys);
	infoKeys = arrayUnique(infoKeys);

	//sort columns
	mainColsOrder.forEach(function(item, cpt){
		var elt, idx = mainKeys.indexOf(item);
		if (idx > -1) {
			elt = mainKeys.splice(idx,1);
			mainKeys.splice(cpt,0,elt[0]);
		}
		cpt+=1;
	});

	infoColsOrder.forEach(function(item, cpt){
		var elt, idx = infoKeys.indexOf(item);
		if (idx > -1) {
			elt = infoKeys.splice(idx,1);
			infoKeys.splice(cpt,0,elt[0]);
		}
		cpt+=1;
	});

	//concat columns
	keys = mainKeys.concat(infoKeys);
	result = '';
	result += keys.join(columnDelimiter);
	result += lineDelimiter;

	//fill columns & get points id from point/next/peer in an array
	data.forEach(function(item) {
		ctr = 0;
		mainKeys.forEach(function(key) {
			if (ctr > 0) result += columnDelimiter;
			res = item[key];
			if (colsId.indexOf(key) > -1) pointsIds.push(res.replace(/B_/, "").replace(/T_/, ""));
			if (res == undefined) res = "";
			if (typeof res == "object") res = "->";
			result += '"' + res + '"';
			ctr++;
		});
		ctr = 0;
		result += columnDelimiter;
		infoKeys.forEach(function(key) {
			if (ctr > 0) result += columnDelimiter;
				res = item.info[key];
				if (sorted && key=="on_clock") res="0000-00-00T00:00:00Z"; //time is set to 0
				if (res == undefined) res = "";
				if (typeof res == "object") res = "[object]";
				result += '"' + res + '"';
				ctr++;
			});
			result += lineDelimiter;
		});

	if (sorted) {
		pointsIds = arrayUnique(pointsIds);
		// encode the points
		var signs="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		pointsIds.forEach(function(item, i) {
			var input = /*Number(item)*/ i+1;
			var output="";
			while (input>0) {
				output = signs[(input%signs.length)+1] + output;
				input -= (input%signs.length);
				input = input/signs.length;
			}
			pointsIdsEncoded.push(output);
		})

		// replace points ids with encoded points
		pointsIds.forEach(function(item, i) {
			result = result.split(item).join(pointsIdsEncoded[i]);
		})
	}

	return result;
}

function downloadCSV(_data, _sorted) {
	var data, filename, link;
	var csv = convertArrayOfObjectsToCSV(_data, _sorted);
	if (csv == null) return;

	filename = "modal_matrix_" + FORMAT_DATE_TIME_SHORT(Date.now()) + ".csv";

	var blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});

	if (navigator.msSaveBlob) { // IE 10+
		navigator.msSaveBlob(blob, filename)
	} else {
		var link = document.createElement("a");
		if (link.download !== undefined) {
			// feature detection, Browsers that support HTML5 download attribute
			var url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", filename);
			link.style = "visibility:hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
}

function arrayUnique(array) {
	var a = array.concat();
	for(var i=0; i<a.length; ++i) {
		for(var j=i+1; j<a.length; ++j) {
			if(a[i] === a[j]) a.splice(j--, 1);
		}
	}
	return a;
}

/***********************************************************************
***********************************************************************/
/**
 * Code for validating XML (inspired from https://www.w3schools.com/xml/xml_validator.asp)
 */
var xt="", h3OK=1;
var AMENDMENT_EDITINFO = document.getElementById("amendment-editinfo");
var AMENDMENT_VALIDATE = document.getElementById("amendment-validbtn");

function amendmentAlertInit() {
	d3.select(AMENDMENT_EDITINFO).classed("alert-success", false).classed("alert-danger", false);
	d3.select(AMENDMENT_VALIDATE).attr("disabled", "disabled");
	d3.select(AMENDMENT_EDITINFO).text(null);
}

function amendmentAlertSuccess(_message) {
	d3.select(AMENDMENT_EDITINFO).classed("alert-success", true).classed("alert-danger", false);
	d3.select(AMENDMENT_VALIDATE).attr("disabled", null);
	d3.select(AMENDMENT_EDITINFO).text(_message);
}

function amendmentAlertFail(_message) {
	d3.select(AMENDMENT_EDITINFO).classed("alert-success", false).classed("alert-danger", true);
	d3.select(AMENDMENT_VALIDATE).attr("disabled", "disabled");
	d3.select(AMENDMENT_EDITINFO).text(_message);
}

function amendmentValidateContent(_xml) {
	// Invalid text Nodes (not compatible with sandbox in this version)
	var it1 = document.evaluate("//text()",_xml);
	var textNodes = false;
	var insertHere = false;
	var text="Invalid text nodes:";
	try {
		var thisNode = it1.iterateNext();
		while (thisNode) {
			text += (" " + thisNode.textContent.trim());
			if (thisNode.textContent.trim() == AMEND_INSERT_TEXT) insertHere = true;
			if (thisNode.textContent.trim() != "") textNodes = true; // do not alert for space or empty text nodes
			thisNode = it1.iterateNext();
		}
	} catch(e) {return true;}

	// Check for placeholder
	var it2 = document.evaluate("//_",_xml);
	var placeholder = 0;
	try {
		var thisNode = it2.iterateNext();
		while (thisNode) {
			placeholder += 1;
			thisNode = it2.iterateNext();
		}
	} catch(e) {return true;}

	// Check for link node without child node
	var it3 = document.evaluate("//*[local-name()='link'][not(normalize-space(.))][not(node())]",_xml);
	var linkWithoutChild = false;
	/*try {
		var thisNode = it3.iterateNext();
		while (thisNode) {
			linkWithoutChild = true;
			thisNode = it3.iterateNext();
		}
	} catch(e) {return true;}*/

	// Return results
	if (textNodes || (placeholder > 0) || linkWithoutChild) {
		if (insertHere) text = "Please replace '" + AMEND_INSERT_TEXT + "' by a valid amendment. ";
		if (placeholder > 0) text += "The node '<_/>' is waiting for a drag/drop of another node. "
		if (linkWithoutChild) text += "Some links nodes don't have child nodes. "
		return text;
	} else {
		return false;
	}
}


function validateXML(_text) {
	if (document.implementation.createDocument){
		try {
			var parser=new DOMParser();
			var xmlDoc=parser.parseFromString(_text,"application/xml");
		} catch(err) {
			amendmentAlertFail(err.message);
		}
		if (xmlDoc.getElementsByTagName("parsererror").length>0) {
			checkErrorXML(xmlDoc.getElementsByTagName("parsererror")[0]);
			amendmentAlertFail(xt);
		} else {
			var message = amendmentValidateContent(xmlDoc);
			if (!message) amendmentAlertSuccess("Amendment valid");
			if (message) amendmentAlertFail("XML valid. " + message);
		}
	} else {
		amendmentAlertFail("Your browser cannot handle XML validation");
	}
}

function checkErrorXML(x) {
	xt=""
	h3OK=1
	checkXML(x)
}

function checkXML(n) {
	var l,i,nam
	nam=n.nodeName
	if (nam=="h3") {
		if (h3OK==0) {
			return;
		}
		h3OK=0
	}
	if (nam=="#text") {
		xt=xt + n.nodeValue + "\n"
	}
	l=n.childNodes.length
	for (i=0;i<l;i++) {
		checkXML(n.childNodes[i])
	}
}

function displayCssThemes() {
	let text = "<p style=\'color:green;\'><a onclick=\"swithCssTheme(\'none');\">default</a></p>";
	for (let link of document.getElementsByTagName("link")){
    if (link.attributes.role && link.attributes.role.value === "theme") {
			if (link.disabled) {
				text += "<p style='color:green;'><a onclick='swithCssTheme(\"" + link.title + "\");'>" + link.title + "</a>" + "</p>";
			} else {
				text += "<p>" + link.title + "</p>";
			}
		}
	}
	if (text) openModal(text, "Themes", "");
}

function swithCssTheme(_theme) {
	for (let link of document.getElementsByTagName("link")){
		if (link.attributes.role && link.attributes.role.value === "theme") {
			link.disabled = true;
			if (link.title === _theme) {
				link.disabled = false;
			}
		}
	}
	removeModal();
	displayCssThemes();
}

function logTimer(_timer) {
	const t = new Date();
	if (!localStorage.timers) localStorage.setItem("timers", "[]");
	const timers= JSON.parse(localStorage.timers);
	let time = {};
	time.timer = _timer;
	time.np = DATA.length;
	time.nv = (typeof VERTICES == 'undefined')?0:VERTICES.length;
	time.date = t;
	timers.push(time);
	localStorage.setItem("timers", JSON.stringify(timers));
}

function dlTimer(_objArray) {
		 const array = typeof _objArray != 'object' ? JSON.parse(_objArray) : _objArray;
		 let str = "";
		 let d = 0;
		 for (let l of array.values()) {
				 let line = '';
				 for (let p of Object.values(l)) {
						 line += '"' + p + '"' +  ';';
				 }
				 line += '"' + (Date.parse(l.date) - d) + '"' + ";"
				 line.slice(0,line.Length-1);
				 str += line + '\r\n';
				 d = Date.parse(l.date);
		 }
		 window.open( "data:text/csv;charset=utf-8," + str)
 }

function saveSvg(_svgEl, name) {
	_svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	_svgEl.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
	const exportStyle = `/* <![CDATA[ */
		:root{
			/*scene color*/
			--sbx-workspace-color: transparent;

			/*misc*/
			--sbx-edge-lbl-size: .8rem;
			--sbx-amendment-color: #990000;

			/*vertex*/
			--sbx-vertex-color: transparent;
			--sbx-vertex-opacity: .3;
			--sbx-vertex-border-color: black;
			--sbx-vertex-border-opacity: .8;
			--sbx-vertex-border-width: .5;

			/*topology*/
			--sbx-hyperbolic-color: darkblue;
			--sbx-hyperbolic-width: 1;
			--sbx-hyperbolic-opacity: 1;

			--sbx-planar-color: darkcyan;
			--sbx-planar-width: 1;
			--sbx-planar-opacity: 1;

			--sbx-spheric-color: darkgreen;
			--sbx-spheric-width: 1;
			--sbx-spheric-opacity: 1;

			--sbx-edge-viewed-color: #007bff;
			--sbx-edge-viewed-width: 1;
			--sbx-edge-viewed-opacity: 1;
		}
		svg {
			margin: 0;
			font-family: sans-serif;
			font-size: 1rem;
			font-weight: 400;
			height: 100%;
			line-height: 1.5;
		  text-align: left;
			background-color: var(--sbx-workspace-color)
		}
		.gvertex {
			fill: none;
		}

		.vertexCircleRotate {
			opacity: 0;
			fill: white; /* fill is mandatory to event trigger */
		}

		.vertexCircle {
			fill: var(--sbx-vertex-color);
			fill-opacity: var(--sbx-vertex-opacity);
			stroke:var(--sbx-vertex-border-color);
			stroke-width: var(--sbx-vertex-border-width);
			stroke-opacity: var(--sbx-vertex-border-opacity);
		}

		text.edgeLbl  {
			font-size: var(--sbx-edge-lbl-size);
			pointer-events: visible;
			cursor: help;
			user-select: none;
			text-anchor: middle;
		}

		path {
			fill:none;
		}

		path.notselectable {
			fill:none;
			pointer-events: none;
			user-select: none;
			cursor: none;
		}

		path.edges {
			pointer-events: visible;
			cursor: help;
		}

		path.edges.hyperbolic {
			stroke: var(--sbx-hyperbolic-color);
			stroke-width: var(--sbx-hyperbolic-width);
			stroke-opacity: var(--sbx-hyperbolic-opacity);
		}

		marker.marker-hyperbolic {
			stroke: var(--sbx-hyperbolic-color);
			stroke-width: var(--sbx-hyperbolic-width);
			stroke-opacity: var(--sbx-hyperbolic-opacity);
		}

		path.edges.planar {
			stroke: var(--sbx-planar-color);
			stroke-width: var(--sbx-planar-width);
			stroke-opacity: var(--sbx-planar-opacity);
		}

		marker.marker-planar {
			stroke: var(--sbx-planar-color);
			stroke-width: var(--sbx-planar-width);
			stroke-opacity: var(--sbx-planar-opacity);
		}

		text.edgeLbl.planar {
			fill: var(--sbx-planar-color)
		}

		text.edgeLbl.planar.bhb_link {
			fill: var(--sbx-amendment-color)
		}

		path.edges.spheric {
			stroke: var(--sbx-spheric-color);
			stroke-width: var(--sbx-spheric-width);
			stroke-opacity: var(--sbx-spheric-opacity);
		}

		marker.marker-spheric {
			stroke: var(--sbx-spheric-color);
			stroke-width: var(--sbx-spheric-width);
			stroke-opacity: var(--sbx-spheric-opacity);
		}

		text.edgeLbl.spheric {
			fill: var(--sbx-spheric-color)
		}

		path.edges.link {
			stroke: var(--sbx-amendment-color);
		}
		marker.marker-link {
			stroke:var(--sbx-amendment-color);
		}

		path.edges.selected {
			stroke-width: 3px;
		}

		path.edges.viewed {
			stroke:	var(--sbx-edge-viewed-color);
			stroke-width: var(--sbx-edge-viewed-width);
			stroke-opacity: var(--sbx-edge-viewed-opacity);
		}

		.marker-viewed {
			stroke: var(--sbx-edge-viewed-color);
		}

	/*	path.edited {
			stroke-width: 2px;
			opacity: 1;
		}*/

		.notdisplayed{
			opacity: 0;
			pointer-events: none;
		}

		.graphAmendPlaceholder {
			stroke: var(--sbx-amendment-color);
			fill: var(--sbx-amendment-color);
			opacity: .8;
			cursor: crosshair;
		}

		/*svg icons colors ------------------------------ */

		path.icon-eye-shape{
			fill: none;
			stroke:	var(--sbx-edge-viewed-color);
			stroke-opacity: var(--sbx-edge-viewed-opacity);
		}
		path.icon-eye-inner-shape{
			stroke: var(--sbx-edge-viewed-color);
			stroke-opacity: var(--sbx-edge-viewed-opacity);
		}
		path.icon-eye-pupil{
			fill: var(--sbx-edge-viewed-color);
			stroke:	var(--sbx-edge-viewed-color);
			opacity: var(--sbx-edge-viewed-opacity);
		}
		rect.icon-eye-line{
			fill: var(--sbx-edge-viewed-color);
		}

		/* Hide objects with "no-export" class ------------------ */
		.no-export{
			display: none;
		}

		/* ]]> */`;
	var styleNode = document.createElement("style");
	styleNode.innerHTML = exportStyle;
	_svgEl.appendChild(styleNode);
	const svgData = _svgEl.outerHTML;
	const preface = '<?xml version="1.0" standalone="no"?>\r\n';
	const svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
	const svgUrl = URL.createObjectURL(svgBlob);
	const downloadLink = document.createElement("a");
	downloadLink.href = svgUrl;
	downloadLink.download = name;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
	_svgEl.removeChild(styleNode);
 }

"use strict";
/**
	* @file sandbox.js
	* @copyright (c) 2014-2018, sarl mezzònomy
	* @author mezzònomy
	*/

// Global Constants
const VERTEX_RADIUS = +30,
			VERTEX_RADIUS_M = 10, //The vertex radius is multiplied by ((this ratio) * sqrt(point number))
			VERTEX_COMPUTATION_MAX_ITERATION = 100, // Limits the vertex computation iterations
			BEYOND=800, // to get infinite line for spheric edges
			// Elements & seelctions
			AMEND_TOOLBOX_ID = "amendment",
			AMEND_EDITZONE_ID = "amendment-editzone",
			AMEND_CM_EDITZONE_ID = "cm-" + AMEND_EDITZONE_ID,
			AMEND_FORM_ID = "amendment-valid-form",
			AMEND_INSERT_PLACEHOLDER="<_/>",
			AMEND_INSERT_TEXT="INSERT XML HERE",
			AMEND_TEMPLATE = "<bhb:link $$ORDER='$$ID'>\n\t$$TAB" + AMEND_INSERT_TEXT + "\n$$TAB</bhb:link>",
			AMEND_TEMPLATE_AUTOCLOSE = "<bhb:link $$ORDER='$$ID'/>",
			TEXT_TOOLBOX_ID = "text",
			// Misc
			LONGCLICK_LIMIT=500, //threshold in ms to detect a long click
			AUTONAV_INTERVAL=300, //interval in ms for navigating between points
			// Forces constants
			DEF_ALPHA = 1, // forces default alpha [0-1] default 1
			FASTER_DECAY = 1 - Math.pow(0.001, 1 / 100), // accelerate forces when dragging, with 100 ticks
			DEF_DECAY = 1 - Math.pow(0.001, 1 / 300), // Default decay value for 300 ticks
			ALLPINNED_DECAY = 1 - Math.pow(0.001, 1 / 50), // Decay when all vertices are pinned (ie. reloading)
			REHEAT_ALPHATARGET = .3, // Non 0 to maintain heated
			DEF_ALPHATARGET = 0,
			EDGE_TYPES = [{kind:"hyperbolic"},{kind:"planar"},{kind:"spheric"},{kind:"link"}],
			SVG_EYE_ICON =
			`<path
				d="m 494.77828,253.84848 c 0,0 -130.27764,-110.20396 -225.55583,-124.80217 -122.2963,54.60887 -71.02251,228.28589 4.57981,241.94098 99.60596,-26.88446 220.97602,-117.13881 220.97602,-117.13881 z"
				style="fill-opacity:1;stroke-width:8;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;"
				class="icon-eye-shape"/>
			<path
				d="m 269.20989,129.01488 c 0,0 70.1786,13.69873 77.10413,113.72941 6.92546,100.03046 -73.08114,128.27457 -73.08114,128.27457"
				style="fill:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;"
				class="icon-eye-inner-shape"/>
			<path
				d="m -245.919,243.99281 a 16.668613,34.375835 0 0 1 -16.60367,34.37558 16.668613,34.375835 0 0 1 -16.73305,-34.10769 16.668613,34.375835 0 0 1 16.47326,-34.64137 16.668613,34.375835 0 0 1 16.86143,33.83773 l -16.66659,0.53575 z"
				transform="scale(-1,1)"
				style="stroke-width:1"
				class="icon-eye-pupil"/>
			<rect
				width="77.037857"
				height="10"
				x="-78.037857"
				y="245"
				transform="scale(-1,1)"
				style="stroke-width:1px"
				class = "icon-eye-line"/>`
				;

// Global variables
var D3_UNIVERSE,
		D3_SCENE, //svg selection
		DOM_SCENE, // Dom object byid scene (maybe null if no scene yet)
		PERSPECTIVE_TOOLBOX_FOOTER, // Where to add buttons and log in the perspective toolbox
		CURRENT_BHB_POSITION, // String, current point ID
		CURRENT_BHB_MODE,
		ZOOM, // d3 zoom
		VERTEX_LAST_POSITION=[], // array of vertices last positions and rotations
		VERTICES_BY_HC=[], // d3 map of vertices indexed by Hash code (for naming svg groups)
		VERTICES=[], //array of vertices computed from DATA matrix points
		VERTICES_POSITIONNING,
		LONGCLICK_TIMER,
		NAVPOINT_STOP,
		FORCES_STATUS_DEF={collide:{status:true},center:{status:true},charge:{status:true}},
		FORCES_STATUS={},
		DEGREES = function(_rad) {return _rad*(180/Math.PI)},
		POINTS_BY_ID,
		CM_EDITOR;

// ******************************************************
// Range slider
// ******************************************************

// Time formaters & parsers
const BHB_DATE_ENCODING = "%Y-%m-%dT%H:%M:%SZ"
var FORMAT_DATE, FORMAT_DATE_P1, FORMAT_DATE_P2, FORMAT_DATE_P3, FORMAT_DATE_TIME,FORMAT_DATE_BHB, PARSE_DATE_BHB, FORMAT_DATE_TIME_SHORT;

/**
	* Function to initialize the range slider (create it)
	* @returns {nothing} replace previous range slider and creates history
	*/
function init_timeRangeSlider() {
	FORMAT_DATE = d3.timeFormat("%a %_d %b %Y");
	FORMAT_DATE_P1 = d3.timeFormat("%a %_d");
	FORMAT_DATE_P2 = d3.timeFormat("%b %Y");
	FORMAT_DATE_P3 = d3.timeFormat("%H:%M");
	FORMAT_DATE_TIME = d3.timeFormat("%a %_d %b %y %H:%M:%S");
	FORMAT_DATE_TIME_SHORT = d3.timeFormat("%Y%m%d-%H%M%S");
	FORMAT_DATE_BHB = d3.timeFormat(BHB_DATE_ENCODING);
	PARSE_DATE_BHB = d3.timeParse(BHB_DATE_ENCODING);
	//delete previous slider
	d3.select("#explorer-time-slider").select("svg").remove();
	// Construct time array
	let historyDates=[];
	d3.selectAll(".explorer-history-date").each(function() {historyDates.push({date:PARSE_DATE_BHB(this.innerText)});});
	if (historyDates.length > 0) { // Case no evts
		// Render the slider
		// 1. domain
		const minDate = new Date(historyDates[0].date);
		const maxDate = Date.now();
		let startDate, endDate;
		// 2. sliders
		if (!document.getElementById("explorer-bhb-from").dataset.bhbdate) {
			startDate = minDate;
			endDate = new Date(historyDates[historyDates.length -1].date);
		} else {
			startDate = PARSE_DATE_BHB(document.getElementById("explorer-bhb-from").dataset.bhbdate);
			endDate = PARSE_DATE_BHB(document.getElementById("explorer-bhb-to").dataset.bhbdate);
		}
		// 3. render the slider
		const divId = "explorer-time-slider";
		const width = document.getElementById(divId).parentNode.parentNode.clientWidth - 10;
		timeRangeSlider(historyDates, startDate, endDate, minDate, maxDate, updateDates, divId, width);
	}
}

/**
	* Function to update the explorer toolbox from a time range slider
	* @param _from {string}  optional "from" valid date format or date object
	* @param _to {string}  optional "to" valid date format or date object
	* @returns {nothing} updates bhb view, only if 'from' or 'to' date as changed
	*/
function updateDates(_from, _to){
	_from = _from || "";
	_to = _to || "";
	let from, to;
	(_from instanceof Date)? from = _from : from = new Date(_from);
	(_to instanceof Date)? to= _to : to = new Date(_to);
	if (from instanceof Date && !isNaN(from.valueOf())) {
		if (document.getElementById("explorer-bhb-from").dataset.bhbdate != FORMAT_DATE_BHB(from)) {
			const fromQuery = document.getElementById("explorer-bhb-from").dataset.bhbquery.replace("$$DATE",FORMAT_DATE_BHB(from));
			eval(fromQuery);
			//console.log ("From:", FORMAT_DATE_TIME(_from));
		}
	}
	if (to instanceof Date && !isNaN(to.valueOf())) {
		if (document.getElementById("explorer-bhb-to").dataset.bhbdate != FORMAT_DATE_BHB(to) || document.getElementById("explorer-bhb-to").dataset.bhbdate != "") {
			const toQuery = document.getElementById("explorer-bhb-to").dataset.bhbquery.replace("$$DATE",FORMAT_DATE_BHB(to));
			eval(toQuery);
			//console.log ("To:", FORMAT_DATE_TIME(_to));
		}
	}
}

/**
	* Function to update the "To" date only in case it was previoulsy setted in the session
	* for example in case of amendment when exploring time : so the amendment will be seen even if a "to" date as been setted
	* @param - none (the new date is now + 1 min)
	* @returns {nothing} updates bhb, only if from or to date as changed
	*/
function updateToDateIfSet() {
	if (document.getElementById("explorer-bhb-to").dataset.bhbdate === "") return;
	updateDates("", Date.now() + 5*60000);
}


/**
	* Function to setup a dual range slider
	* @param _evts {array}  array of {dates}
	* @param _d1 {string}  from date format
	* @param _d2 {string}  to date format
	* @param _dmin {string}  Minimum range value to date format
	* @param _dmax {string}  Maximum range value to date format
	* @param _action {string}  function on update
	* @param _divId {string}  DOM Id of the container
	* @param _width {number}  width of the placeholder to draw the slider slider
	* @returns {nothing} draw a slider
	*/
function timeRangeSlider(_evts, _d1, _d2, _dmin, _dmax, _action, _divId, _width){
	let sliderVals=[_d1, _d2];
	const width = _width - 60;
	const x = d3.scaleTime()
	.domain([_dmin, _dmax])
	.range([0, width])
	.clamp(true);
	const xMin=x(_dmin);
	const xMax=x(_dmax);

	// Add svg & main slider group
	let svg = d3.select("#" + _divId).append("svg")
	.attr('width', width + 60)
	.attr('height', 80);

	let slider = svg.append("g", ".track-overlay")
	.attr("class", "slider")
	.attr("transform", "translate(30,70)");

	// Add slider line
	slider.append("line")
	.attr("class", "track")
	.attr("x1", x.range()[0])
	.attr("x2", x.range()[1]);

	let ghandle = slider.selectAll("g.ghandle")
	.data([0, 1])
	.enter().append("g")
	.attr("class", "ghandle")
	.attr("transform", function(d) {return "translate(" + x(sliderVals[d])+ ",0)"})
	.call(d3.drag()
		.clickDistance(10)
		.on("start", startDragHandle)
		.on("drag", dragHandle)
		.on("end", endDragHandle)
	);

	ghandle.append("circle")
	.attr("class", "handle-label")
	.attr("cy", -34)
	.attr("cx", 0)
	.attr("r", 25);

	ghandle.append("text")
	.attr("text-anchor", "middle")
	.attr("class", "handle-label part1")
	.attr("y", -42)
	.attr("x", 0)
	.text(function(d) {return FORMAT_DATE_P1(sliderVals[d]);});

	ghandle.append("text")
	.attr("text-anchor", "middle")
	.attr("class", "handle-label part2")
	.attr("y", -30)
	.attr("x", 0)
	.text(function(d) {return FORMAT_DATE_P2(sliderVals[d]);});

	ghandle.append("text")
	.attr("text-anchor", "middle")
	.attr("class", "handle-label part3")
	.attr("y", -18)
	.attr("x", 0)
	.text(function(d) {return FORMAT_DATE_P3(sliderVals[d]);});

	ghandle.append("polygon")
	.attr("class", "handle-label")
	.attr("points", "0,-5 -5,-10 5,-10");

	let selRange = slider.append("line")
	.attr("class", "sel-range")
	.attr("x1", x(sliderVals[0]))
	.attr("x2", x(sliderVals[1]))
	.call(
		d3.drag()
			.on("start", startDragRange)
			.on("drag", dragRange)
			.on("end", endDragRange)
		);

	// Add date events
	let gevts = slider
	.append("g")
	.attr("class", "evts")
	.attr("transform", "translate(0,-65)");

	gevts.selectAll(".evts")
	.data(_evts, function(d){return d.date})
	.enter()
	.append("circle")
	.attr("class", "evts")
	.attr("r", 4)
	.attr("cx", function(d){return x(d.date);})
	.append("title").text(function(d){return FORMAT_DATE_TIME(d.date);});

	// select an history date
	slider.selectAll("circle.evts").on("click", function(d){
		var ptx = +d3.select(this).attr("cx");
		var date = d.date;
		slider.selectAll("g.ghandle").attr("transform", "translate(" + ptx +",0)");
		slider.select("line.sel-range").attr("x1", ptx).attr("x2", ptx);
		sliderVals = [date, date];
		_action(date,date);
	});

	function startDragHandle(d){
		d3.select(this).raise().classed("active", true);
	}

	function dragHandle(){
		let ptx = d3.event.x;
		if (ptx > xMax) {ptx = xMax} else if (ptx < xMin) {ptx = xMin}
		sliderVals[d] = ptx;
		const selHandle = d3.select(this);
		selHandle.attr("transform", function(d) {return "translate("+ ptx +",0)"; });
		selHandle.selectAll("text.handle-label").filter(function(){return this.classList.contains("part1")}).text(function() {return FORMAT_DATE_P1(x.invert(ptx));});
		selHandle.selectAll("text.handle-label").filter(function(){return this.classList.contains("part2")}).text(function() {return FORMAT_DATE_P2(x.invert(ptx));});
		selHandle.selectAll("text.handle-label").filter(function(){return this.classList.contains("part3")}).text(function() {return FORMAT_DATE_P3(x.invert(ptx));});
		const ptx2=x(sliderVals[d===0?1:0]);
		selRange.attr("x1", ptx).attr("x2", ptx2)
	}

	function endDragHandle(){
		const v = Math.round(x.invert(d3.event.x));
		const elt = d3.select(this);
		sliderVals[d] = v;
		const v1 = Math.min(sliderVals[0], sliderVals[1]);
		const v2 = Math.max(sliderVals[0], sliderVals[1]);
		elt.classed("active", false).attr("x", x(v));
		selRange.attr("x1", x(v1)).attr("x2", x(v2))
		_action(v1, v2);
	}

	function startDragRange(){
		d3.select(this).raise().classed("active", true);
	}

	function dragRange(){
		const dx = +d3.event.dx;
		const ox1 = +d3.select(this).attr("x1");
		const ox2 = +d3.select(this).attr("x2");
		let dx1 = ox1 + dx;
		let dx2 = ox2 + dx;
		if(dx1 > xMax){dx1 = xMax} else if (dx1 < xMin){dx1 = xMin}
		if(dx2 > xMax){dx2 = xMax} else if (dx2 < xMin){dx2 = xMin}
		d3.select(this).attr("x1", dx1);
		d3.select(this).attr("x2", dx2);
		ghandle.attr("transform", function(d,i){return "translate(" + (i===0?dx1:dx2) + ",0)";});
	}

	function endDragRange(){
		const ox1 = +d3.select(this).attr("x1");
		const ox2 = +d3.select(this).attr("x2");
		const vx1 = Math.round(x.invert(ox1));
		const vx2 = Math.round(x.invert(ox2));
		const elt = d3.select(this);
		const v1 = Math.min(vx1, vx2);
		const v2 = Math.max(vx1, vx2);
		ghandle.attr("transform", function(d,i){return "translate(" + (i===0?ox1:ox2) + ",0)";});
		elt.classed("active", false);
		sliderVals = [v1, v2];
		_action(v1,v2);
	}
}

// ******************************************************
// Code Edition (Codemirror.js) for editing amendments
// ******************************************************

// CodeMirror : Schema autocomplete hints
const matrix_paths = arrayUnique(DATA.map(a => a.path));
let matrix_tags = arrayUnique(DATA.map(a => a.info.xsl_element));
matrix_tags.push("_"); //Adds placeholder
let matrix_attributes= [];
DATA.forEach(function(item) {
		matrix_attributes = matrix_attributes.concat(Object.keys(item.info));
});
matrix_attributes=arrayUnique(matrix_attributes);

const tags = {
	"!top": ["bhb:link"], // root nodes
	"!attrs": {}, // when no attributes yet
	"bhb:link" : {
		attrs: {
			before: matrix_paths,
			after: matrix_paths,
			push: matrix_paths,
			append: matrix_paths,
		},
		children: matrix_tags,
	},
};

// CodeMirror : callback function from completion
function completeAfter(cm, pred) {
	if (!pred || pred()) setTimeout(function() {
		if (!cm.state.completionActive)
			cm.showHint({completeSingle: false});
	}, 100);
	return CodeMirror.Pass;
}

function completeIfAfterLt(cm) {
	return completeAfter(cm, function() {
		const cur = cm.getCursor();
		return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) === "<";
	});
}

function completeIfInTag(cm) {
	return completeAfter(cm, function() {
		const tok = cm.getTokenAt(cm.getCursor());
		if (tok.type === "string" && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length === 1)) return false;
		const inner = CodeMirror.innerMode(cm.getMode(), tok.state).state;
		return inner.tagName;
	});
}

// CodeMirror : component config options
var cm_config = {
	mode: "xml",
	matchClosing: true,
	alignCDATA: true,
	htmlMode: false,
	matchBrackets: true,
	lineNumbers:true,
	lineWrapping:true,
	matchTags: {bothTags: true},
	extraKeys: {
		"Ctrl-J": "toMatchingTag",
		"'<'": completeAfter,
		"'/'": completeIfAfterLt,
		"' '": completeIfInTag,
		"'='": completeIfInTag,
		"Ctrl-Space": "autocomplete",
		"F11": function(cm) {
			if (!cm.getOption("fullScreen")) {
				cm.setOption("fullScreen", true);
				cm.setOption("theme", "material");
			} else {
				cm.setOption("fullScreen", false);
				cm.setOption("theme","default");
			}
    },
    "Esc": function(cm) {
			if (cm.getOption("fullScreen")) {
				cm.setOption("fullScreen", false);
				cm.setOption("theme","default");
			}
		},
	},
	hintOptions: {schemaInfo: tags},
	styleSelectedText: true,
	addModeClass: true,
	tabSize:2,
	foldGutter: true,
	gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
	autoRefresh: true,
};

/**
	* Select text
	* @param -
	* @returns - select text
	*/
function cmSetTextSelected(_cm, _text) {
	var search_cursor = _cm.getSearchCursor(_text);
	if (search_cursor.findNext()) {
		_cm.setSelection(search_cursor.from(), search_cursor.to());
		_cm.focus();
	}
}

/**
	* Insert amendment @ cursor position
	* @param -
	* @returns -
	*/
function cmAddDropPlaceholder(_cm) {
	//if (!_cm.hasFocus()) return // only if the editor has focus
	_cm.replaceSelection(AMEND_INSERT_PLACEHOLDER, _cm.getCursor());
}

/**
	* Reinit Amendment zone
	* @param {_cm} cm editor instance variable
	* @param {_closeTlbox} boolean Optional, close amendment toolbox. Defaults to false
	* @returns reinit amendment zone and close the toolbox (at least called on form submit)
	*/
function initAmendment(_cm, _closeTlbox) {
	_cm.setValue("");
	if (_closeTlbox) D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened", false).classed("closed", true);
}


/***********************************************************************
***********************************************************************/
/**
	* Main render function. Called each time by the engine via websockets
	* @param _data {array} Array of QA points
	* @param _diff {boolean} true if data array of point has changed
	* @returns a svg display of the vertices
	*/

function render(_data, _diff){
	// if diff is true, data matrix has changed
	// if (!_diff) console.log("@ ----- Reload same matrix ----------------------------------------------");
	// if (_diff) console.log("@ ----- Reload with point matrix change ---------------------------------");

	// ******************************************************
	// Inits in diffs and not diffs
	// ******************************************************
	D3_UNIVERSE = d3.select("#universe");
	D3_SCENE = D3_UNIVERSE.select("svg#scene");
	DOM_SCENE = document.getElementById("scene");
	PERSPECTIVE_TOOLBOX_FOOTER = D3_UNIVERSE.select("#perspective-pointnavtool");
	ZOOM = d3.zoom()
		.scaleExtent([1/8, 8])
		.on("zoom", containerZoomed)
		//.on("start", containerZoomStarted)
		.on("end", containerZoomEnded)
		.clickDistance(10);

	init_timeRangeSlider();

	CURRENT_BHB_POSITION = document.getElementById("universe").dataset.bhbposition;

	//check for mode change and switch existing scene
	var oldBhbMode = CURRENT_BHB_MODE; // save previous mode
	CURRENT_BHB_MODE=document.getElementById("universe").dataset.bhbmode;
	let modeHasChanged = false;
	if (oldBhbMode !== CURRENT_BHB_MODE) modeHasChanged = true;

	if (modeHasChanged) {
		if (!D3_SCENE.empty()) D3_SCENE.remove(); //removes but does not empty the selection
		D3_SCENE = D3_UNIVERSE.select("svg#scene"); // reinit scene selection
	}

	// Alter text mode to allow user interaction
	if (CURRENT_BHB_MODE === "text") {
		textModeInteraction();
	}

	// ******************************************************
	// Init CodeMirror for amendments
	// ******************************************************

	// CodeMirror : component config options
	if (typeof CM_EDITOR === 'undefined') {
		CM_EDITOR = CodeMirror.fromTextArea(document.getElementById(AMEND_EDITZONE_ID), cm_config);
		d3.select("#" + AMEND_FORM_ID + " >.CodeMirror").attr("id", AMEND_CM_EDITZONE_ID);
		CM_EDITOR.setSize("290px","10rem");
	}
	CM_EDITOR.refresh();

	// CodeMirror : Listener to change the amendment value (original textarea) and color test
	CM_EDITOR.on("change", function(cm){
		var search_invit = CM_EDITOR.                                                                                                                                                                                                                                                           getSearchCursor(AMEND_INSERT_TEXT);
		var search_placeholder = CM_EDITOR.getSearchCursor(AMEND_INSERT_PLACEHOLDER);
		while (search_invit.findNext()) {
			CM_EDITOR.markText(search_invit.from(), search_invit.to(), {className: "sb-cm-insert"});
		}
		while (search_placeholder.findNext()) {
			CM_EDITOR.markText(search_placeholder.from(), search_placeholder.to(), {className: "sb-cm-drop"});
		}
		document.getElementById(AMEND_EDITZONE_ID).value = cm.getValue().trim();
		simulateOnchange(document.getElementById(AMEND_EDITZONE_ID));
	})

	// ******************************************************
	// Select current point and zoom on it when mode is changed
	// ******************************************************

	if (!_diff && !D3_SCENE.empty()) {
		selectPoint();
	}

	// ******************************************************
	// Beyond this point executed only if diffs in matrix or scene is empty or reinited
	// ******************************************************
	logTimer("100-render initialized");

	if (!_diff && !D3_SCENE.empty()) return false;
	//console.log("@ ----- Redraw graph ----------------------------------------------------");

	// ******************************************************
	// Scene definition
	// ******************************************************
	if (D3_SCENE.empty()){
		if (CURRENT_BHB_MODE==='graph') {
			D3_SCENE = D3_UNIVERSE.select("#workspace").append("svg").attr("id", "scene");
		} else {
			D3_SCENE = D3_UNIVERSE.select("#mini-workspace").append("svg").attr("id", "scene");
		}
	}
	DOM_SCENE = document.getElementById("scene");

	// if text mode, adds a listener to close menus if workspace is clicked
	if (CURRENT_BHB_MODE === 'text') {
		D3_UNIVERSE.select("#workspace").on("click", function(d) {
			event.stopPropagation();
			D3_UNIVERSE.selectAll("#toolboxes").select("#explorer").classed("opened", false).classed("closed", true);
			D3_UNIVERSE.selectAll("#toolboxes").select("#perspective").classed("opened", false).classed("closed", true);
			D3_UNIVERSE.selectAll("#toolboxes").select("#amendment").classed("opened", false).classed("closed", true);
			//console.log("Click on text background:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
		})
	} else {
			D3_UNIVERSE.select("#workspace").on("click", null);
	}

	// ******************************************************
	// svg definitions
	// ******************************************************
	var defs= D3_SCENE.select("defs");

	if (defs.empty()){
		defs = D3_SCENE.append("defs");
		createMarkers(defs); 	// add markers for graph edges
		createFilters(defs);
		}

	// ******************************************************
	// container
	// ******************************************************
	var container = D3_SCENE.select("#container");

	if (container.empty()){
		container = D3_SCENE.append("g")
		.attr("id", "container")
		.attr("class", "container");
	}

	// ******************************************************
	// zoom
	// ******************************************************
	D3_SCENE.call(ZOOM);
	//.on("dblclick.zoom", null); //de-comment to prenvent dble click zooming (std in touch screen devices)

	//change zoom level if mini-workspace
	if (CURRENT_BHB_MODE === 'text') D3_SCENE.call(ZOOM.transform, d3.zoomIdentity.scale(1/2));

	// ******************************************************
	// Behaviour when click on scene (dbl click is zoom)
	// ******************************************************

	/*D3_SCENE.on("click", function(d) {
		event.stopPropagation();
		unselectVertices(); //unselect vertices
		//setBhbPosition("null"); //TODO: define a non select point
		//console.log("Click on background:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
	})*/

	// ******************************************************
	// get forces settings from localstore
	// ******************************************************
	FORCES_STATUS = JSON.parse(localStorage.getItem("forcesStatus_json"));
	if (!FORCES_STATUS) {
		FORCES_STATUS = FORCES_STATUS_DEF;
	}

	// ******************************************************
	// perspective ctrl buttons
	// ******************************************************
	AddButtonsToPerspective();

	// ******************************************************
	//	Dynamic colors and markers
	// ******************************************************
	var tags = D3_UNIVERSE.select("#perspective").selectAll("span.badge");

	tags.on("mouseover", function(d){
		D3_SCENE.selectAll(".edges").classed("selected", false);
		var currentTag =  this.dataset.tagname.replace(":","_");
		D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet === currentTag;}).classed("selected", true);}
	);
	tags.on("mouseout", function(d){
		D3_SCENE.selectAll(".edges").classed("selected", false);}
	);

	// ******************************************************
	// Computing vertices
	// ******************************************************
	// compute vertices from QA points and create a vertex map
	VERTICES = vertexComputation(_data);
	VERTICES_BY_HC = d3.map(VERTICES, function(d) {return d.hc;});

	// ******************************************************
	// Rendering vertices
	// ******************************************************
	// Entering a svg group for each vertex (for creating a logical group and a group drag behaviour)
	var newVertexGroup = container.selectAll(".gvertex")
	.data(VERTICES, function(d){return "gvertex_" + d.hc;});

	// Exit removed vertices
	newVertexGroup.exit().remove();

	// Computing new vertices
	newVertexGroup
	.enter()
	.append("g")
	.attr("class", "gvertex")
	.attr("id", function(d) {return "gvertex_" + d.hc;})
	.attr("vertex", function(d) {return d.hc;})
	.attr("pointNumber", function(d) {return d.pc;});

	// Selecting all displayed vertex groups
	var vertexGroup = container.selectAll(".gvertex");

	// Add drag drop listener
	vertexGroup.call(d3.drag()
	.on("start", dragstarted)
	.on("drag", dragged)
	.on("end", dragended));

	// ******************************************************
	// Rendering vertices complements (circles, points)
	// ******************************************************

	// entering the vertex circles (on the static vertex group, the shadow should not turn)
	vertexGroup.selectAll(".vertexCircle")
	.data(function(d){return [d];}, function(d){return "vertexCircle_" +  d.hc;})
	.enter()
	.append("circle")
	.attr("class", "vertexCircle")
	.attr("r", function(d){return d.radius;})
	.attr("fill", "white")
	//.attr("filter","url(#shadow2)")
	.attr("id", function(d) {return "vertexCircle_" + d.hc;});

	// Add another group within to handle vertex rotation
	vertexGroup.selectAll(".vertexGroupRotate")
	.data(function(d){return [d];}, function(d){return "grotate_" + d.hc;})
	.enter()
	.append("g")
	.attr("class", "vertexGroupRotate")
	.attr("transform","rotate(0)") // init the transform attribute for later storage
	.attr("id", function(d) {return "grotate_" + d.hc;});

	var vertexGroupRotate = container.selectAll(".vertexGroupRotate");

	// entering a dummy circle for rotation event handling
	vertexGroupRotate.selectAll(".vertexCircleRotate")
	.data(function(d){return [d];})
	.enter()
	.append("circle")
	.attr("class", "vertexCircleRotate")
	.attr("r",function(d){return d.radius;});

	// ******************************************************
	// Rendering internal (hyperbolic) edges within the vertice
	// ******************************************************
	vertexGroupRotate
	.selectAll(".hyperbolic")
	.data(function(d){return d.segments;}, function(d){return d.point;})
	.enter()
	.filter(function(d) {return (d.point.startsWith("T") && (d.topology === "hyperbolic"))})
	.append("path")
	.attr("class", "edges hyperbolic")
	.attr("marker-end", function(d) {return "url(#marker-end-" + d.topology + ")";})
	.attr("marker-start", function(d) {return "url(#marker-start-" + d.topology + ")";})
	.attr("id", function(d) {return "hyperbolic_" + d.point;})
	.attr("d", function(d){return drawHyperbolic(getPoint(d.point), getPoint(d.peer)).path;})
	.on("click", function(d){
		event.stopPropagation();
		setBhbPosition(d.point);
	})
	.on("mouseover", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname === d.tagraw}).classed("selected", true);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet === d.tagnet}).classed("selected", true);
		})
	.on("mouseout", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname === d.tagraw}).classed("selected", false);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet === d.tagnet}).classed("selected", false);
		})
	;


	// ******************************************************
	// Applying previous stored Positionning on vertices (translation & rotation)
	// ******************************************************
	const storedPosition = JSON.parse(localStorage.getItem("vertexLastPosition_json"));
	if (storedPosition && storedPosition.length > 0) {
		const storedPositionByOldestPoint = d3.map(storedPosition, function(d){return d.oPt})
		//applying vertices' position and rotation
		vertexGroup.each(function (d) {
			const storedVertex=storedPositionByOldestPoint.get(d.oldestPoint);
			if (storedVertex) {
				d.fx=storedVertex.oX;
				d.fy=storedVertex.oY;
				d.spin=Number(storedVertex.oRt.replace("rotate(","").replace(")",""));
				d3.select(this).select(".vertexGroupRotate").attr("data-storedRotation",storedVertex.oRt).attr("data-init", "true"); // reinitiated by force simulation, hence stored in local dataset replayed in ticks
				pinVertex("gvertex_"+ d.hc);
			}
		})
	}

	// ******************************************************
	// Computing external edges
	// ******************************************************
	// Creating a list of all planar and spheric edges for drawing links & force simulation in d3 source/target format
	var edges=[];

	POINTS_BY_ID.each(function(d){
		let id="", s, t;
		if (d.topology === "spheric") { //spheric edge case
			// by design a spheric is alone or has a B_ conterpart
			s = Object.assign({}, d);
			t = Object.assign({}, d); // new fictionnal point alone in deep universe
			t.point = d.peer;
			t.peer = d.point;
			t.virtual = true;
			t.tagnet = d.tagnet;
			t.tagraw = d.tagraw;
			id = d.topology + "_" + d.hc + "_" + d.point;
		}
		if (d.point.startsWith("T_") && (d.topology === "planar")) { // planar edge
			s = Object.assign({}, d);
			t = Object.assign({}, getPoint(d.peer));
			id = d.topology + "_" + d.hc + "_" + t.hc + "_" + d.point;
		}
		if (id) {edges.push({topology:d.topology, id:id, source:s, target:t, point:d.point, peer:d.peer, tagnet:d.tagnet, tagraw:d.tagraw});}
	});

	// ******************************************************
	// Rendering external edges
	// ******************************************************
	var newEdge = container
	.selectAll(".edge")
	.data(edges, function(d){return d.id;});

	newEdge.exit().remove();

	newEdge
	.enter()
	.append("path")
	.attr("class", function(d){return "edges edge " + d.topology;})
	.attr("id", function(d){return d.id;})
	.attr("marker-end", function(d){return "url(#marker-end-" + d.topology + ")";})
	.attr("marker-start",function(d){return "url(#marker-start-" + d.topology + ")";})
	.append("title")
	.text(function(d){return d.source.info.xsl_element;});

	var edge =  container.selectAll(".edge");

	edge
	.on("click", function(d){
		event.stopPropagation();
		setBhbPosition(d.point);
	})
	.on("mouseover", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname === d.tagraw}).classed("selected", true);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet === d.tagnet}).classed("selected", true);
	})
	.on("mouseout", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname === d.tagraw}).classed("selected", false);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet === d.tagnet}).classed("selected", false);
	});

	// ******************************************************
	// Rendering external edges labels
	// ******************************************************
	var newEdgeLbl = container
	.selectAll(".edgeLbl")
	.data(edges, function(d){return "lbl_" + d.id;});

	newEdgeLbl.exit().remove();

	newEdgeLbl
	.enter()
	.filter(function(d){return (d.topology === "planar" || d.topology === "spheric") }) //labels for planar & spherics
	.append("text")
	.attr("class", function(d) {return "edgeLbl " + d.topology + " " + d.tagnet;})
	.attr("id", function(d){return "lbl_" + d.id;})
	.attr("text-anchor", "middle")
	.text(function(d) {
		if (d.tagraw === "bhb:link") {
			return FORMAT_DATE_TIME(PARSE_DATE_BHB(d.source.info.on_clock));
		} else {
			return d.source.info.xsl_element;
		}
	});

	var edgeLbl =  container.selectAll(".edgeLbl");

	lblSize();

	edgeLbl
	.on("click", function(d){
		event.stopPropagation();
		setBhbPosition(d.point);
	})
	.on("mouseover", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname === d.tagraw}).classed("selected", true);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet === d.tagnet}).classed("selected", true);
	})
	.on("mouseout", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname === d.tagraw}).classed("selected", false);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet === d.tagnet}).classed("selected", false);
	});


	// ******************************************************
	// Misc after drawing
	// ******************************************************

	// Reselect the Edited point if any
	selectPoint();

	// Color all bhb:link edges
	var bhbLinks = D3_SCENE.selectAll(".edges").filter(function(d){return d.tagraw === "bhb:link"})
	bhbLinks.classed("link", true);
	bhbLinks.attr("marker-start", function(d){
		if (d3.select(this).classed("viewed")) {
			if (d3.select(this).classed("start")) {
				return "url(#marker-start-position)";
			} else {
				return "url(#marker-start-link)";
			}
		} else {
			return "url(#marker-start-link)";
		}
	});
	bhbLinks.attr("marker-end", function(d){
		if (d3.select(this).classed("viewed")) {
			if (d3.select(this).classed("end")) {
				return "url(#marker-end-position)";
			} else {
				return "url(#marker-end-link)";
			}
		} else {
			return "url(#marker-end-link)";
		}
	});

	logTimer("150-done drawing");

	// ******************************************************
	// Forces and Ticks
	// ******************************************************
	// Edge forces
	VERTICES_POSITIONNING = null;
	VERTICES_POSITIONNING = qa_vertices_forces(edges, VERTICES);
	VERTICES_POSITIONNING.on("tick", ticked).on("end", endTick);
	VERTICES_POSITIONNING.restart(); //reinit forces

	// Positionning calculation at each tick
	let semaphore = true;
	function ticked() {
		if (semaphore){
			try{
				semaphore = false

				/* ticks control*/
				var ticksDone = (Math.ceil(Math.log(this.alpha()) / Math.log(1 - this.alphaDecay())));
				var ticksTotal = (Math.ceil(Math.log(this.alphaMin()) / Math.log(1 - this.alphaDecay())));
				var percentCpt = Math.floor(100*(ticksDone / ticksTotal));

				/*positionning*/
				vertexGroup
				.attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";});

				vertexGroupRotate
				.attr("transform", function(d) {
					if (this.dataset.init) { // first iteration of forces, reinit spin to stored spin
						this.removeAttribute("data-init"); // remove indicator
						return this.dataset.storedRotation;
					} else {
						if (d.spin) {
							return "rotate(" + (d.spin) + ")";
						} else if (this.dataset.storedRotation) {
							return this.dataset.storedRotation;
						} else {
							return "rotate(0)";
						}
					}
				});
				// if # of vertices sup 50, only refreshes edges on half the ticks
				if (VERTICES.length < 50 || ticksDone === ticksTotal|| (VERTICES.length >= 50 && ticksDone%2 === 0)) {
					edge
					.filter(function(d){return (d.topology === "planar");})
					.attr("d", function(d){return drawPlanar(d.source.point, d.target.point).path;})

					edge
					.filter(function(d){return (d.topology === "spheric");})
					.attr("d", function(d){return drawSpheric(d.source.point, "gvertex_" + d.source.hc).path;})

					if (VERTICES.length < 100 || ticksDone === ticksTotal || (VERTICES.length >= 100 && ticksDone%50 === 0)) {
						edgeLbl
						.filter(function(d){return (d.topology === "planar");})
						.attrs(function(d) {
							const sPt = getAbsCoordPoint(d.source.point);
							const tPt = getAbsCoordPoint(d.target.point)
							return {x: sPt.x, y: sPt.y, transform: EdgeLblOrientation(sPt.x, sPt.y, tPt.x, tPt.y, "lbl_" + d.id, d.topology)};
						});

						edgeLbl
						.filter(function(d){return (d.topology === "spheric");})
						.attrs(function(d) {
							const sPt = getAbsCoordPoint(d.source.point);
							const vtx = getAbsCoord("gvertex_" + d.target.hc);
							return {x: sPt.x, y: sPt.y, transform: EdgeLblOrientation(sPt.x, sPt.y, (sPt.x - vtx.x) * BEYOND, (sPt.y - vtx.y) * BEYOND, "lbl_" + d.id, d.topology)};
						});
						edgeLbl.attr("style", "");
					} else {
						edgeLbl.attr("style", "display:none");
					}
				}

				/* log forces status
				var logforces = D3_UNIVERSE.select("#perspective-footer").select("#logforces");
				if (logforces.empty) D3_UNIVERSE.select("#perspective-footer").insert("div").attr("id","logforces");
				var logforcesHTML = '<p class="small">';
				logforcesHTML += "alpha: " + this.alpha() + "<br/>";
				logforcesHTML += "alpha target: " + this.alphaTarget() + "<br/>";
				logforcesHTML += "alpha decay: " + this.alphaDecay() + "<br/>";
				logforcesHTML += "ticks done: " + ticksDone + "<br/>";
				logforcesHTML += "total ticks number: " + ticksTotal + "<br/>";
				logforcesHTML += "ticks before savepoint (if 0): " + (ticksTotal%50) + "<br/>";
				logforcesHTML += "collide status: " +  (this.force("collide") != undefined) + " <br/>";
				logforcesHTML += "</p>";
				logforces.html(logforcesHTML);*/

				//release collide at beginning then restore it
				//if (percentCpt < 20) this.force("collide", null);
				//if (percentCpt > 20) this.force("collide", d3.forceCollide().radius(function(d){return d.radius + 10;}));

				// Log progess on freeze force button
				if (!PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation").empty()) {
					if (percentCpt%5 === 0) PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation").text(percentCpt +"%");
				}
				//save positionning every 50 ticks
				if (ticksDone%50 === 0) storeLocalVertexPositionning
			}
			catch(error) {
				//console.log("shadow tick !");
			}
			semaphore = true;
		} else {
		console.log('multi-tick!');}
	}

	// After the last Tick
	function endTick() {
		logTimer("500-forces done");
		if (!PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation").empty()) PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation").attr("title","Position computation, click to pause").text("100%");
		storeLocalVertexPositionning(VERTICES_BY_HC); //store last vertex position and rotation
		// If mode has changed, recenter the selection on the point
		if (modeHasChanged) zoomOnPoint(CURRENT_BHB_POSITION, -1, 750);
	}
}
/** End of main render function ***************************************
***********************************************************************/

// ******************************************************
// Vertex Computation
// ******************************************************

/**
	* Compute an array of vertices from a list of QAPoints The computation is done
	* until vertices are complete with a max number of iteration fixed by
	* VERTEX_COMPUTATION_MAX_ITERATION Also outputs logs and a div of the vertices
	* computed Vertices : bp = begin point id ep = end point id pc = point count hc =
	* hash of the segments segments = array of point objects
	* - computation of "oldest point" for the vertex
	* - computation of topology
	*
	* @param QApointsList {array} QApointsList - array of QApoints (point, next, peer, type)
	* @returns an array of vertex objectedges with a sub array of segments : the points of the vertex
	*/
function vertexComputation(QApointsList){
	// Logging QApointsList to console TODO: remove
	// console.log("Render ", QApointsList.length, " points. Details: ", QApointsList);
	// Vertices computation from the entering QA points list
	// sr stands for (S)egment (R)econstruction
	logTimer("200-init vertex computation");
	let sr=[];
	let vertex={};
	for(let pt of QApointsList){
			let segments=[];
			segments.push(Object.assign({}, pt)); // byval
			vertex = {bp:pt.point, ep:pt.next, pc:1, hc:"", segments:segments, spin:0};
			vertex.segments[0].hc=vertex.hc;
			vertex.segments[0].pc=vertex.pc;
			sr.push(vertex);
	}
	let j=0;
	// Maximum of iteration for Vertices computation = VERTEX_COMPUTATION_MAX_ITERATION
	while ((sr.find(function(s){return s.ep!=s.bp;})) && (j<VERTEX_COMPUTATION_MAX_ITERATION)){
		for(let i=0, n=sr.length; i<n; i++){
			if (!sr[i]){break;}
			if (sr[i].bp != sr[i].ep){
				const sfdIdx = sr.findIndex(function(s){return (s.bp === sr[i].ep)});
				if(sfdIdx != -1){
					const segments=sr[i].segments.concat(sr[sfdIdx].segments);
					sr[sfdIdx].segments=segments;
					sr[sfdIdx].bp=sr[i].bp;
					// add hc and nc to point for position calculation
					for (let k=0, l=segments.length;k<l;k++) {
						sr[sfdIdx].segments[k].pc=sr[sfdIdx].pc;
					}
					sr.splice(i,1);
				}
			}
		}
		j++;
	}
	// Add vertex id ("hc") and vertex point count,
	// and create a map of points across the vertices
	let points1=[];
	for(let vtx of sr){
		vtx.hc = vertexToString(vtx, true)
		vtx.pc = vtx.segments.length
		for (let seg of vtx.segments) {
			seg.pc = vtx.pc;
			seg.hc = vtx.hc;
			points1.push(Object.assign({}, seg));
		}
	}
	const pointsById1 = d3.map(points1, function(d) { return d.point; });

	//Adding positionning calculation of points and arcs as data in post computation
	//Setting topology
	for(let vtx of sr){
		const angle = (2*Math.PI / vtx.pc); // Angle for each point on the radius
		const radius = VERTEX_RADIUS + VERTEX_RADIUS_M * Math.sqrt(vtx.pc) // Node radius
		vtx.radius = radius;
		vtx.angle = angle;
		for (let k=0, l=vtx.segments.length;k<l;k++) {
			const angle1 = k * angle;
			const angle2 = (k === l-1)? 2*Math.PI:(k+1) * angle;
			const ptX = radius * Math.cos(angle1); // x coordinate of the point on the vertex's circle
			const ptY = radius * Math.sin(angle1); // y coordinates of the point on the vertex's circle
			vtx.segments[k].radius = radius;
			vtx.segments[k].ptX = ptX; // points coordinates within the vertex
			vtx.segments[k].ptY = ptY;
			vtx.segments[k].angle1 = angle1;
			vtx.segments[k].startAngle = angle1 + Math.PI * .5; // angle in degrees of the point on the vertex circle. To draw arcs (D3 pie format)
			vtx.segments[k].endAngle = angle2 + Math.PI * .5; // angle in degrees of the next point on the vertex circle. To draw arcs (D3 pie format)
			vtx.segments[k].index = k; // index of the point in the vertex
			vtx.segments[k].topology = "hyperbolic"; //default topology
			try {
				// in some cases the before point can't be found
				vtx.segments[k].before = vtx.segments.find(function(s){return s.next === vtx.segments[k].point}).point;
			} catch(err) {
				vtx.segments[k].before = "";
				console.log("Before point from point", vtx.segments[k].point, "can't be found");
			}
			vtx.segments[k].tagraw = vtx.segments[k].info.xsl_element;
			vtx.segments[k].tagnet = vtx.segments[k].info.xsl_element.replace(":","_");
			if (vtx.segments[k].hc != pointsById1.get(vtx.segments[k].peer).hc) {vtx.segments[k].topology="planar";}
			if (vtx.segments[k].point === vtx.segments[k].peer) {vtx.segments[k].topology="spheric";} // spheric by design, to be fixed because same as text node TODO: fix
			// case of spheric by decision, the point T_ is considered external, and not drawn in a vertex
			if (vtx.segments[k].info.bhb_spheric === 1) {vtx.segments[k].topology = "spheric";}
		}
	}

	// Update map of points across the vertices
	points1=[];
	for(let vtx of sr){
		for (let seg of vtx.segments) {
		points1.push(Object.assign({}, seg));}
	}
	const pointsById2 = d3.map(points1, function(d) { return d.point; });

	//Adding positionning calculation of amendment position for each point. Must be done after the radius/angle calc
	for(let vtx of sr){
		const angle = vtx.angle;
		const radius = vtx.radius;
		for (let seg of vtx.segments) {
			const peerPt = pointsById2.get(seg.peer);
			const peerVtx = sr.find(function(s){return s.hc === peerPt.hc})
			const angle1 = seg.angle1
			seg.amend={"before":{}, "after":{}, "push":{}, "append":{},};
			let ptPeerAngle1 = peerPt.angle1;
			let ptPeerRadius = peerPt.radius;
			if (seg.point.startsWith("T_")) {
				seg.amend.before.ptX = radius * Math.cos(angle1 - (angle/2));
				seg.amend.before.ptY = radius * Math.sin(angle1 - (angle/2));
				seg.amend.before.angle = DEGREES(angle1 - (angle/2));
				seg.amend.before.hc = seg.hc;
				seg.amend.push.ptX = radius * Math.cos(angle1 + (angle/2));
				seg.amend.push.ptY = radius * Math.sin(angle1 + (angle/2));
				seg.amend.push.angle = DEGREES(angle1 + (angle/2));
				seg.amend.push.hc = seg.hc;
				seg.amend.after.ptX = ptPeerRadius * Math.cos(ptPeerAngle1 + (peerVtx.angle/2));
				seg.amend.after.ptY = ptPeerRadius * Math.sin(ptPeerAngle1 + (peerVtx.angle/2));
				seg.amend.after.angle = DEGREES(ptPeerAngle1 + (peerVtx.angle/2));
				seg.amend.after.hc = peerPt.hc;
				seg.amend.append.ptX = ptPeerRadius * Math.cos(ptPeerAngle1 - (peerVtx.angle/2));
				seg.amend.append.ptY = ptPeerRadius * Math.sin(ptPeerAngle1 - (peerVtx.angle/2));
				seg.amend.append.angle = DEGREES(ptPeerAngle1 - (peerVtx.angle/2));
				seg.amend.append.hc = peerPt.hc;
			} else if (seg.point.startsWith("B_")) {
				seg.amend.append.ptX = radius * Math.cos(angle1 - (angle/2));
				seg.amend.append.ptY = radius * Math.sin(angle1 - (angle/2));
				seg.amend.append.angle = DEGREES(angle1 - (angle/2));
				seg.amend.append.hc = seg.hc;
				seg.amend.after.ptX = radius * Math.cos(angle1 + (angle/2));
				seg.amend.after.ptY = radius * Math.sin(angle1 + (angle/2));
				seg.amend.after.angle = DEGREES(angle1 + (angle/2));
				seg.amend.after.hc = seg.hc;
				seg.amend.push.ptX = ptPeerRadius * Math.cos(ptPeerAngle1 + (peerVtx.angle/2));
				seg.amend.push.ptY = ptPeerRadius * Math.sin(ptPeerAngle1 + (peerVtx.angle/2));
				seg.amend.push.angle = DEGREES(ptPeerAngle1 + (angle/2));
				seg.amend.push.hc = peerPt.hc;
				seg.amend.before.ptX = ptPeerRadius * Math.cos(ptPeerAngle1 - (peerVtx.angle/2));
				seg.amend.before.ptY = ptPeerRadius * Math.sin(ptPeerAngle1 - (peerVtx.angle/2));
				seg.amend.before.angle = DEGREES(ptPeerAngle1 - (peerVtx.angle/2));
				seg.amend.before.hc = peerPt.hc;
			}
			// deactivate amendment insertion point if points are identical
			if (JSON.stringify(seg.amend.push) === JSON.stringify(seg.amend.append)) seg.amend.push.hc = -1;
			if (JSON.stringify(seg.amend.before) === JSON.stringify(seg.amend.after)) seg.amend.after.hc = -1;
		}
	}

	//oldest point (smallest number) of each vertex for managing positionning history of vertices
	// + count points by type (for force computing)
	for(let vtx of sr){
		const sortOldest = vtx.segments.sort(function(a, b){return Number((a.point.match(/[0-9]/g)).join(''))-Number((b.point.match(/[0-9]/g)).join(''))});
		vtx.oldestPoint = sortOldest[0].point;
		vtx.pc_planars = vtx.segments.filter(function(s) { return s.topology === "planar";}).length;
		vtx.pc_hyperbolics = vtx.segments.filter(function(s) { return s.topology === "hyperbolic";}).length;
		vtx.pc_spherics = vtx.segments.filter(function(s) { return s.topology === "spheric";}).length;
	}

	// Compute distance to peer point to reorder the segments within each vertex
	for(let vtx of sr){
		for (let seg of vtx.segments) {
			if (seg.point.startsWith("T_") && seg.topology === "hyperbolic") {
				const peerPt = vtx.segments.find(function(s){return s.point === seg.peer});
				seg.distToPeer = distTwoPts(seg, peerPt);
			} else {
				seg.distToPeer=0;
			}
		}
	}

	// Reorder segments by descending distance to draw the bigger first and the smaller last in each vertex
	// to ease selection of hyperbolics
	let points=[];
	for(const vtx of sr){
		for (const seg of vtx.segments) {
			points.push(Object.assign({}, seg));
		}
	}
	POINTS_BY_ID = d3.map(points, function(d) { return d.point; });

	// Sorts the segments in points distance order within each vertex, for drawing the longer first,
	// so that shorter edges will be drawn last an easier to select manually
	for(let vtx of sr){
		vtx.segments.sort(function(a, b){return (b.distToPeer - a.distToPeer)});
	}


	// logs TODO: remove
	console.log("Render", QApointsList.length , "points. Vertices reconstruction in", (j + 1), "iterations.", sr.length, "vertices");
	logTimer("250-done " + sr.length + " vertices in " + (j + 1) + " iterations");
	return sr;
}

// ******************************************************
// Zoom listeners
// ******************************************************

function containerZoomed() {
	//console.log('zoomed() - applying transform ' + d3.event.transform.toString());

	d3.select("#container").attr("transform", d3.event.transform);
}
function containerZoomStarted() {
	//console.log("Current transform on scene:",D3_SCENE.node().__zoom)
	//console.log('zoomStarted() - transform ' + d3.event.transform.toString());
}
function containerZoomEnded() {
	/*console.log('zoomEnded() - transform ' + d3.event.transform.toString());*/
	lblSize();
}

// ******************************************************
// Drag and drop listeners
// ******************************************************

/**
	* Drag and drop vertices
	*/
function dragstarted(d) {
	d3.event.sourceEvent.stopPropagation();
	if (!d3.event.active) {
		//keep only links and collide forces
		//VERTICES_POSITIONNING.force("center", null).force("charge", null);
		VERTICES_POSITIONNING.alphaTarget(REHEAT_ALPHATARGET).alphaDecay(FASTER_DECAY).restart();
	}
	d.fx = d.x;
	d.fy = d.y;
	//console.log("VertexDragEvent started on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
	d3.select(this).classed("dragging", true);
	//console.log("VertexDragEvent dragged on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function dragended(d) {
	if (!d3.event.active) {
		//restore & relaunch forces
		//const xc= D3_SCENE.property("clientWidth") / 2;
		//const yc= D3_SCENE.property("clientHeight") / 2;
		//VERTICES_POSITIONNING.force("center", d3.forceCenter(xc,yc))
		//VERTICES_POSITIONNING.force("charge", d3.forceManyBody().strength(function(d){return (d.pc_planars) * 10;}));
		VERTICES_POSITIONNING.alphaTarget(DEF_ALPHATARGET).alphaDecay(DEF_DECAY);
	}
	//d.fx = null, d.fy = null;
	// fixed last place
	d.fx = d.x;
	d.fy = d.y;
	d3.select(this).classed("dragging", false);
	pinVertex(this.id);
	storeLocalVertexPositionning(VERTICES_BY_HC);
	//console.log("VertexDragEvent ended on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

/**
	* Drag and drop tags (text mode)
	*/
function tagDraggedStarted(d) {
	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("dragging",true)
	D3_UNIVERSE.select("#" + AMEND_CM_EDITZONE_ID).classed("targeted", true);
	//setBhbPosition(d.point);
	// TODO: fix adding dataTransfert API to drag/drop outside the browser
	//console.log("arcDragStarted started on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function tagDragged(d) {
	d3.select(this).style("position","fixed")
	.style("display","block")
	.style("left", event.clientX +"px")
	.style("top", event.clientY +"px");
	if (d3.event.sourceEvent.path.find(function(s){return s.id === AMEND_CM_EDITZONE_ID;})) {
		D3_UNIVERSE.select("#" + AMEND_CM_EDITZONE_ID).classed("zoom11", true);
	} else {
		D3_UNIVERSE.select("#" + AMEND_CM_EDITZONE_ID).classed("zoom11", false);
	}
	if (d3.event.sourceEvent.target.id === AMEND_TOOLBOX_ID) {
		if (!D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened")) {
			D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened", true).classed("closed", false);
		}
	}
	d3.select(this).classed("dragging", true);
	//console.log("arcDragged dragged on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function tagDraggedEnded(d) {
	d3.select(this).style("position","unset").style("display","unset");
	d3.select(this).classed("dragging", false);
	// TODO: IF is not working, the amendment zone id is not in the path
	const amnendBox = document.getElementById(AMEND_CM_EDITZONE_ID).getBoundingClientRect();
	const xRange = {from:amnendBox.x, to:(amnendBox.x + amnendBox.width)};
	const yRange = {from:amnendBox.y, to:(amnendBox.y + amnendBox.height)};
	const pos = {x:d3.event.sourceEvent.clientX, y:d3.event.sourceEvent.clientY};
	const xOK = (pos.x > xRange.from && pos.x < xRange.to);
	const yOK = (pos.y > yRange.from && pos.y < yRange.to);
	if (xOK && yOK) amend(this.dataset.path, "append", false);
	// Return all artefacts to initial state
	D3_UNIVERSE.select("#" + AMEND_CM_EDITZONE_ID).classed("targeted", false).classed("zoom11", false);
	//d3.select(this).attr("transform", null); //return arc to initial position
	//console.log("arcDragEnded ended on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

// ******************************************************
// SVG positionning tools
// ******************************************************

/**
	* Utility to find absolute x,y coordinates of a dom element in zoomed contexts
	* @param elt {string}  elt - element dom id string
	* @returns {object} svg point - point coordinates {x,y}
	*/
function getAbsCoord(elt) {
	if (!DOM_SCENE.getElementById(elt)) return {x:0, y:0}; //No error if elt not found// to filter phantom s : TODO: improve by suppressing these fantom Edges
	const ptn = DOM_SCENE.getElementById(elt);
	const matrixPt = ptn.getCTM(); //get current elt transformation on svg
	let pt = DOM_SCENE.createSVGPoint(); //create new point on the svg
	pt.x = +ptn.getAttribute("cx");
	pt.y = +ptn.getAttribute("cy");
	let ptt = pt.matrixTransform(matrixPt); // apply coord translation on the new point
	const zm = d3.zoomTransform(DOM_SCENE); // get zoom transform of the viewport (x,y,k)
	ptt.x = (ptt.x - zm.x) / zm.k; // reverse the zoom translation on x
	ptt.y = (ptt.y - zm.y) / zm.k; // reverse the zoom translation on y
	return {
		x: ptt.x,
		y: ptt.y,
		pxy: ptt.x + " " + ptt.y
	};
}

/**
	* Utility to find absolute x,y coordinates of a point not drawn
	* Most costly operation in terms of comutation, calls must be optimized
	* @param elt {string}  elt - point id string
	* @returns {object} svg point - point coordinates {x,y}
	*/
function getAbsCoordPoint(_elt) {
	if (!getPoint(_elt)) return {x:0, y:0}; //No error if elt not found// to filter phantom s : TODO: improve by suppressing these fantom Edges
	const elt = getPoint(_elt);
	const matrixPt = DOM_SCENE.getElementById("grotate_" + elt.hc).getCTM(); //get current elt transformation on svg (in fact grotate's)
	let pt = DOM_SCENE.createSVGPoint(); //create new point on the svg (MOST COSTLY)
	pt.x = +elt.ptX;
	pt.y = +elt.ptY;
	let ptt = pt.matrixTransform(matrixPt); // apply coord translation on the new point
	const zm = d3.zoomTransform(DOM_SCENE); // get zoom transform of the viewport (x,y,k)
	ptt.x = (ptt.x - zm.x) / zm.k; // reverse the zoom translation on x
	ptt.y = (ptt.y - zm.y) / zm.k; // reverse the zoom translation on y
	return {
		x: ptt.x,
		y: ptt.y,
		pxy: ptt.x + " " + ptt.y
	};
}

/**
	* Distance between 2 points A & B
	*
	* @param _A {object:point} - point object A
	* @param _B {object:point} - point object B
	* @returns {numeric} - distance in px between two points
	*/
function distTwoPts(_A, _B) {
	if (!_A || !_B) return 0;
	return Math.sqrt(Math.pow(_A.ptX - _B.ptX, 2)+ Math.pow(_A.ptY - _B.ptY, 2));
}

// ******************************************************
// Functions to compute path for edges
// ******************************************************
/**
	* function for computing the planar Edges
	*
	* @param _s {string:point id} - point object from
	* @param _t {string:point id} - point object to
	* @returns {string} - svg path for the edge
	*/
function drawPlanar(_s, _t){
	const path="M" + getAbsCoordPoint(_s).pxy + "L" + getAbsCoordPoint(_t).pxy;
	return {path:path};
}

/**
	* function for computing the spheric Edges
	*
	* @param _s {string:point id} - point object from
	* @param _v {string:vertex id} - point object to
	* @returns {string} - svg path for the edge
	*/
function drawSpheric(_s, _v){
	const sPt = getAbsCoordPoint(_s), vtx = getAbsCoord(_v);
	const path="M" + sPt.pxy + "L" + ((sPt.x - vtx.x) * BEYOND) + " " + ((sPt.y - vtx.y) * BEYOND);
	return {path:path};
}

/**
	* function for computing the hyperbolics edges
	*
	* @param _s {object:point} - point object from
	* @param _t {object:point} - point object to
	* @returns {string} - svg path for the bezier curve
	*/
function drawHyperbolic(_s, _t) {
		const radius = Math.sqrt(_s.ptX*_s.ptX + _s.ptY*_s.ptY)
		// With the help of Mr. Poincare
		const xm = (_s.ptX + _t.ptX)/2.
		const ym = (_s.ptY + _t.ptY)/2.
		let rm = Math.sqrt(xm*xm + ym*ym)
		let path =  "M" + _s.ptX + "," + _s.ptY
		if (rm < 0.001) {
			path += "L" + _t.ptX + "," + _t.ptY;
			return {path:path};}
		const tm = Math.atan2(ym, xm);
		rm = radius * radius / rm;
		const xr = _s.ptX - Math.cos(tm) * rm
		const yr = _s.ptY - Math.sin(tm) * rm
		const rf = Math.sqrt(xr*xr + yr*yr)
		const kind = (Math.sin(_t.startAngle - _s.startAngle) < 0) ? " 0 0 1" : " 0 0 0"
		path   += "A " + rf + " " + rf + kind;
		path   += " " + _t.ptX + "," + _t.ptY;
	return {path:path};
}

/**
	* function for computing label orientation of a line
	*
	* @param x1..y2 {num} - num - coordinates of the begin/end of the edge
	* @param lblId optional {string} - id - uid of the label to get correct positionning
	* @param topology {string} - Topology
	* @returns {string} - A SVG rotate transformation string
	*/
function EdgeLblOrientation(x1, y1, x2, y2, lblId = "", topology) {
	const rt = Math.atan2(-y2+y1, x2-x1) * -180/Math.PI;
	if (topology === "planar") {
		if (Math.abs(rt) < 90) {
			return "rotate(" + rt + " , " + x1 + " , " + y1 + ") translate (" + ((x2-x1)/2 + Math.abs((y2-y1)/2)) + "," + (-3) + ")";
		} else {
			return "rotate(" + (rt - 180) + " , " + x1 + " , " + y1 + ") translate (" + ((x2-x1)/2 - Math.abs((y2-y1)/2)) + "," + (-3) + ")";
		}
	}
	if (topology === "spheric") {
 		const labelBoxW = document.getElementById(lblId).getBBox().width;
		if (Math.abs(rt) < 90) {
			return "rotate(" + rt + " , " + x1 + " , " + y1 + ") translate (" + (labelBoxW) + "," + (-3) + ")";
		} else {
			return "rotate(" + (rt - 180) + " , " + x1 + " , " + y1 + ") translate (" + (-labelBoxW) + "," + (-3) + ")";
		}
	}
}

/**
	* function for (re)sizing the labels on svg relative to the zoom levek
	*
	* @returns - a style attribute with size on the elements
	*/
function lblSize() {
	const k = .8 *  1/D3_SCENE.node().__zoom.k;
	d3.selectAll(".edgeLbl").attr("style", "font-size:" + k + "rem;");
}

/**
	* creating markers definitions for the svg
	*
	* @param _defs {d3 selection} - d3 selection of the svg def tag where to create markers
	* @returns {-} - Adds def definition of markers and duplicates them for coloring
	*/
function createMarkers(_defs) {
	//Normal design
	_defs.append("marker")
		.attr("id", "marker-end")
		.attr("class", "marker")
		.attr("markerWidth", "10")
		.attr("markerHeight", "10")
		.attr("refX", "0")
		.attr("refY", "5")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 5 L 10 5")
		.attr("class","marker-std");
	_defs.append("marker")
		.attr("id", "marker-start")
		.attr("class", "marker")
		.attr("markerWidth", "10")
		.attr("markerHeight", "10")
		.attr("refX", "10")
		.attr("refY", "5")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 5 L 10 5")
		.attr("class","marker-std");
	_defs.append("marker")
		.attr("id", "marker-start-position")
		.attr("class", "marker-position")
		.attr("markerWidth", "500")
		.attr("markerHeight", "250")
		.attr("refX", "50")
		.attr("refY", "25")
		.attr("orient", "auto")
		.append("g")
		.attr("transform", "translate(50, 50)  rotate(180) scale(.1)")
		.html(SVG_EYE_ICON);
	_defs.append("marker")
		.attr("id", "marker-end-position")
		.attr("class", "marker-position")
		.attr("markerWidth", "500")
		.attr("markerHeight", "250")
		.attr("refX", "0")
		.attr("refY", "25")
		.attr("orient", "auto")
		.append("g")
		.attr("transform", "scale(.1)")
		.html(SVG_EYE_ICON);
	_defs.append("marker")
		.attr("id", "marker-end-position-end")
		.attr("class", "marker-position")
		.attr("markerWidth", "10")
		.attr("markerHeight", "10")
		.attr("refX", "0")
		.attr("refY", "5")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 5 L 10 5")
		.attr("class","marker-viewed");
	_defs.append("marker")
		.attr("id", "marker-start-position-end")
		.attr("class", "marker-position")
		.attr("markerWidth", "10")
		.attr("markerHeight", "10")
		.attr("refX", "10")
		.attr("refY", "5")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 5 L 10 5")
		.attr("class","marker-viewed");

	//Duplicate for links
	const defsMarkerStd = _defs.selectAll("marker.marker")
	for (let t of EDGE_TYPES) {
		let defsBhbLink = defsMarkerStd.clone(true)
		.attr("id", function(d) {return this.id + "-" + t.kind;})
		.classed("marker-" + t.kind, true);
		defsBhbLink.selectAll("path").attr("class","marker-" + t.kind);
	}
}

/**
	* creating filters definitions for the svg
	*
	* @param _defs {d3 selection} - d3 selection of the svg def tag where to create filters
	* @returns {-} - Adds def definition of filters
	*/
function createFilters(_defs) {
	_defs.append("filter")
		.attr("id", "gauss1")
		.attr("x", "-0.044379312")
		.attr("y", "-0.030282352")
		.attr("width", "1.0887586")
		.attr("height", "1.0605647")
		.attr("style", "color-interpolation-filters:sRGB")
		.append("feGaussianBlur")
		.attr("stdDeviation", "1.6");
}


/**
	* Text mode interactions
	*
	* @param
	* @returns {-} - Adds listeners to add interactions on the text mode
	*/
function textModeInteraction() {
	//textModeDates();

	// Add dragdrop listeners on elements classed dragxmlelement
	D3_UNIVERSE.selectAll(".dragxmlelement")
	.call(d3.drag()
		.clickDistance(10)
		.on("start", tagDraggedStarted)
		.on("drag", tagDragged)
		.on("end", tagDraggedEnded)
	);

	// reinit icons
	D3_UNIVERSE.selectAll(".icon-edit").remove();
	D3_UNIVERSE.selectAll(".endtag").classed("entagpadding",false);
	// create edit icons for tags with path
	let xmlNode = D3_UNIVERSE.selectAll("div.e:not([data-path=''])");
	let editIcons = xmlNode.insert("img", ":first-child")
	.attr("src","/sandbox/img-icon-edit.svg")
	.attr("class", "icon-edit");
	// icon edit placeholder for endtags and tags without path
	D3_UNIVERSE.selectAll("div.e").filter(function(){return !this.dataset.path}).classed("tagnopathpadding",true);
	D3_UNIVERSE.selectAll(".endtag").classed("entagpadding",true);
	// listener to create the menu for editing a node
	editIcons.on("click", function(d){
		event.stopPropagation();
		D3_UNIVERSE.selectAll("img.deployed").classed("deployed", false);
		//toggle on click
		if (!d3.select(this.parentElement).select(".navbar-text-node").empty()) {
			D3_UNIVERSE.selectAll(".navbar-text-node").remove();
			return;
		}
		D3_UNIVERSE.selectAll(".navbar-text-node").remove();
		d3.select(this).classed("deployed", true);
		const point = this.parentElement.dataset;
		let editBox = d3.select(this.parentElement).insert("nav",":nth-child(2)");
		editBox.attr("class","navbar-text-node");
		let editbox_btn_before = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.path).attr("class","btn btn-primary shadow").text("before");
		let editbox_btn_after = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.path).attr("class","btn btn-primary shadow").text("after");
		let editbox_btn_push = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.path).attr("class","btn btn-primary shadow").text("push");
		let editbox_btn_append = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.path).attr("class","btn btn-primary shadow").text("append");
		let editbox_btn_select = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.path).attr("class","btn btn-secondary shadow").text("select");
		// listeners to create interactions on each button
		// before
		editbox_btn_before.on("mouseover", function(){
			displayAmendPlaceholder(this.dataset.identity, "before");
		});
		editbox_btn_before.on("mouseout", function(d){
			hideAmendPlaceholders();
		});
		editbox_btn_before.on("click", function(d){
			event.stopPropagation();
			amendFromText(this.dataset.path,"before");
			D3_UNIVERSE.selectAll(".navbar-text-node").remove();
			hideAmendPlaceholders();
		});

		// after
		editbox_btn_after.on("mouseover", function(d){
			displayAmendPlaceholder(this.dataset.identity, "after");
		});
		editbox_btn_after.on("mouseout", function(d){
			hideAmendPlaceholders();
		});
		editbox_btn_after.on("click", function(d){
			event.stopPropagation();
			amendFromText(this.dataset.path,"after");
			D3_UNIVERSE.selectAll(".navbar-text-node").remove();
			hideAmendPlaceholders();
		});

		// append
		editbox_btn_append.on("mouseover", function(d){
			displayAmendPlaceholder(this.dataset.identity, "append");
		});
		editbox_btn_append.on("mouseout", function(d){
			hideAmendPlaceholders();
		});
		editbox_btn_append.on("click", function(d){
			event.stopPropagation();
			amendFromText(this.dataset.path,"append");
			D3_UNIVERSE.selectAll(".navbar-text-node").remove();
			hideAmendPlaceholders();
		});

		// push
		editbox_btn_push.on("mouseover", function(d){
			displayAmendPlaceholder(this.dataset.identity, "push");
		});
		editbox_btn_push.on("mouseout", function(d){
			hideAmendPlaceholders();
		});
		editbox_btn_push.on("click", function(d){
			event.stopPropagation();
			amendFromText(this.dataset.path, "push");
			D3_UNIVERSE.selectAll(".navbar-text-node").remove();
			hideAmendPlaceholders();
		});

		// select point
		editbox_btn_select.on("click", function(d){
			event.stopPropagation();
			D3_UNIVERSE.selectAll(".navbar-text-node").remove();
			hideAmendPlaceholders();
			setBhbPosition("T_" + this.dataset.identity);
		});
	});
}

function displayAmendPlaceholder(_id, _order) {
	var placeholder = D3_UNIVERSE.selectAll("nav.placeholder_amend_hidden[data-identity='" + _id + "']." + _order);
	placeholder.classed("placeholder_amend_hidden", false).classed("placeholder_amend_display", true);
}

function hideAmendPlaceholders() {
	D3_UNIVERSE.selectAll("nav.placeholder_amend_display").classed("placeholder_amend_hidden", true).classed("placeholder_amend_display", false);
}

function textModeDates() { // TODO: finish
	var dates=D3_UNIVERSE.selectAll("span.on_clock");
	/*dates.each(function(d){
		d.text(function(r) {
			return FORMAT_DATE_TIME(PARSE_DATE_BHB(d.dataset(on_clock)));
		})
	});*/
}

// ******************************************************
// Misc Functions
// ******************************************************

 /**
	* Amend using the Amendment textarea
	*
	* @param {_path} string - the current point path string
	* @param {_order} string - The order where to amend (before, after,...)
	* @returns {-} - Fill the textarea with amendment
	*/
function amendFromText(_path, _order) {
	amend(_path, _order, true);
}

/**
	* Amend in the amendment tooblox
	*
	* @param {_path} string - the current point path string
	* @param {_order} string - The order where to amend (before, after,...)
	* @param {_openTooblox} boolean - Optional -default true- The order where to amend (before, after,...)
	* @returns {-} - Fill the textarea with amendment
	*/
function amend(_path, _order, _openTooblox) {
	_openTooblox = _openTooblox || true;
	// initiate amend the tooblox
	amendmentAlertInit();
	if (_openTooblox) {
		if (!D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened")) {
			D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened", true).classed("closed", false);
		}
	}
	// fill the fields
	var path = _path;
	var order = _order;
	var search_placeholder = CM_EDITOR.getSearchCursor(AMEND_INSERT_PLACEHOLDER);
	// if there is a amendment placeholder, then insert the amendmant there otherwise replace all
	if (search_placeholder.find()) {
		// when placeholder found, replace it with new value
		//var tabs=Math.max(1, search_placeholder.from().ch);
		//search_placeholder.replace(AMEND_TEMPLATE.replace("$$ID",path).replace("$$ORDER",order).split("$$TAB").join("\t".repeat(tabs)));
		search_placeholder.replace(AMEND_TEMPLATE_AUTOCLOSE.replace("$$ID",path).replace("$$ORDER",order));
	} else {
		// replace all
		CM_EDITOR.setValue(AMEND_TEMPLATE.replace("$$ID",path).replace("$$ORDER",order).split("$$TAB").join(""));
	}
	cmSetTextSelected(CM_EDITOR, AMEND_INSERT_TEXT);
	CM_EDITOR.focus()
}

 /**
	* Adding control buttons in the perspective footer
	* Buttons are not redrawn if exists (re enters)
	*
	* @param -
	* @returns {-} - Adds buttons
	*/
function AddButtonsToPerspective(){
	const styleIcons = "width: .7rem; position: relative; top: 1px;"
	// reset zoom
	let btnResetZoom = PERSPECTIVE_TOOLBOX_FOOTER.select("#btnReset-zoom");
	if (btnResetZoom.empty()) {
			btnResetZoom = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btnReset-zoom")
			.attr("title","Reset zoom level")
			.append("img")
			.attr("src","/sandbox/img-icon-reset-zoom.svg")
			.attr("style", styleIcons);
			btnResetZoom.on("click", function(){
				if (CURRENT_BHB_MODE === 'graph') {
					D3_SCENE.transition()
					.duration(750)
					.call(ZOOM.transform, d3.zoomIdentity);
				} else {
					D3_SCENE.transition()
					.duration(750)
					.call(ZOOM.transform, d3.zoomIdentity.scale(1/2));
				}
			})
			lblSize();
	}

	// zoom on point
	let btnZoomOnPoint = PERSPECTIVE_TOOLBOX_FOOTER.select("#btnZoomOnPoint");
	if (btnZoomOnPoint.empty()) {  //&& getPoint(CURRENT_BHB_POSITION) !== false) {
			btnZoomOnPoint = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btnZoomOnPoint")
			.attr("title","Zoom on point")
			.append("img")
			.attr("src","/sandbox/img-icon-eye-zoom.svg")
			.attr("style", styleIcons);
			btnZoomOnPoint.on("click", function(){zoomOnPoint();})
	}

	// reset position
	let btnResetPosHistory = PERSPECTIVE_TOOLBOX_FOOTER.select("#btnReset-posHistory");
	if (btnResetPosHistory.empty()) {
			btnResetPosHistory = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btnReset-posHistory")
			.attr("title","Reset vertex positionning")
			.append("img")
			.attr("src","/sandbox/img-icon-reset.svg")
			.attr("style", styleIcons);
			btnResetPosHistory.on("click", function(){
				VERTICES_POSITIONNING.stop();
				localStorage.removeItem("vertexLastPosition_json");
				unpinVertices();
				VERTICES_POSITIONNING.alpha(DEF_ALPHA).alphaDecay(DEF_DECAY).restart();
				return;
			})
	}

	// Stop animation (and log animation status)
	let btnstopAnimation = PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation");
	if (btnstopAnimation.empty()) {
		btnstopAnimation = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark")
		.attr("id","btn-stop-animation")
		.attr("style","font-weight: 100; padding-right: 0px; padding-left: 0px; text-align: center; width: 2.1rem;")
		.attr("value","stop").text(".");
		btnstopAnimation.on("click", function(){
			VERTICES_POSITIONNING.stop();
		});
	}

	// Start/Stop Collide force manually
	let btnToggleCollide = PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-toggle-collide");
	if (btnToggleCollide.empty()) {
		btnToggleCollide = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btn-toggle-collide");
		if (FORCES_STATUS.collide.status) {
			btnToggleCollide.attr("value","stop")
			.attr("title","Collide is on, set collide off")
			.append("img")
			.attr("src","/sandbox/img-icon-collide-on.svg")
			.attr("style", styleIcons);
		} else {
			btnToggleCollide.attr("value","start")
			.attr("title","Collide is off, set collide on")
			.append("img")
			.attr("src","/sandbox/img-icon-collide-off.svg")
			.attr("style", styleIcons);
		}
		btnToggleCollide.on("click", function(){
			btnToggleCollide.selectAll("img").remove();
			if (btnToggleCollide.attr("value") === "stop") {
				VERTICES_POSITIONNING.force("collide", null);
				btnToggleCollide
				.attr("value","start")
				.attr("title","Collide is off, set collide on")
				.append("img")
				.attr("src","/sandbox/img-icon-collide-off.svg")
				.attr("style", styleIcons);
				FORCES_STATUS.collide.status=false;
			} else {
				VERTICES_POSITIONNING.force("collide", d3.forceCollide().radius(function(d){return d.radius + 20;}));
				btnToggleCollide
				.attr("value","stop")
				.attr("title","Collide is on, set collide off")
				.append("img")
				.attr("src","/sandbox/img-icon-collide-on.svg")
				.attr("style", styleIcons);
				FORCES_STATUS.collide.status=true;
			}
			storeLocalForcesStatus();
			VERTICES_POSITIONNING.alpha(DEF_ALPHA);
			VERTICES_POSITIONNING.restart();
		});
	}

	let btnThemePicker = PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-theme-picker");
	if (btnThemePicker.empty()) {
		btnThemePicker = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btn-theme-picker")
		.attr("title","Choose theme")
		.on("click", function () {
			displayCssThemes();
		})
		.append("img")
		.attr("src","/sandbox/img-icon-theme.svg")
		.attr("style", styleIcons);
	}

	let btnColorPicker = PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-color-picker");
	if (btnColorPicker.empty()) {
		btnColorPicker = PERSPECTIVE_TOOLBOX_FOOTER.append("input")
		.attr("type","color")
		.attr("id","btn-color-picker")
		.attr("value","rgb(223, 217, 218)")
		.attr("style","width: 2.1rem; height: 2.1rem; position: relative; top: 11px; border: none;")
		.on("change", function () {
			document.body.style.backgroundColor = this.value;
		});
	}

}

/**
	* Unselect all previously selected vertex and Select a vertex (if not already selected),
	* and change the layout.
	*
	* @param {_ptId} - string, point Id
	* @returns nothing (select the vertex), returns false if not found
	*/
function selectVertexOnePoint(_ptId){
	// 1. unselect all vertices
	unselectVertices();
	d3.selectAll(".graphAmendPlaceholder").remove();
	// 2. select current vertex
	const pt = getPoint(_ptId);
	if (!pt) return false;
	const vtx = d3.select("#gvertex_" + pt.hc);
	if (!vtx.classed("focused")) {
		const externalEdges = D3_SCENE.selectAll(".edge").filter(function(d){return (d.source.hc === vtx.datum().hc || d.target.hc === vtx.datum().hc);}); // raise the proper external edges
		//var internalEdges = vtx.selectAll(".edges");
		vtx.raise();
		externalEdges.raise();
		vtx.classed("focused", true);
		if (pt.path !="") {
			addGraphAmendPlaceholder(pt, "before");
			addGraphAmendPlaceholder(pt, "after");
			if (pt.topology !== "spheric") addGraphAmendPlaceholder(pt, "push");
			if (pt.topology !== "spheric") addGraphAmendPlaceholder(pt, "append");
		}
	}
}

function addGraphAmendPlaceholder(_pt, _order) {
	if (_pt.amend[_order].hc === -1) return; // case of similar insert points
	const vtx = d3.select("#gvertex_" + _pt.amend[_order].hc);
	let g = vtx.select(".vertexGroupRotate")
	.append("g")
	.attr("transform", "translate( " + _pt.amend[_order].ptX + "," + _pt.amend[_order].ptY + ") rotate(" + _pt.amend[_order].angle + ")")
	.attr("data-order", _order)
	.attr("data-path", _pt.path);

	g.append("circle")
	.attr("cx", 13)
	.attr("cy", 0)
	.attr("class", "graphAmendPlaceholder")
	.attr("r", 3)
	.append("title").text(`${_order}`);

	let path="M-1 0";
	path += "L10 0";

	g.append("path")
	.attr("d", path)
	.attr("class", "graphAmendPlaceholder");

	g.on("click", function(d) {
		event.stopPropagation();
		amend(this.dataset.path, this.dataset.order, true);
	});
}

/**
	* unselect vertices
	*
	* @returns nothing (unselect all vertices)
	*/
function unselectVertices(){
	D3_SCENE.selectAll(".focused").classed("focused", false);
	D3_SCENE.selectAll(".notselectable").classed("notselectable", false);
	D3_SCENE.selectAll(".gvertex").lower();
	D3_SCENE.selectAll(".egde").raise(); // raise edges above vortices
	D3_SCENE.selectAll(".edgeLbl").raise();
}

/**
	* unselect a vertex
	*
	* @returns nothing (unselect one given vertex)
	*/
function unselectVertex(_vertex){
	D3_SCENE.select("#" + _vertex).selectAll(".focused").classed("focused", false);
	D3_SCENE.select("#" + _vertex).selectAll(".notselectable").classed("notselectable", false);
	D3_SCENE.select("#" + _vertex).lower();
	D3_SCENE.selectAll(".egde").raise(); // raise edges above vortices
	D3_SCENE.selectAll(".edgeLbl").raise();
}

/**
	* unselect & unpin vertices
	*
	* @returns nothing (unselect all vertices and resets fixed position)
	*/
function unpinVertices(){
	D3_SCENE.selectAll(".gvertex").each(function(d){d.fx=null;d.fy=null;});
	D3_SCENE.selectAll(".gvertex").select(".vertexCircle").classed("pinned", false);
	D3_SCENE.selectAll(".gvertex").selectAll("image").remove();
	unselectVertices()
}

/**
	* pin vertices
	*
	* @returns nothing (unselect all vertices and resets fixed position)
	*/
function pinVertex(_vertex) {
	D3_SCENE.select("#" + _vertex).select(".vertexCircle").classed("pinned", true);
	if (D3_SCENE.select("#" + _vertex).select("image").empty()) {
		D3_SCENE.select("#" + _vertex).append("image")
		.attr("xlink:href", "/sandbox/img-icon-pin.png")
		.attr("x",-25).attr("y",-25)
		.attr("height","50px").attr("width","50px")
		.on("click", function(d){
			d3.event.stopPropagation();
			unpinVertex(this.parentElement.id);});
	}
}

/**
	* unpin a single vertex
	*
	* @returns nothing (unselect a vertex)
	*/
function unpinVertex(_vertex){
	D3_SCENE.select("#" + _vertex).each(function(d){d.fx=null;d.fy=null;});
	D3_SCENE.select("#" + _vertex).select(".vertexCircle").classed("pinned", false);
	D3_SCENE.select("#" + _vertex).select("image").remove();
	//unselectVertices()
}

/**
	* proxy to get point informations (used to access points not drawn)
	*
	* @param {_ptId} - String point ID, the point must be setted before by setBhbPosition()
	*                  Optional. if null, the point defined on universe (data-data-bhbposition)
	* @returns {pt.datum()} or false if not found
	*/
function getPoint(_ptId) {
	if (POINTS_BY_ID === undefined) return false;
	const pt = POINTS_BY_ID.get(_ptId);
	if (pt === undefined) {
		console.log("Point", _ptId, "not found!")
		return false;
	}
	return pt;
}

/**
	* Sets display according to point position selected in the bhb
	*
	* @param {_ptId} - String point ID, the point must be setted before by setBhbPosition()
	*                  Optional. if null, the point defined on universe (data-data-bhbposition)
	* @returns {pt.datum()} (select the point and populates & open text nav)
	*/
function selectPoint(_ptId, _openToolbox) {
	_ptId = _ptId || CURRENT_BHB_POSITION;
	_openToolbox = _openToolbox || false;
	const pt = POINTS_BY_ID.get(_ptId)
	if (pt === undefined) {
		console.log ("point: ", _ptId, " not found!");
		return false;
	}
	// populates hidden inputs for dummy navbar
	document.getElementById(TEXT_TOOLBOX_ID + "-point").value = pt.point;
	document.getElementById(TEXT_TOOLBOX_ID + "-next").value = pt.next;
	document.getElementById(TEXT_TOOLBOX_ID + "-peer").value = pt.peer;
	document.getElementById(TEXT_TOOLBOX_ID + "-before").value = pt.before;
	selectVertexOnePoint(pt.point); // select the point
	text_nav(pt); //display text
	// reinit prevously selected point
	var pointsViewed = D3_SCENE.selectAll(".viewed").classed("viewed",false);
	pointsViewed.each(function(d) {
		if (d.tagraw === "bhb:link") {
			d3.select(this).attr("marker-start", "url(#marker-start-link)").classed("start",false);
			d3.select(this).attr("marker-end", "url(#marker-end-link)").classed("end",false);
		} else {
			d3.select(this).attr("marker-start", "url(#marker-start-" + d.topology + ")").classed("start",false);
			d3.select(this).attr("marker-end", "url(#marker-end-" + d.topology + ")").classed("end",false);
		}
		//zoomOnPoint(pt.point, 2, 100);
	});

	// open text toolbox and poupulates edit zone
	if (_openToolbox && (!D3_UNIVERSE.select("#" + TEXT_TOOLBOX_ID).classed("opened"))) {
		D3_UNIVERSE.select("#" + TEXT_TOOLBOX_ID).classed("opened", true).classed("closed", false);
	}
	var selectedEdge = D3_SCENE.selectAll("path.edges").filter(function(l){return (l.point === pt.point || l.peer === pt.point);});
	// select Point, Edge and style them it with the wiev marker
	D3_SCENE.select("#" + pt.point).classed("viewed",true);
	selectedEdge.classed("viewed",true);
	if (selectedEdge.datum().point === pt.point) {
		selectedEdge.classed("start", true);
		selectedEdge.attr("marker-start",function(d){return "url(#marker-start-position)";});
		selectedEdge.attr("marker-end",function(d){return "url(#marker-end-position-end)";});
	} else {
		selectedEdge.classed("end", true);
		selectedEdge.attr("marker-end",function(d){return "url(#marker-end-position)";});
		selectedEdge.attr("marker-start",function(d){return "url(#marker-start-position-end)";});
	}

	return Object.assign(pt, {topology:selectedEdge.datum().topology, displayed:true});
}

/**
	* Function to zoom on a given point
	* @param {_pt} - String, id of the point. Optional, if none will be CURRENT_BHB_POSITION
	* @param {_zl} - numeric, Zoomlevel. Optional, if none will be 2
	* @returns - Sets the selected point at the center of the viewport with a default *4 zoom (or*2 in text mode). False if point not found
	*/
function zoomOnPoint(_pt = CURRENT_BHB_POSITION, _zl = -1, duration = 2000) {
	if (_zl === -1) (CURRENT_BHB_MODE==='graph')?_zl = 1.2 : _zl = .7;
	const coord = getAbsCoordPoint(CURRENT_BHB_POSITION);
	if (coord.x === 0 && coord.y === 0) return false;
	const xc= D3_SCENE.property("clientWidth") / 2;
	let yc= D3_SCENE.property("clientHeight") / 2;
	if (CURRENT_BHB_MODE) yc -= 30; // take in account buttons on the bottom of the viewport

	function trf() {
		return d3.zoomIdentity
		.scale(.5)
		.translate(xc*2, yc*2)
		.scale(_zl*2)
		.translate(-coord.x, -coord.y);
	}

	D3_SCENE.transition()
	.duration(duration)
	.call(ZOOM.transform, trf);

	lblSize();
}


/**
	* print out info on point (deprecated, not really used except for information)
	* @param {_datum} - d3 datum object - point
	* @returns a xml node string with the info
	*/
function text_readInfo(_datum){
	var output = "";
	// tag value
	var info=_datum.info;
	var t = Object.entries(info);
	var tagidx = t.findIndex(function(s){return s[0].endsWith("_element");});
	if (tagidx > -1) {var tag = t.splice(tagidx, 1);}
	if (tag) {output += "<" + tag[0][0].split("_" , 1) + ":" + tag[0][1];} // TODO: fix: "_" is not a good joker !
	for(var i=0, n=t.length; i<n; i++){
		output += " " + t[i][0].replace(/_/, ":") + "=" + '"' + t[i][1] + '"';
	}
	if (tag) {output += "/>";}
	return output;
}

/**
	* Creates the toolbox text navbar
	* @param {_datum} - d3 datum object - point
	* @returns a navbar (does it once for all, if the navbar is drawn, it won't be again)
	*/
function text_nav(_datum){
	//nav buttons
	var navTool = D3_UNIVERSE.select("#" + TEXT_TOOLBOX_ID + "-pointnavtool");
	var btnNextPt = navTool.select("#" + TEXT_TOOLBOX_ID + "-btnNextPt");
	if (!btnNextPt.empty()) {return;} // Exits if already drawned

	// creates dynamic nav buttons
	// nav to next
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-primary")
	.attr("id",TEXT_TOOLBOX_ID + "-btnNextPt")
	.text(String.fromCharCode(8635)) // 8594
	.attr("title", "-> next point (alt+n)")
	.attr("accessKey", "n")
	.on("click", function(d) {
		d3.event.stopPropagation();
		var nextPtId = document.getElementById(TEXT_TOOLBOX_ID + "-next").value;
		setBhbPosition(nextPtId);
	})
	.on("mouseup", function(){
		clearTimeout(LONGCLICK_TIMER);
		NAVPOINT_STOP=true;
	})
	.on("mousedown", function(){
		LONGCLICK_TIMER = window.setTimeout(function(){
			console.log("longclick detected");
			NAVPOINT_STOP=false;
			var ptn = document.getElementById(TEXT_TOOLBOX_ID + "-next").value;
				var autonav = setInterval(function(){
					if (NAVPOINT_STOP) {clearInterval(autonav);}
					ptn = document.getElementById(TEXT_TOOLBOX_ID + "-next").value;
					setBhbPosition(ptn);
					//if (ptn.topology === "planar") {clearInterval(autonav);} // TODO: fix to make it stop !
				},AUTONAV_INTERVAL);
		},LONGCLICK_LIMIT);
	})
	;

	// nav to peer
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-primary")
	.attr("id",TEXT_TOOLBOX_ID + "-btnPeerPt")
	.text(String.fromCharCode(8645)) //8645 8597
	.attr("title", "-> peer point (alt+p)")
	.attr("accessKey", "p")
	.on("click", function(d) {
		event.stopPropagation();
		var peerPtId = document.getElementById(TEXT_TOOLBOX_ID + "-peer").value;
		setBhbPosition(peerPtId);
	});

	// nav to before
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-secondary")
	.attr("id",TEXT_TOOLBOX_ID + "-btnBeforePt")
	.text(String.fromCharCode(8634)) //8592
	.attr("title", "-> before point (alt+b)")
	.attr("accessKey", "b")
	.on("click", function(d) {
		event.stopPropagation();
		var beforePtId = document.getElementById(TEXT_TOOLBOX_ID + "-before").value;
		setBhbPosition(beforePtId);
	});

	// unselect
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-secondary")
	.attr("id",TEXT_TOOLBOX_ID + "-unselect")
	.text(String.fromCharCode(215))
	.attr("title", "unselect")
	.on("click", function(d) {
		event.stopPropagation();
		D3_UNIVERSE.select("#" + TEXT_TOOLBOX_ID).classed("opened", false).classed("closed", true);
		document.getElementById(TEXT_TOOLBOX_ID + "-point").value = null;
		D3_SCENE.selectAll(".viewed").classed("viewed",false);
		D3_SCENE.selectAll("path.start").attr("marker-start", "url(#marker-start-" + d.topology + ")").classed("start",false);
		D3_SCENE.selectAll("path.end").attr("marker-end", "url(#marker-end-" + d.topology + ")").classed("end",false);
		unselectVertices()
	});

	// export to csv TODO: remove ? (tech option)
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-secondary")
	.attr("id",TEXT_TOOLBOX_ID + "-export")
	.text(String.fromCharCode(8862))
	.attr("title", "export modal matrix points to csv")
	.on("click", function(d) {
		event.stopPropagation();
		downloadCSV(DATA);
	});

	// export to csv ordered and anonymised TODO: remove ? (tech option)
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-dark")
	.attr("id",TEXT_TOOLBOX_ID + "-export")
	.text(String.fromCharCode(8862))
	.attr("title", "export modal matrix points sorted & anonymised to csv")
	.on("click", function(d) {
		event.stopPropagation();
		downloadCSV(DATA, true);
	});
}

/**
	* Amend using the Amendment textarea from a point name
	*
	* @param {_pt} - a point id
	* @returns {-} - Fill the textarea with amendment
	*/
function amendFromPoint(_pt) {
	var point = D3_SCENE.select('#' + _pt);
	// init and open amend toobox
	amendFromText(point.datum().path, point.datum().order);
}

/**
	* Switch view from graph to text mode
	*
	* @returns {-} switch mode
	*/
function switchView(){
	if (CURRENT_BHB_MODE === "graph") setBhbMode("text");
	if (CURRENT_BHB_MODE === "text") setBhbMode("graph");
}

// ******************************************************
// Bhb Queries
// ******************************************************

/**
	* bhbquery to set a new point
	* @param {_pt} - a point id
	* @returns sends a query to the server, returns the point
	*/
function setBhbPosition(_pt){
		_snd({bhb:"query", ["{bhb://the.hypertext.blockchain}position"]: _pt});
		return _pt;
}

/**
	* bhbquery to change view mode
	* @param {_mode} - mode : graph, test...
	* @returns sends a query to the server, returns the mode
	*/
function setBhbMode(_mode){
		_snd({bhb:"query", ["{bhb://the.hypertext.blockchain}mode"]: _mode});
		return _mode;
}

// ******************************************************
// Functions to store local information
// ******************************************************

/**
	* Store localy the position of the vertices (both tanslation & rotation) in the global variable vertexLastPosition
	*
	* @param _verticesbyHc {d3map} - map of drawn vertices to register their transformations
	* @returns {-} - Stores positionning as a json string in nav's localStorage
	*/
function storeLocalVertexPositionning(_verticesbyHc){
	//console.log("store positionning");
	var tf_vtx, tf_vtxRt;
	var vtxLastPosbyPt = d3.map(VERTEX_LAST_POSITION, function(d) {return d.oPt});
	_verticesbyHc.each(function (d) {
		if (document.getElementById("gvertex_" + d.hc).attributes.transform){
			tf_vtx = document.getElementById("gvertex_" + d.hc).attributes.transform.value;
		} else {
			tf_vtx = "";
		}
		if (document.getElementById("grotate_" + d.hc).attributes.transform){
			tf_vtxRt = document.getElementById("grotate_" + d.hc).attributes.transform.value;
		} else {
			tf_vtxRt = "rotate(0)";
		}
		if (!vtxLastPosbyPt.get(d.oldestPoint)) {
				VERTEX_LAST_POSITION.push({hc:d.hc, oPt:d.oldestPoint, oX: d.x, oY: d.y, oTf:tf_vtx, oRt:tf_vtxRt});
		} else {
			vtxLastPosbyPt.get(d.oldestPoint).oX=d.x;
			vtxLastPosbyPt.get(d.oldestPoint).oY=d.y;
			vtxLastPosbyPt.get(d.oldestPoint).oTf=tf_vtx;
			vtxLastPosbyPt.get(d.oldestPoint).oRt=tf_vtxRt;
		}
		var vertexLastPosition_json = JSON.stringify(VERTEX_LAST_POSITION);
		localStorage.setItem("vertexLastPosition_json", vertexLastPosition_json);

		storeLocalForcesStatus();
	})
}

/**
	* Store localy the forces settings
	*
	* @returns {-} - Stores forces settings as a json string in nav's localStorage
	*/
function storeLocalForcesStatus(){
		localStorage.setItem("forcesStatus_json", JSON.stringify(FORCES_STATUS));
}

// ******************************************************
// Misc functions
// ******************************************************

/**
	* Hash function Returns a integer value from a string with d2jb algo. If string
	* length is 0, returns 0. See website below
	*
	* @see http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
	* @param _str {string} str - js string value
	* @returns {integer} hascode - 32bit integer
	*/
function hashCode(_str){
	var hash = 0;
	if (_str.length === 0) return hash;
	for (var i=0; i < _str.length; i++) {
		var char = _str.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

/**
	* Prints a Vertex as a string of the points segments or a hash of the value
	* Default is hash
	*
	* @param {object:vertex} - vertex object as defined in the code : {bp:point, ep:next, pc:1, hc:"", segments:segments}
	* @param {boolean} - hash - if true returns a hash, otherwise the chain of the points.
	* @returns {chain|integer} - chain or hascode - 32bit integer depending of hash param value
	*/
function vertexToString(_vertex, _hash){
	_hash = (typeof _hash !== 'undefined') ? _hash : true;

	var vertexString=""
	for (var i=0, n=_vertex.segments.length; i<n; i++) {
		vertexString += "bp:" + _vertex.segments[i].point;
		vertexString += "ep:" + _vertex.segments[i].next;
		vertexString += "pp:" + _vertex.segments[i].peer;
	}
	if (_hash) {
		return hashCode(vertexString);
	} else {
		return vertexString;
	}
}

// ******************************************************					_______________________________
// Applying Forces to elements
//			1. forceCenter: center vertices                                   F O R C E S
//			2. forceCollide: colliding vertices												_______________________________
//			3. forceManyBody: Electrostatic force
//			4. qa_linkPoints: edge-directed force and rotation
// ******************************************************

// forces status examples : VERTICES_POSITIONNING.force("link").links(), VERTICES_POSITIONNING.force("center").x()

function qa_vertices_forces(edges, vertices) {
	var forces = d3.forceSimulation()
		.nodes(VERTICES)
		.force("link", qa_linkPoints().links(edges).distance(function(d){return (d.source.radius + d.target.radius) * 1.5;}).id(function(d) {return d.id;})) // customized force
		;
		if (FORCES_STATUS.collide.status) {
			forces.force("collide", d3.forceCollide().radius(function(d){return d.radius + 20;})); // collision detection
		}
		if (FORCES_STATUS.center.status) {
			let xc= D3_SCENE.property("clientWidth") / 2;
			let yc= D3_SCENE.property("clientHeight") / 2;
			forces.force("center", d3.forceCenter(xc,yc)) // force towards the center
		}
		if (FORCES_STATUS.charge.status) {
			forces.force("charge", d3.forceManyBody().strength(function(d){return (d.pc_planars) * 10;}));  // Nodes attracting or reppelling each others (negative = repelling)
		}
		//when all vertices are pinned, faster decay
		if (D3_SCENE.selectAll(".gvertex").select("circle.pinned").size() === VERTICES_BY_HC.size()) {
			forces.alphaDecay(ALLPINNED_DECAY);
		} else {
			forces.alphaDecay(DEF_DECAY);
		}
	return forces
}

function qa_constant$6(x) {
	return function() {
		return x;
	};
}

function qa_jiggle() {
	return (Math.random() - 0.5) * 1e-6;
}

function qa_linkPoints(links) {
	var id = d3.index,
		strength = qa_constant$6(.1),
		strengths,
		distance = qa_defaultStrength,
		distances,
		vertices,
		count,
		bias,
		iterations = 1;
		if (links === null) links = [];

function qa_defaultStrength(link) {
	return 1 / Math.min(count[link.source.index], count[link.target.index]);
}

function getAbsTheta(point) {
	var d = document.getElementById("grotate_" + point.hc);
	if (!d) return 0;
	var theta = Number(d.attributes.transform.value.replace("rotate(", "").replace(")",""));
	if (isNaN(theta)) {theta = 0;}
	theta /= 180.0; theta *= Math.PI;
	theta += Math.atan2(point.ptY, point.ptX);
	return theta;
}

/** --------------------------------------------------------------------
	* Defining a new force for vertices positioning driven by points' positions and links
	* Driven from original link function from d3 4.12.2 (https://d3js.org/)
	* Require several new properties in the link definition
	*/

function force(alpha) {
	/* left bound for spheric binding to it
	for (var i = 0, x_min = 10000000000000.0; i < links.length; ++i) {
	var link = links[i], source = link.source;
	x_min = Math.min(getAbsCoord(source.point).x, x_min)
	}; */

	for (var i = 0; i < links.length; ++i) {
		var f    = alpha * strengths[i];	//force intensity
		var b    = bias[i];	// force bias
		var link = links[i], source = link.source, target = link.target;	// link data
		var d_tgt, d_src; try {
		d_tgt = D3_SCENE.select("#gvertex_"+target.hc).datum();
		d_src = D3_SCENE.select("#gvertex_"+source.hc).datum();
	} catch (e) {
	//console.log("(error - data) i:", i, "id: ", links[i].id);
	continue;
	}																				/* vertex d3 data */
	if (link.topology === 'spheric') continue;
		const src_rot = getAbsTheta(source),
					tgt_rot = getAbsTheta(target);
		const xy_src  = getAbsCoordPoint(source.point),
					xy_tgt  = getAbsCoordPoint(target.point);
		let x = xy_tgt.x + d_tgt.vx - xy_src.x - d_src.vx|| qa_jiggle(),
				y = xy_tgt.y + d_tgt.vy - xy_src.y - d_src.vy|| qa_jiggle();
		// -------------------------------------------------------------
		const angle = Math.atan2(y, x);
		let vtt   = tgt_rot - angle + Math.PI,
				vst   = src_rot - angle;
		vtt %= 2 * Math.PI; if (vtt > Math.PI) vtt -= 2 * Math.PI;
		vst %= 2 * Math.PI; if (vst > Math.PI) vst -= 2 * Math.PI;
		// link spin (beware of native multiplier 180. / TT)
		d_tgt.spin -= vtt ; d_src.spin -= vst ;
		// -------------------------------------------------------------
		x -= distances[i] * Math.cos(src_rot);
		y -= distances[i] * Math.sin(src_rot);
		const l = Math.sqrt(x * x + y * y); x /= l;y /= l; /*unit vector*/
		const int = f * l, flx = x * int, fly = y * int;  /*force vector*/
		// link force
		d_tgt.vx -= flx * b; d_src.vx += flx * (1 - b);
		d_tgt.vy -= fly * b; d_src.vy += fly * (1 - b);
		//console.log("[planar]", i, x, y, l, tgt_rot, src_rot, '[success]', d_tgt.vx, d_tgt.vy, d_src.vx, d_src.vy);
	}
}

function initialize() {
	if (!vertices) return;
	let i,
	n = vertices.length,
	m = links.length,
	vertexById = d3.map(vertices, id),
	link;

	for (i = 0, count = new Array(n); i < m; ++i) {
		link = links[i];
		link.index = i;
		if (typeof link.source !== "object") link.source = find(vertexById, link.source);
		if (typeof link.target !== "object") link.target = find(vertexById, link.target);
		count[link.source.index] = (count[link.source.index] || 0) + 1;
		count[link.target.index] = (count[link.target.index] || 0) + 1;
	}

	for (i = 0, bias = new Array(m); i < m; ++i) {
		link = links[i];
		bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
	}

	strengths = new Array(m);
	qa_initializeStrength();
	distances = new Array(m);
	qa_initializeDistance();
}

function qa_initializeStrength() {
	if (!vertices) return;

	for (var i = 0, n = links.length; i < n; ++i) {
		strengths[i] = +strength(links[i], i, links);
	}
}

function qa_initializeDistance() {
	if (!vertices) return;
	for (var i = 0, n = links.length; i < n; ++i) {
		distances[i] = +distance(links[i], i, links);
	}
}

force.initialize = function(_) {
	vertices = _;
	initialize();
};

force.links = function(_) {
	return arguments.length ? (links = _, initialize(), force) : links;
};

force.id = function(_) {
	return arguments.length ? (id = _, force) : id;
};

force.iterations = function(_) {
	return arguments.length ? (iterations = +_, force) : iterations;
};

force.strength = function(_) {
	return arguments.length ? (strength = typeof _ === "function" ? _ : qa_constant$6(+_), qa_initializeStrength(), force) : strength;
};

force.distance = function(_) {
	return arguments.length ? (distance = typeof _ === "function" ? _ : qa_constant$6(+_), qa_initializeDistance(), force) : distance;
};

return force;
}

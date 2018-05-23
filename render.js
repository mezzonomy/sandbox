/**
	* @file render.js
	* @copyright (c) 2014-2018, sarl mezzònomy
	* @author mezzònomy
	*/

// Global Constants
const POINT_RADIUS = +0,
			VERTEX_RADIUS = +30,
			VERTEX_RADIUS_M = 10, //The vertex radius is multiplied by ((this ratio) * sqrt(point number))
			VERTEX_COMPUTATION_MAX_ITERATION = 100, // Limits the vertex computation iterations
			BEYOND=800, // to get infinite line for spheric edges
			ARC_INNER_RADIUS=.1, // Proportional to VERTEX_RADIUS. It is the radius of the inner donut circle of a selected vertex
			// Elements & seelctions
			AMEND_TOOLBOX_ID = "amendment",
			AMEND_EDITZONE_ID = "amendment-editzone",
			AMEND_TEMPLATE = "<bhb:link $$ORDER='$$ID'>\nINSERT XML\n</bhb:link>",
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
			DEF_ALPHATARGET = 0;

// Global variables
var D3_UNIVERSE,
		D3_SCENE, //svg selection
		DOM_SCENE, // Dom object byid scene (maybe null if no scene yet)
		PERSPECTIVE_TOOLBOX_FOOTER, // Where to add buttons and log in the perspective toolbox
		CURRENT_BHB_POSITION,
		CURRENT_BHB_MODE,
		ZOOM, // d3 zoom
		VERTEX_LAST_POSITION=[], // array of vertices last positions and rotations
		VERTICES_BY_HC=[], // d3 map of vertices indexed by Hash code (for naming svg groups)
		VERTICES=[], //array of vertices computed from DATA matrix points
		VERTICES_POSITIONNING,
		LONGCLICK_TIMER,
		NAVPOINT_STOP,
		FORCES_STATUS_DEF={collide:{status:true},center:{status:true},charge:{status:true}},
		FORCES_STATUS={};

		// TEST DMA
		//document.getElementById(AMEND_EDITZONE_ID).value = AMEND_TEMPLATE.replace("$$ID","somepath").replace("$$ORDER","order");
		//var codeMirror_config={lineNumbers: true, mode: "xml", matchClosing: true, alignCDATA: true, htmlMode: false};
		//if (d3.select("#universe").select(".CodeMirror").empty()) {
		//	var myCodeMirror = CodeMirror.fromTextArea(document.getElementById(AMEND_EDITZONE_ID), codeMirror_config);
		//}
		// END TEST DMA


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
	PERSPECTIVE_TOOLBOX_FOOTER = D3_UNIVERSE.select("#perspective-footer");
	ZOOM = d3.zoom();
	init_timeRangeSlider();
	CURRENT_BHB_POSITION = document.getElementById("universe").dataset.bhbposition;
	var oldBhbMode = CURRENT_BHB_MODE; // save previous mode
	CURRENT_BHB_MODE=document.getElementById("universe").dataset.bhbmode;

	//check for mode change and switch existing scene
	if (oldBhbMode !== CURRENT_BHB_MODE) {
		if (!D3_SCENE.empty()) D3_SCENE.remove(); //removes but does not empty the selection
		D3_SCENE = D3_UNIVERSE.select("svg#scene"); // reinit scene selection
	}

	// Alter text mode to allow user interaction
	if (CURRENT_BHB_MODE == "text") {
		textModeInteraction();
	}

	if (!_diff && !D3_SCENE.empty()) selectPoint();

	// ******************************************************
	// Beyond this point executed only if diffs in matrix or scene is empty or reinited
	// ******************************************************
	if (!_diff && !D3_SCENE.empty()) return false;
	//console.log("@ ----- Redraw graph ----------------------------------------------------");

	// ******************************************************
	// Scene definition
	// ******************************************************
	if (D3_SCENE.empty()){
		if (CURRENT_BHB_MODE=='graph') {
			D3_SCENE = D3_UNIVERSE.select("#workspace").append("svg").attr("id", "scene");
		} else {
			D3_SCENE = D3_UNIVERSE.select("#mini-workspace").append("svg").attr("id", "scene");
		}
	}
	DOM_SCENE = document.getElementById("scene");

	// if text mode, adds a listener to close menus if workspace is clicked
	if (CURRENT_BHB_MODE=='text') {
		D3_UNIVERSE.select("#workspace").on("click", function(d) {
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
	ZOOM.scaleExtent([1/8, 8]).on("zoom", zoomed);

	D3_SCENE.call(ZOOM)
	.on("click", function(d) {
		unselectVertices() //unselect vertices
		//console.log("Click on background:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
		})
	//.on("dblclick.zoom", null); //de-comment to prenvent dble click zooming (std in touch screen devices)

	function zoomed() {
		container.attr("transform", d3.event.transform);
	}

	//change zoom level if mini-workspace
	if (CURRENT_BHB_MODE=='text') D3_SCENE.call(ZOOM.transform, d3.zoomIdentity.scale(1/4));

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
	// define coloring scheme
	var coloring_arcs = d3.scaleOrdinal(d3.schemeBlues[9]);
	var coloring_tags = d3.scaleOrdinal(d3.schemeCategory20);

	//Map of tags color and add selection on hover
	 var tagsColor=[];
	 var tags = D3_UNIVERSE.select("#perspective").selectAll("span.badge");

		tags.on("mouseover", function(d){
			D3_SCENE.selectAll(".edges").classed("selected", false);
			var currentTag =  this.dataset.tagname.replace(":","_");
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet == currentTag;}).classed("selected", true);}
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

	// Add Click to select on vertices
	vertexGroup.on("click", function(){ //Add click for selecting vertices
		d3.event.stopPropagation(); //otherwise clicks on background which unselect nodes
		selectVertex(this);
		//console.log("VertexClikEvent on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
	})

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

	vertexGroupRotate
	.on("wheel", function() {d3.event.stopPropagation();})
	.on("wheel.rotate",function(){
		//TODO: set a timer in an external function to trap fewer ticks (see Wheel in d3 code)
		//console.log("Wheel rotate vertex Event on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this))
		selectVertex(this.parentNode);
		var curRt;
		if (this.attributes.transform) {
			curRt=Number(this.attributes.transform.value.replace("rotate(", "").replace(")",""));
			if (isNaN(curRt)) {curRt=0;}
		} else {
			curRt=0;
		}
		d3.select(this).attr("transform", "rotate(" + (curRt + d3.event.wheelDelta) + ")");
		d3.select(this).attr("data-storedRotation", "rotate(" + (curRt + d3.event.wheelDelta) + ")").attr("data-init", "true"); // store on vertex for simulation forces ticks
		redrawEdgesforOneVertex(this.id);
	});

	// entering a dummy circle for rotation event handling
	vertexGroupRotate.selectAll(".vertexCircleRotate")
	.data(function(d){return [d];})
	.enter()
	.append("circle")
	.attr("class", "vertexCircleRotate")
	.attr("r",function(d){return d.radius;});

	// Entering points within vertex's group rotate and creates a map
	vertexGroupRotate
	.selectAll(".point")
	.data(function(d){return d.segments;}, function(d) {return d.point;})
	.enter()
	.filter(function(d) {return (!d.external);})
	.append("circle")
	.attr("class", "point")
	.attr("id", function(d) {return d.point;})
	.attr("r", POINT_RADIUS)
	.attr("cx", function(d,i) {return d.ptX;})
	.attr("cy", function(d,i) {return d.ptY;})
	.append("title").text(function(d){return "point: " + d.point + " peer: " + d.peer + " next: " + d.next;});

	// Create a map of points across the vertices
	var points=[];
	vertexGroupRotate.each(function(d,i){
		d.segments.forEach(function(d,i){points.push(Object.assign({}, d));})
	});
	var pointsById = d3.map(points, function(d) { return d.point; });

	// ******************************************************
	// Rendering vertices arcs for point selection and amendments
	// ******************************************************
	// Entering arcs within vertex's group grotate
	var arcs = d3.arc()
	.outerRadius(function(d){return d.radius;})
	.innerRadius(function(d){return d.radius * ARC_INNER_RADIUS;});

	vertexGroupRotate
	.selectAll(".arc")
	.data(function(d){return d.segments;}, function(d) {return "arc_" + d.point;}) //pie calculation already in data (segment reconstruction), standard d3 pie() not used
	.enter()
	.filter(function(d) {return (!d.external);})
	.append("path")
	.attr("class", "arc notdisplayed") //arcs are hidden by default
	.attr("id", function(d) {return "arc_" + d.point;})
	.attr("d", arcs)
	.style("fill",function(d) {return coloring_arcs(d.point);});

	// ******************************************************
	// Rendering internal (hyperbolic) edges within the vertice
	// ******************************************************
	vertexGroupRotate
	.selectAll(".hyperbolic")
	.data(function(d){return d.segments;}, function(d){return d.point;})
	.enter()
	.filter(function(d) {return (d.point.startsWith("T") && (d.topology == "hyperbolic"))})
	.append("path")
	.attr("class", "edges hyperbolic")
	.attr("marker-end", "url(#marker-end)")
	.attr("marker-start", "url(#marker-start)")
	.attr("id", function(d) {return "hyperbolic_" + d.point;})
	.attr("d", function(d){return drawHyperbolic(pointsById.get(d.point), pointsById.get(d.peer)).path;})
	.on("mouseover", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname==d.tagnet}).classed("selected", true);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet==d.tagnet}).classed("selected", true);
		})
		.on("mouseout", function(d){
			D3_UNIVERSE.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname==d.tagnet}).classed("selected", false);
			D3_SCENE.selectAll(".edges").filter(function(e){return e.tagnet==d.tagnet}).classed("selected", false);
		})
	;

	// ******************************************************
	// Applying previous stored Positionning on vertices (translation & rotation)
	// ******************************************************
	var storedPosition = JSON.parse(localStorage.getItem("vertexLastPosition_json"));
	if (storedPosition && storedPosition.length > 0) {
		var storedPositionByOldestPoint = d3.map(storedPosition, function(d){return d.oPt})
		//applying vertices' position and rotation
		vertexGroup.each(function (d) {
			var storedVertex=storedPositionByOldestPoint.get(d.oldestPoint);
			if (storedVertex) {
				d.fx=storedVertex.oX;
				d.fy=storedVertex.oY;
				d.spin=Number(storedVertex.oRt.replace("rotate(","").replace(")",""));
				d3.select(this).select(".vertexGroupRotate").attr("data-storedRotation",storedVertex.oRt).attr("data-init", "true"); // reinitiated by force simulation, hence stored in local dataset replayed in ticks
				pinVertex("gvertex_"+ d.hc);
				//D3_SCENE.select("#gvertex_"+ d.hc).select(".vertexCircle").classed("pinned", true);
				//D3_SCENE.select("#gvertex_"+ d.hc).append("image").attr("xlink:href", "/sandbox/pinned3.png").attr("x",-25).attr("y",-25).attr("height","50px").attr("width","50px");
			}
		})
	}

	// ******************************************************
	// Computing external edges
	// ******************************************************
	 // Creating a list of all planar and spheric edges for drawing links & force simulation in d3 source/target format
	 var edges=[];

	 pointsById.each(function(d){
		var id="", s, t;
		if (d.topology == "spheric") { //spheric edge case
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
		if (d.point.startsWith("T_") && (d.topology == "planar")) { // planar edge
			s = Object.assign({}, d);
			t = Object.assign({}, pointsById.get(d.peer));
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
	.attr("marker-end","url(#marker-end)")
	.attr("marker-start","url(#marker-start)")
	.append("title")
	.text(function(d){return d.source.info.xsl_element;});

	var edge =  container.selectAll(".edge");

	// ******************************************************
	// Rendering external edges labels
	// ******************************************************
	var newEdgeLbl = container
	.selectAll(".edgeLbl")
	.data(edges, function(d){return "lbl_" + d.id;});

 	newEdgeLbl.exit().remove();

	newEdgeLbl
	.enter()
	.filter(function(d){return (d.topology == "planar" || d.topology == "spheric") }) //labels for planar & spherics
	.append("text")
	.attr("class", function(d) {return "edgeLbl " + d.topology;})
	.attr("id", function(d){return "lbl_" + d.id;})
	.attr("text-anchor", "middle")
	.text(function(d) {
		if (d.tagraw=="bhb:link") {
			return FORMAT_DATE_TIME(PARSE_DATE_BHB(d.source.info.on_clock));
		} else {
			return d.source.info.xsl_element;
		}
		});

	var edgeLbl =  container.selectAll(".edgeLbl");

	// ******************************************************
	// Misc after drawing
	// ******************************************************

	// Reselect the Edited point if any
	selectPoint();

	// Color all bhb:link edges
	var bhbLinks = D3_SCENE.selectAll(".edges").filter(function(d){return d.tagraw=="bhb:link"})
	bhbLinks.classed("bhbLink", true);
	bhbLinks.attr("marker-start", function(d){
		if (d3.select(this).classed("viewed")) {
			if (d3.select(this).classed("start")) {
				return "url(#marker-start-position)";
			} else {
				return "url(#marker-start-bhbLink)";
			}
		} else {
			return "url(#marker-start-bhbLink)";
		}
	});
	bhbLinks.attr("marker-end", function(d){
		if (d3.select(this).classed("viewed")) {
			if (d3.select(this).classed("end")) {
				return "url(#marker-end-position)";
			} else {
				return "url(#marker-end-bhbLink)";
			}
		} else {
			return "url(#marker-end-bhbLink)";
		}
	});

	// ******************************************************
	// Forces and Ticks
	// ******************************************************
	// Edge forces
	VERTICES_POSITIONNING = null;
	VERTICES_POSITIONNING = qa_vertices_forces(edges, VERTICES);
	VERTICES_POSITIONNING.on("tick", ticked).on("end", endTick);
	VERTICES_POSITIONNING.restart(); //reinit forces

	// Positionning calculation at each tick
	var semaphore = true;
	function ticked() {
		if (semaphore){
			try{
				semaphore = false

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

				edge
				.filter(function(d){return (d.topology == "planar");})
				.attr("d", function(d){return drawPlanar(d.source.point, d.target.point).path;})

				edgeLbl
				.filter(function(d){return (d.topology == "planar");})
				.attr("x", function(d) {return getAbsCoord(d.source.point).x;})
				.attr("y", function(d) {return getAbsCoord(d.source.point).y;})
				.attr("transform", function(d) {return EdgeLblOrientation(getAbsCoord(d.source.point).x, getAbsCoord(d.source.point).y, getAbsCoord(d.target.point).x, getAbsCoord(d.target.point).y, "lbl_"+d.id, d.topology)});

				edge
				.filter(function(d){return (d.topology == "spheric");})
				.attr("d", function(d){return drawSpheric(d.source.point, "gvertex_" + d.source.hc).path;})

				edgeLbl
				.filter(function(d){return (d.topology == "spheric");})
				.attr("x", function(d) {return getAbsCoord(d.source.point).x;})
				.attr("y", function(d) {return getAbsCoord(d.source.point).y;})
				.attr("transform", function(d) {return EdgeLblOrientation(getAbsCoord(d.source.point).x, getAbsCoord(d.source.point).y,
					(getAbsCoord(d.source.point).x - getAbsCoord("gvertex_" + d.target.hc).x) * BEYOND,
					(getAbsCoord(d.source.point).y - getAbsCoord("gvertex_" + d.target.hc).y) * BEYOND,
					"lbl_"+d.id, d.topology)});

				/* ticks control*/
				var ticksDone = (Math.ceil(Math.log(this.alpha()) / Math.log(1 - this.alphaDecay())));
				var ticksTotal = (Math.ceil(Math.log(this.alphaMin()) / Math.log(1 - this.alphaDecay())));
				var percentCpt = Math.floor(100*(ticksDone / ticksTotal));
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
					if (percentCpt%5 ==0) PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation").text("Freeze (running..." + percentCpt +"%)");
				}
				//save positionning every 50 ticks
				if (ticksDone%50 == 0) storeLocalVertexPositionning
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
		if (!PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation").empty()) PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation").text("No animation");
		storeLocalVertexPositionning(VERTICES_BY_HC); //store last vertex position and rotation
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
	console.log("Render ", QApointsList.length, " points. Details: ", QApointsList);
	// Vertices computation from the entering QA points list
	// sr stands for (S)egment (R)econstruction
	var sr=[];
	var vertex={};
	for(var i=0, n=QApointsList.length; i<n; i++){
			var segments=[];
			segments.push(Object.assign({}, QApointsList[i])); // byval
			vertex = {bp:QApointsList[i].point, ep:QApointsList[i].next, pc:1, hc:"", segments:segments, spin:0};
			vertex.hc = vertexToString(vertex, true);
			vertex.segments[0].hc=vertex.hc;
			vertex.segments[0].pc=vertex.pc;
			sr.push(vertex);
	}
	var j=0;
	// Maximum of iteration for Vertices computation = VERTEX_COMPUTATION_MAX_ITERATION
	while ((sr.find(function(s){return s.ep!=s.bp;})) && (j<VERTEX_COMPUTATION_MAX_ITERATION)){
		for(var i=0, n=sr.length; i<n; i++){
			if (!sr[i]){break;}
			if (sr[i].bp != sr[i].ep){
				var sfdIdx = sr.findIndex(function(s){return (s.bp == sr[i].ep)});
				if(sfdIdx != -1){
					var segments=sr[i].segments.concat(sr[sfdIdx].segments);
					sr[sfdIdx].segments=segments;
					sr[sfdIdx].bp=sr[i].bp;
					sr[sfdIdx].pc=segments.length;
					sr[sfdIdx].hc=vertexToString(sr[sfdIdx], true);
					sr[sfdIdx].spin=0;
					// add hc and nc to point for position calculation
					for (var k=0, l=segments.length;k<l;k++) {
						sr[sfdIdx].segments[k].hc=sr[sfdIdx].hc;
						sr[sfdIdx].segments[k].pc=sr[sfdIdx].pc;
					}
					sr.splice(i,1);
				}
			}
		}
		j++;
	}
	// Create a map of points across the vertices
	var points=[];
	for(var i=0, n=sr.length; i<n; i++){
		for (var k=0, l=sr[i].segments.length;k<l;k++) {
		points.push(Object.assign({}, sr[i].segments[k]));}
	}
	var pointsById = d3.map(points, function(d) { return d.point; });

	//Adding positionning calculation of points and arcs as data in post computation
	//Setting topology
	for(var i=0, n=sr.length; i<n; i++){
		sr[i].radius = VERTEX_RADIUS + VERTEX_RADIUS_M * Math.sqrt(sr[i].pc) // Node radius
		for (var k=0, l=sr[i].segments.length;k<l;k++) {
			var angle1 = k * (2*Math.PI / sr[i].pc);
			var angle2 = (k == l-1)? 2*Math.PI:(k+1) * (2*Math.PI / sr[i].pc);
			var ptX = sr[i].radius * Math.cos(angle1); // x coordinate of the point on the vertex's circle
			var ptY = sr[i].radius * Math.sin(angle1); // y coordinates of the point on the vertex's circle
			sr[i].segments[k].radius = sr[i].radius;
			sr[i].segments[k].ptX = ptX; // points coordinates within the vertex
			sr[i].segments[k].ptY = ptY;
			sr[i].segments[k].startAngle = angle1 + Math.PI * .5; // angle in degrees of the point on the vertex circle. To draw arcs (D3 pie format)
			sr[i].segments[k].endAngle = angle2 + Math.PI * .5; // angle in degrees of the next point on the vertex circle. To draw arcs (D3 pie format)
			sr[i].segments[k].index = k; // index of the point in the vertex
			sr[i].segments[k].padAngle = 0; //no pading between arcs
			sr[i].segments[k].value = 1; //all arcs have the same weight
			sr[i].segments[k].topology="hyperbolic"; //default topology
			sr[i].segments[k].tagraw=sr[i].segments[k].info.xsl_element;
			sr[i].segments[k].tagnet=sr[i].segments[k].info.xsl_element.replace(":","_");
			if (sr[i].segments[k].hc != pointsById.get(sr[i].segments[k].peer).hc) {sr[i].segments[k].topology="planar";}
			if (sr[i].segments[k].point == sr[i].segments[k].peer) {sr[i].segments[k].topology="spheric";} // spheric by design, to be fixed because same as text node TODO: fix
			// case of spheric by decision, the point T_ is considered external, and not drawn in a vertex
			if (sr[i].segments[k].info.bhb_spheric == 1) {sr[i].segments[k].topology="spheric";}
		}
	}

	//oldest point (smallest number) of each vertex for managing positionning history of vertices
	// + count points by type (for force computing)
	for(var i=0, n=sr.length; i<n; i++){
		var sortOldest=sr[i].segments.sort(function(a, b){return Number((a.point.match(/[0-9]/g)).join(''))-Number((b.point.match(/[0-9]/g)).join(''))});
		sr[i].oldestPoint = sortOldest[0].point;
		sr[i].pc_planars=sr[i].segments.filter(function(s) { return s.topology=="planar";}).length;
		sr[i].pc_hyperbolics=sr[i].segments.filter(function(s) { return s.topology=="hyperbolic";}).length;
		sr[i].pc_spherics=sr[i].segments.filter(function(s) { return s.topology=="spheric";}).length;
	}

	// logs TODO: remove
	console.log("Vertices reconstruction in ", (j + 1), " iterations: ", sr);
	return sr;
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
		var xc= D3_SCENE.property("clientWidth") / 2;
		var yc= D3_SCENE.property("clientHeight") / 2;
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
	* Drag and drop arcs (points)
	*/
function arcDragStarted(d) {
	d3.event.sourceEvent.stopPropagation();
	D3_UNIVERSE.select("#" + AMEND_EDITZONE_ID).attr("placeholder","drag the selected arc here to amend it !");
	d3.select(this).classed("dragging",true)
	D3_UNIVERSE.select("#" + AMEND_EDITZONE_ID).classed("targeted", true);
	setBhbPosition(d.point);
	// TODO: fix adding dataTransfert API to drag/drop outside the browser
	//console.log("arcDragStarted started on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function arcDragged(d) {
	d3.select(this).attr("transform", "translate("+  d3.event.x + "," + d3.event.y + ")");
	if (d3.event.sourceEvent.target.id == AMEND_EDITZONE_ID) {
		D3_UNIVERSE.select("#" + AMEND_EDITZONE_ID).classed("zoom11", true);
	} else {
		D3_UNIVERSE.select("#" + AMEND_EDITZONE_ID).classed("zoom11", false);
	}
	if (d3.event.sourceEvent.target.id == AMEND_TOOLBOX_ID) {
		if (!D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened")) {
			D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened", true).classed("closed", false);
		}
	}
	//d3.select(this).classed("dragging", true);
	//console.log("arcDragged dragged on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function arcDragEnded(d) {
	//d3.select(this).classed("dragging", false);
	if (d3.event.sourceEvent.target.id == AMEND_EDITZONE_ID) {
		alertInit();
		var path = d3.event.subject.path;
		var order = d3.event.subject.order;
		document.getElementById(AMEND_TOOLBOX_ID + "-point").value = d.point;
		document.getElementById(AMEND_TOOLBOX_ID + "-next").value = d.next;
		document.getElementById(AMEND_EDITZONE_ID).value = AMEND_TEMPLATE.replace("$$ID",path).replace("$$ORDER",order);
	}
	D3_UNIVERSE.select("#" + AMEND_EDITZONE_ID)
	.classed("targeted", false).classed("zoom11", false)
	.on("focus",function(d){
		D3_SCENE.selectAll(".arc.edited").classed("edited",false);
		d3.select(this).classed("edited",true);
	});
	d3.select(this).attr("transform", null); //return arc to initial position
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
	if (DOM_SCENE.getElementById(elt)) { // to filter phantom s : TODO: improve by suppressing these fantom Edges
		var ptn = DOM_SCENE.getElementById(elt);
		var matrixPt = ptn.getCTM(); //get current elt transformation on svg
		var pt = DOM_SCENE.createSVGPoint(); //create new point on the svg
		pt.x = +ptn.getAttribute("cx");
		pt.y = +ptn.getAttribute("cy");
		var ptt = pt.matrixTransform(matrixPt); // apply coord translation on the new point
		var zm = d3.zoomTransform(DOM_SCENE); // get zoom transform of the viewport (x,y,k)
		ptt.x = (ptt.x - zm.x) / zm.k; // reverse the zoom translation on x
		ptt.y = (ptt.y - zm.y) / zm.k; // reverse the zoom translation on y
		return {
			x: ptt.x,
			y: ptt.y,
			pxy: ptt.x + " " + ptt.y
		};
	} else {
			//console.log ("Internal Error: ", "getAbsCoord()", " While trying to found elt position of: ", elt); // not logged
			return {x:0, y:0}; //No error if elt not found
	}
}

// ******************************************************
// Functions to compute path for edges
// ******************************************************
/**
	* function for computing the planar Edges
	*
	* @param s {string:point id} - point object from
	* @param t {string:point id} - point object to
	* @returns {string} - svg path for the edge
	*/
function drawPlanar(s, t){
	var path="M" + getAbsCoord(s).pxy + "L" + getAbsCoord(t).pxy;
	return {path:path};
}

/**
	* function for computing the spheric Edges
	*
	* @param s {string:point id} - point object from
	* @param v {string:vertex id} - point object to
	* @returns {string} - svg path for the edge
	*/
function drawSpheric(s, v){
	var path="M" + getAbsCoord(s).pxy + "L" + ((getAbsCoord(s).x - getAbsCoord(v).x) * BEYOND) + " " + ((getAbsCoord(s).y - getAbsCoord(v).y) * BEYOND);
	return {path:path};
}

/**
	* function for computing the hyperbolics edges
	*
	* @param s {object:point} - point object from
	* @param t {object:point} - point object to
	* @returns {string} - svg path for the bezier curve
	*/
function drawHyperbolic(s, t) {
		var radius = Math.sqrt(s.ptX*s.ptX + s.ptY*s.ptY)
		// With the help of Mr. Poincare
		var xm = (s.ptX + t.ptX)/2.
		var ym = (s.ptY + t.ptY)/2.
		var rm = Math.sqrt(xm*xm + ym*ym)
		path =  "M" + s.ptX + "," + s.ptY
		if (rm < 0.001) {
			path += "L" + t.ptX + "," + t.ptY;
			return {path:path};}
		var tm = Math.atan2(ym, xm)
				rm = radius * radius / rm
		var xr = s.ptX - Math.cos(tm) * rm
		var yr = s.ptY - Math.sin(tm) * rm
		var rf = Math.sqrt(xr*xr + yr*yr)
		kind   = (Math.sin(t.startAngle - s.startAngle) < 0) ?
			" 0 0 1" : " 0 0 0"
		path   += "A " + rf + " " + rf + kind;
		path   += " " + t.ptX + "," + t.ptY;
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
function EdgeLblOrientation(x1, y1, x2, y2, lblId, topology) {
	lblId = lblId || "";
	var rt = Math.atan2(-y2+y1, x2-x1) * -180/Math.PI;
	var labelBox;
	if (topology == "planar") {
		if (Math.abs(rt) < 90) {
			return "rotate(" + rt + " , " + x1 + " , " + y1 + ") translate (" + ((x2-x1)/2 + Math.abs((y2-y1)/2)) + "," + (-3) + ")";
		} else {
			return "rotate(" + (rt - 180) + " , " + x1 + " , " + y1 + ") translate (" + ((x2-x1)/2 - Math.abs((y2-y1)/2)) + "," + (-3) + ")";
		}
	}
	if (topology == "spheric") {
 		labelBoxW = document.getElementById(lblId).getBBox().width;
		if (Math.abs(rt) < 90) {
			return "rotate(" + rt + " , " + x1 + " , " + y1 + ") translate (" + (labelBoxW) + "," + (-3) + ")";
		} else {
			return "rotate(" + (rt - 180) + " , " + x1 + " , " + y1 + ") translate (" + (-labelBoxW) + "," + (-3) + ")";
		}
	}
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
		.attr("class", "marker-std")
		.attr("markerWidth", "10")
		.attr("markerHeight", "10")
		.attr("refX", "1")
		.attr("refY", "5")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 5 L 10 5")
		.attr("class","marker-std");
	_defs.append("marker")
		.attr("id", "marker-start")
		.attr("class", "marker-std")
		.attr("markerWidth", "10")
		.attr("markerHeight", "10")
		.attr("refX", "9")
		.attr("refY", "5")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 5 L 10 5")
		.attr("class","marker-std");
	_defs.append("marker")
		.attr("id", "marker-start-position")
		.attr("class", "marker-std")
		.attr("markerWidth", "30")
		.attr("markerHeight", "30")
		.attr("refX", "10")
		.attr("refY", "15")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M25 25 L5 15 L25 5 M5 15 L10 15")
		.attr("class","marker-std");
	_defs.append("marker")
		.attr("id", "marker-end-position")
		.attr("class", "marker-std")
		.attr("markerWidth", "30")
		.attr("markerHeight", "30")
		.attr("refX", "20")
		.attr("refY", "15")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M5 25 L25 15 L5 5 M25 15 L20 15")
		.attr("class","marker-std");

	//Duplicate for bhbLinks
	var defsBhbLink = _defs.selectAll("marker.marker-std").clone(true)
		.attr("id", function(d) {return this.id + "-bhbLink";})
		.attr("class", function(d) {return this.id.replace("-std", "bhbLink");});
	defsBhbLink.selectAll("path")
		.attr("class","marker-bhbLink");
}

/**
	* Text mode interactions
	*
	* @param
	* @returns {-} - Adds listeners to add interactions on the text mode
	*/
function textModeInteraction() {
	//textModeDates();
	// reinit icons
	D3_UNIVERSE.selectAll(".icon-edit").remove();
	D3_UNIVERSE.selectAll(".endtag").classed("entagpadding",false);
	// create edit icons
	var xmlNode = D3_UNIVERSE.selectAll("div.e");
	var editIcons = xmlNode.insert("img", ":first-child")
	.attr("src","/sandbox/edit.svg")
	.attr("class", "icon-edit");
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
		var point = this.parentElement.dataset;
		var editBox = d3.select(this.parentElement).insert("nav",":nth-child(2)");
		editBox.attr("class","navbar-text-node");
		var editbox_btn_before = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.on_id).attr("class","btn btn-primary").text("before");
		var editbox_btn_after = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.on_id).attr("class","btn btn-primary").text("after");
		var editbox_btn_push = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.on_id).attr("class","btn btn-primary").text("push");
		var editbox_btn_append = editBox.append("div").attr("class","navbar-text-node-elt").append("button").attr("data-identity",point.identity).attr("data-path",point.on_id).attr("class","btn btn-primary").text("append");
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
			amendFromText(this.dataset.path, "T_" + this.dataset.identity, "", "before");
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
			amendFromText(this.dataset.path, "T_" + this.dataset.identity, "", "after");
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
			amendFromText(this.dataset.path, "T_" + this.dataset.identity, "", "append");
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
			amendFromText(this.dataset.path, "T_" + this.dataset.identity, "", "push");
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
	* @param {_point} string - the point id
	* @param {_next} string - the next point id
	* @param {_order} string - The order where to amend (before, after,...)
	* @returns {-} - Fill the textarea with amendment
	*/
function amendFromText(_path, _point, _next, _order) {
	// Open the amend tooblox
	if (!D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened")) {
		D3_UNIVERSE.select("#" + AMEND_TOOLBOX_ID).classed("opened", true).classed("closed", false);
	}
	// initiate amend the tooblox
	alertInit();
	// fill the fields
	var path = _path;
	var order = _order;
	document.getElementById(AMEND_TOOLBOX_ID + "-point").value = _point; //TBD
	document.getElementById(AMEND_TOOLBOX_ID + "-next").value = _next; //TBD
	document.getElementById(AMEND_EDITZONE_ID).value = AMEND_TEMPLATE.replace("$$ID",path).replace("$$ORDER",order);
}
 /**
	* Adding control buttons in the perspective footer
	* Buttons are not redrawn if exists (re enters)
	*
	* @param -
	* @returns {-} - Adds buttons
	*/
function AddButtonsToPerspective(){
	// reset zoom
	var btnResetZoom = PERSPECTIVE_TOOLBOX_FOOTER.select("#btnReset-zoom");
	if (btnResetZoom.empty()) {
			btnResetZoom = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btnReset-zoom").text("zoom");
			btnResetZoom.on("click", function(){
				if (CURRENT_BHB_MODE == 'graph') {
					D3_SCENE.transition()
					.duration(750)
					.call(ZOOM.transform, d3.zoomIdentity);
				} else {
					D3_SCENE.transition()
					.duration(750)
					.call(ZOOM.transform, d3.zoomIdentity.scale(1/5));
				}
			})
	}

	// reset position
	var btnResetPosHistory = PERSPECTIVE_TOOLBOX_FOOTER.select("#btnReset-posHistory");
	if (btnResetPosHistory.empty()) {
			btnResetPosHistory = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btnReset-posHistory").text("reset");
			btnResetPosHistory.on("click", function(){
				VERTICES_POSITIONNING.stop();
				localStorage.removeItem("vertexLastPosition_json");
				unpinVertices();
				VERTICES_POSITIONNING.alpha(DEF_ALPHA).alphaDecay(DEF_DECAY).restart();
				return;
			})
	}

	// Stop animation (and log animation status)
	var btnstopAnimation = PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-stop-animation");
	if (btnstopAnimation.empty()) {
		btnstopAnimation = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btn-stop-animation").attr("value","stop").text("freeze");
		btnstopAnimation.on("click", function(){
			VERTICES_POSITIONNING.stop();
		});
	}

	// Start/Stop Collide force manually
	var btnToggleCollide = PERSPECTIVE_TOOLBOX_FOOTER.select("#btn-toggle-collide");
	if (btnToggleCollide.empty()) {
		btnToggleCollide = PERSPECTIVE_TOOLBOX_FOOTER.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btn-toggle-collide")
		if (FORCES_STATUS.collide.status) {
			btnToggleCollide.attr("value","stop").text("set collide:off");
		} else {
			btnToggleCollide.attr("value","start").text("set collide:on");
		}
		btnToggleCollide.on("click", function(){
			if (btnToggleCollide.attr("value") == "stop") {
				VERTICES_POSITIONNING.force("collide", null);
				btnToggleCollide.attr("value","start").text("set collide:on");
				FORCES_STATUS.collide.status=false;
			} else {
				VERTICES_POSITIONNING.force("collide", d3.forceCollide().radius(function(d){return d.radius + 10;}));
				btnToggleCollide.attr("value","stop").text("set collide:off");
				FORCES_STATUS.collide.status=true;
			}
			storeLocalForcesStatus();
			VERTICES_POSITIONNING.alpha(DEF_ALPHA);
			VERTICES_POSITIONNING.restart();
		});
	}
}

/**
	* To redraw edges when a single Vertex is rotated
	* @param _vertexhc {string}  hash code (id) of a vertex
	* @returns {nothing} - Redraw the edges
	*/
function redrawEdgesforOneVertex(_vertexhc) {
	var trueVertexhc=Number(_vertexhc.replace("grotate_",""));

	D3_SCENE.selectAll("path.planar")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("d", function(d){return drawPlanar(d.source.point, d.target.point).path;});

	D3_SCENE.selectAll("path.spheric")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("d", function(d){return drawSpheric(d.source.point, "gvertex_" + d.target.hc).path;})

	D3_SCENE.selectAll("text.edgeLbl")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("x", function(d) {return getAbsCoord(d.source.point).x;})
	.attr("y", function(d) {return getAbsCoord(d.source.point).y;})
	.attr("transform", function(d) {return EdgeLblOrientation(getAbsCoord(d.source.point).x, getAbsCoord(d.source.point).y, getAbsCoord(d.target.point).x, getAbsCoord(d.target.point).y, "lbl_" + d.id, d.topology)});

	//store last vertex position and rotation
	var currentVertex = [];
	currentVertex.push(VERTICES_BY_HC.get(trueVertexhc));
	var currentVertexbyId = d3.map(currentVertex, function(d){return d.hc});
	storeLocalVertexPositionning(currentVertexbyId);
}

/**
	* Unselect all previously selected vertex and Select a vertex (if not already selected),
	* and change the layout.
	*
	* @param {_vertex} - dom element object - must be a root group of a vertex
	* @returns nothing (select the vertex)
	*/
function selectVertex(_vertex){
	// 1. unselect all vertices
	unselectVertices();
	// 2. select current vertex
	var vtx = d3.select(_vertex);
	if (!vtx.classed("focused")) {
		var arc = vtx.selectAll(".arc");
		var externalEdges = D3_SCENE.selectAll(".edge").filter(function(d){return (d.source.hc == vtx.datum().hc || d.target.hc == vtx.datum().hc);}); // raise the proper external edges
		var internalEdges = vtx.selectAll(".edges");
		var point = vtx.selectAll(".point");
		vtx.raise();
		externalEdges.raise();
		//point.raise();
		vtx.classed("focused", true);
		arc.classed("notdisplayed", false).classed("draggable", true);
		point.classed("point-displayed", true);
		internalEdges.classed("notselectable", true);
		arc.call(d3.drag() //add edit arc listener
		.filter(function(d){return !this.classList.contains("notdisplayed");}) //not fired if arc is not displayed (removing the handler is buggy)
		.clickDistance(10)
		.on("start", arcDragStarted)
		.on("drag", arcDragged)
		.on("end", arcDragEnded));
		point.on("click", function(d) {
			d3.event.stopPropagation();
			console.log("click on point: ", d.point);
			setBhbPosition(d.point);
			return false;
		});
	}
}

/**
	* unselect vertices
	*
	* @returns nothing (unselect all vertices)
	*/
function unselectVertices(){
	D3_SCENE.selectAll(".focused").classed("focused", false);
	D3_SCENE.selectAll(".notselectable").classed("notselectable", false);
	D3_SCENE.selectAll(".arc").classed("notdisplayed", true).classed("draggable", false);
	D3_SCENE.selectAll(".point-displayed").classed("point-displayed", false).on("click", "");
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
	D3_SCENE.select("#" + _vertex).selectAll(".arc").classed("notdisplayed", true).classed("draggable", false);
	D3_SCENE.select("#" + _vertex).selectAll(".point-displayed").classed("point-displayed", false).on("click", "");
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
		.attr("xlink:href", "/sandbox/pinned3.png")
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
	* Sets display according to point position selected in the bhb
	*
	* @param {_ptId} - String point ID, the point must be setted before by setBhbPosition()
	*                  Optional. if null, the point defined on universe (data-data-bhbposition)
	* @returns {pt.datum()} (select the point and populates & open text nav)
	*/
function selectPoint(_ptId, _openToolbox) {
	_ptId = _ptId || CURRENT_BHB_POSITION;
	_openToolbox = _openToolbox || false;
	try {
		pt = D3_SCENE.select("#" + _ptId).datum();
	} catch (err) {
		console.log ("point: ", _ptId, " not found!");
		return false;
	}
	// populates hidden inputs for dummy navbar
	document.getElementById(TEXT_TOOLBOX_ID + "-point").value = pt.point;
	document.getElementById(TEXT_TOOLBOX_ID + "-next").value = pt.next;
	document.getElementById(TEXT_TOOLBOX_ID + "-peer").value = pt.peer;
	var ptbefore = D3_SCENE.selectAll(".point").filter(function(s){return s.next == pt.point;}).datum();
	document.getElementById(TEXT_TOOLBOX_ID + "-before").value = ptbefore.point;
	console.log("Click on point: ", pt, "value: ", text_readInfo(pt))
	text_nav(pt);
	// reinit prevously selected point
	var pointsViewed = D3_SCENE.selectAll(".viewed").classed("viewed",false);
	pointsViewed.each(function(d) {
		if (d.tagraw == "bhb:link") {
			d3.select(this).attr("marker-start", "url(#marker-start-bhbLink)").classed("start",false);
			d3.select(this).attr("marker-end", "url(#marker-end-bhbLink)").classed("end",false);

		} else {
			d3.select(this).attr("marker-start", "url(#marker-start)").classed("start",false);
			d3.select(this).attr("marker-end", "url(#marker-end)").classed("end",false);
		}
	});

	// open text toolbox and poupulates edit zone
	if (_openToolbox && (!D3_UNIVERSE.select("#" + TEXT_TOOLBOX_ID).classed("opened"))) {
		D3_UNIVERSE.select("#" + TEXT_TOOLBOX_ID).classed("opened", true).classed("closed", false);
	}
	var selectedEdge = D3_SCENE.selectAll("path.edges").filter(function(l){return (l.point == pt.point || l.peer == pt.point);});
	// select Point, Edge and style them it with the wiev marker
	D3_SCENE.select("#" + pt.point).classed("viewed",true);
	selectedEdge.classed("viewed",true);
	if (selectedEdge.datum().point == pt.point) {
		selectedEdge.classed("start", true);
		selectedEdge.attr("marker-start",function(d){return "url(#marker-start-position)";})
	} else {
		selectedEdge.classed("end", true);
		selectedEdge.attr("marker-end",function(d){return "url(#marker-end-position)";})
	}

	return Object.assign(pt, {topology:selectedEdge.datum().topology, displayed:true});
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
	.attr("title", "Next")
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
					//if (ptn.topology=="planar") {clearInterval(autonav);} // TODO: fix to make it stop !
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
	.attr("title", "Peer")
	.attr("accessKey", "p")
	.on("click", function(d) {
		var peerPtId = document.getElementById(TEXT_TOOLBOX_ID + "-peer").value;
		var peerVtxId = "gvertex_" + D3_SCENE.select("#" + peerPtId).datum().hc;
		simulateClick(document.getElementById(peerVtxId));
		simulateClick(document.getElementById(peerPtId));
	});

	// nav to before
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-secondary")
	.attr("id",TEXT_TOOLBOX_ID + "-btnBeforePt")
	.text(String.fromCharCode(8634)) //8592
	.attr("title", "Before")
	.attr("accessKey", "b")
	.on("click", function(d) {
		var beforePtId = document.getElementById(TEXT_TOOLBOX_ID + "-before").value;
		var beforeVtxId = "gvertex_" + D3_SCENE.select("#" + beforePtId).datum().hc;
		simulateClick(document.getElementById(beforeVtxId));
		simulateClick(document.getElementById(beforePtId));
	});

	// unselect
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-secondary")
	.attr("id",TEXT_TOOLBOX_ID + "-unselect")
	.text(String.fromCharCode(215))
	.attr("title", "unselect")
	.on("click", function(d) {
		D3_UNIVERSE.select("#" + TEXT_TOOLBOX_ID).classed("opened", false).classed("closed", true);
		document.getElementById(TEXT_TOOLBOX_ID + "-point").value = null;
		D3_SCENE.selectAll(".viewed").classed("viewed",false);
		D3_SCENE.selectAll("path.start").attr("marker-start", "url(#marker-start)").classed("start",false);
		D3_SCENE.selectAll("path.end").attr("marker-end", "url(#marker-end)").classed("end",false);
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
		downloadCSV(DATA, true);
	});

	// amend from this position
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-secondary")
	.attr("id",TEXT_TOOLBOX_ID + "-amend")
	.text(String.fromCharCode(43))
	.attr("title", "Edit from this point")
	.on("click", function(d) {
		amendFromPoint(document.getElementById(TEXT_TOOLBOX_ID + "-point").value);
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
	amendFromText(point.datum().path, point.datum().point,  point.datum().next, point.datum().order);
}


/**
	* Switch view from graph to text mode
	*
	* @returns {-} switch mode
	*/
function switchView(){
	if (CURRENT_BHB_MODE == "graph") setBhbMode("text");
	if (CURRENT_BHB_MODE == "text") setBhbMode("graph");
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
	if (_str.length == 0) return hash;
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
			forces.force("collide", d3.forceCollide().radius(function(d){return d.radius + 10;})); // collision detection
		}
		if (FORCES_STATUS.center.status) {
			var xc= D3_SCENE.property("clientWidth") / 2;
			var yc= D3_SCENE.property("clientHeight") / 2;
			forces.force("center", d3.forceCenter(xc,yc)) // force towards the center
		}
		if (FORCES_STATUS.charge.status) {
			forces.force("charge", d3.forceManyBody().strength(function(d){return (d.pc_planars) * 10;}));  // Nodes attracting or reppelling each others (negative = repelling)
		}
		//when all  vertices are pinned, faster decay
		if (D3_SCENE.selectAll(".gvertex").select("circle.pinned").size() == VERTICES_BY_HC.size()) {
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
		if (links == null) links = [];

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
	if (link.topology=='spheric') continue;
		var src_rot = getAbsTheta(source),
				tgt_rot = getAbsTheta(target);
		var xy_src  = getAbsCoord(source.point),
				xy_tgt  = getAbsCoord(target.point);
		var x = xy_tgt.x + d_tgt.vx - xy_src.x - d_src.vx|| qa_jiggle(),
				y = xy_tgt.y + d_tgt.vy - xy_src.y - d_src.vy|| qa_jiggle();
		// -------------------------------------------------------------
		var angle = Math.atan2(y, x);
		var vtt   = tgt_rot - angle + Math.PI,
				vst   = src_rot - angle;
		vtt %= 2 * Math.PI; if (vtt > Math.PI) vtt -= 2 * Math.PI;
		vst %= 2 * Math.PI; if (vst > Math.PI) vst -= 2 * Math.PI;
		// link spin (beware of native multiplier 180. / TT)
		d_tgt.spin -= vtt ; d_src.spin -= vst ;
		// -------------------------------------------------------------
		x -= distances[i] * Math.cos(src_rot);
		y -= distances[i] * Math.sin(src_rot);
		var l = Math.sqrt(x * x + y * y); x /= l;y /= l; /*unit vector*/
		var int = f * l, flx = x * int, fly = y * int;  /*force vector*/
		// link force
		d_tgt.vx -= flx * b; d_src.vx += flx * (1 - b);
		d_tgt.vy -= fly * b; d_src.vy += fly * (1 - b);
		//console.log("[planar]", i, x, y, l, tgt_rot, src_rot, '[success]', d_tgt.vx, d_tgt.vy, d_src.vx, d_src.vy);
	}
}

function initialize() {
	if (!vertices) return;
	var i,
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

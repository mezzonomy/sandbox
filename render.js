// ******************************************************
// Main constants affecting rendering
// runs once @js load
// ******************************************************
//const SCENE_HEIGHT = +800, SCENE_WIDTH = +800;
const SCENE_COLOR = "none";
const POINT_RADIUS = +1;
const VERTEX_RADIUS = +30;
const VERTEX_INNER_CIRCLE_RADIUS_RATIO = 0.1; // for hyperbolic crtl points
const VERTEX_COMPUTATION_MAX_ITERATION = 100; // Limits the vertex computation iterations
const BEYOND=800; // to get infinite line for spheric links
const ARC_INNER_RADIUS=.8; // Arc inner radius ratio proportianal to VERTEX_RADIUS
const LINK_TOPOLOGY = {planar:"planar", spheric:"spheric"};

var scene; //d3 object select scene
var svgScene; //dom object byid scene
var def_alpha = 1; // [0-1] default 1
var def_alphaTarget = 0; // [0-1] default 0
var def_linkDistance = 2 * VERTEX_RADIUS;
var zoom;
var vertexLastPosition=[];
var verticesbyHc=[];
var verticesPositionning;

function dragstarted(d) {
	d3.event.sourceEvent.stopPropagation();
	if (!d3.event.active) {
		verticesPositionning.alphaTarget(0.3).restart();
	}
	d.fx = d.x, d.fy = d.y;
	//console.log("VertexDragEvent started on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function dragged(d) {
	if (!d3.event.active) {
		d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
	}
	d.fx = d3.event.x, d.fy = d3.event.y;
	d3.select(this).classed("dragging", true);
	//console.log("VertexDragEvent dragged on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function dragended(d) {
	if (!d3.event.active) {
		verticesPositionning.alphaTarget(0.3);
	}
	//d.fx = null, d.fy = null;
	d.fx = d.x, d.fy = d.y; // fixed last place
	d3.select(this).classed("dragging", false);
	d3.select(this).select(".vertexCircle").classed("pinned", true);
	//console.log("VertexDragEvent ended on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

/***********************************************************************
***********************************************************************/
/*
 * Main render function. Called each time by the engine via websockets
 *
 * @returns a svg display of the vertices
 */
function render(data){
	// ******************************************************
	// Scene definition
	// ******************************************************
	scene = d3.select("#placeholder svg");

	// ------- no scene handler
	if (scene.empty()){
		scene = d3.select("#placeholder").append("svg")
		.attr("id", "scene");
	}
	svgScene = document.getElementById("scene");
	// ******************************************************
	// svg definitions
	// ******************************************************
	var defs= scene.select("defs");

	// ------- no scene handler
	if (defs.empty()){
		defs = scene.append("defs")
		defs.append("marker")
			.attr("id", "marker-end")
			.attr("markerWidth", "10")
			.attr("markerHeight", "10")
			.attr("refX", "1")
			.attr("refY", "5")
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M 0 5 L 10 5 L 0 5")
			.attr("stroke","black");
		defs.append("marker")
			.attr("id", "marker-start")
			.attr("markerWidth", "10")
			.attr("markerHeight", "10")
			.attr("refX", "9")
			.attr("refY", "5")
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M 0 5 L 10 5 L 0 5")
			.attr("stroke","black");
		/** ------------------------------------------------------------
			QUANTUM ALGEBRA MARKERS
			
			TBD : change the market of the the view for user spot

			<marker id="marker-end" markerWidth="10" markerHeight="10" refX="1" refY="5"
		    	orient="auto">
		  		<path stroke="black" d="M 0 5 L 10 5"/>
			</marker>
			<marker id="marker-start" markerWidth="10" markerHeight="10" refX="9" refY="5"
		    	orient="auto">
		  		<path stroke="black" d="M 0 5 L 10 5"/>
			</marker>
		**/
	}
	// ******************************************************
	// container
	// ******************************************************
	var container = scene.select("#container");

	// ------- no container handler
	if (container.empty()){
		container = scene.append("g")
		.attr("id", "container")
		.attr("class", "container");
	}

	// ******************************************************
	// zoom
	// ******************************************************

	zoom = d3.zoom()
    .scaleExtent([1/8, 8])
    .on("zoom", zoomed);

	scene.call(zoom)
	.on("click", function(d) {
		unselectVertices() //unselect vertices
		//console.log("Click on background:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
		})
	//.on("dblclick.zoom", null); //de-comment to prenvent dble click zooming (std in touch screen devices)

	var transform = d3.zoomIdentity;
	function zoomed() {
		container.attr("transform", d3.event.transform);
	}

	// ******************************************************
	// perspective buttons
	// ******************************************************
	//TODO: dev mode cheat
	// Add controls to perspective
	var div_perspective = d3.select("#perspective");
	var btnResetZoom = div_perspective.select("#btnReset-zoom");
	if (btnResetZoom.empty()) {
			//reset zoom
			var btnResetZoom = div_perspective.append("button").attr("type","button").attr("class","btn btn-info").attr("id","btnReset-zoom").text("zoom");
			btnResetZoom.on("click", function(){
				scene.transition()
				.duration(750)
				.call(zoom.transform, d3.zoomIdentity);
				})
	}
	var btnResetPosHistory = div_perspective.select("#btnReset-posHistory");
	if (btnResetPosHistory.empty()) {
			//reset zoom
			var btnResetPosHistory = div_perspective.append("button").attr("type","button").attr("class","btn btn-info").attr("id","btnReset-posHistory").text("reset");
			btnResetPosHistory.on("click", function(){
				console.log(localStorage.vertexLastPosition_json);
				verticesPositionning.stop();
				localStorage.removeItem("vertexLastPosition_json");
				//d3.selectAll(".container").remove();
				unpinVertices();
				scene.call(zoom.transform, d3.zoomIdentity);
				verticesPositionning.restart();
				//render(data);
        return;
			})
	}
	var btnstopAnimation = div_perspective.select("#stop-animation");
	if (btnstopAnimation.empty()) {
		var btnstopAnimation = div_perspective.append("button").attr("type","button").attr("class","btn btn-info").attr("id","stop-animation").attr("value","stop").text("freeze");
		btnstopAnimation.on("click", function(){
			verticesPositionning.stop();
			})
	}

	// ******************************************************
	// Rendering vertices
	// ******************************************************

	// compute vertices from QA points and create a vertex map

	var vertices = vertexComputation(data);
	verticesbyHc = d3.map(vertices, function(d) {return d.hc;});


	/*
	 * #D3_PATTERN# synchronizing vertex
	 */

		// Entering a svg group for each vertex
        // (for creating a logical group and a group drag behaviour)
		// linking data

		var newVertexGroup = container.selectAll(".gvertex")
		.data(vertices, function(d){return "gvertex_" + d.hc;});

		// Exit removed vertices
		newVertexGroup.exit().remove();

		// Computing new vertices
		newVertexGroup
		.enter()
		.append("g")
		.attr("class", "gvertex")
		.attr("id", function(d) {return "gvertex_" + d.hc;})
		.attr("vertex", function(d) {return d.hc;})
		.attr("pointNumber", function(d) {return d.pc;})
		.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

		// Selecting all displayed vertex groups
		vertexGroup = container.selectAll(".gvertex");

	/*
	 * ----------------------------------------------------------------
	 */

	/* Not Always preceeded by a drag started/drag ended */
	vertexGroup.on("click", function(){ //Add click for selecting vertices
		d3.event.stopPropagation(); //otherwise clicks on background which unselect nodes
		selectVertex(this);
		//console.log("VertexClikEvent on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
	})

	/*
	 * ----------------------------------------------------------------
	 */

	// entering the vertex circles (on the static vertex group, the shadow should not turn)
	var circle = vertexGroup.selectAll(".vertexCircle")
	.data(function(d){return [d];}, function(d){return "vertexCircle_" +  d.hc;})
	.enter()
	.append("circle")
	.attr("class", "vertexCircle")
	.attr("r", VERTEX_RADIUS)
	.attr("fill", "white")
	//.attr("filter","url(#shadow2)")
	.attr("id", function(d) {return "vertexCircle_" + d.hc;});

	// Add another group within to handle vertex rotation
	var vertexGroupRotateNew = vertexGroup.selectAll(".vertexGroupRotate")
	.data(function(d){return [d];}, function(d){return "grotate_" + d.hc;})
	.enter()
	.append("g")
	.attr("class", "vertexGroupRotate")
	.attr("transform","rotate(0)") // init the transform attribute for later storage
	.attr("id", function(d) {return "grotate_" + d.hc;});

	vertexGroupRotate = container.selectAll(".vertexGroupRotate");

	vertexGroupRotate
	.on("wheel", function() {d3.event.stopPropagation();})
	.on("wheel.rotate",function(){
		//TODO: set a timer in an external function to trap fewer ticks (see Wheel in d3 code)
		//console.log("Wheel rotate vertex Event on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this))
		selectVertex(this.parentNode);
		if (this.attributes.transform) {
			var currentRotate=Number(this.attributes.transform.value.replace("rotate(", "").replace(")",""));
		} else {
			var currentRotate=0;
		}
		d3.select(this).attr("transform", "rotate(" + (currentRotate + d3.event.wheelDelta) + ")");
		d3.select(this).attr("data-storedRotation", "rotate(" + (currentRotate + d3.event.wheelDelta) + ")"); // store on vertex for simulation forces ticks
		redrawLinksforOneVertex(this.id);
	});

	// entering a dummy circle for rotation event handling
	var circle = vertexGroupRotate.selectAll(".vertexCircleRotate")
	.data(function(d){return [d];})
	.enter()
	.append("circle")
	.attr("class", "vertexCircleRotate")
	.attr("r", VERTEX_RADIUS);

	// Entering arcs within vertex's group grotate
	var pie = d3.pie()
	    .sort(null)
	    .value(function(d) { return 1; });

	var arc = d3.arc()
	    .outerRadius(VERTEX_RADIUS)
	    .innerRadius(VERTEX_RADIUS * ARC_INNER_RADIUS);

	var coloring = d3.scaleOrdinal(d3.schemeCategory10);

	var arc = vertexGroupRotate
	.selectAll(".arc")
	.data(function(d){return d.segments;}, function(d) {return "arc_" + d.point;}) //pie calculation already in data (segment reconstruction), standard d3 pie() not used
	.enter()
	.append("path")
	.attr("class", "arc notdisplayed") //arcs are hidden by default
	.attr("id", function(d) {return "arc_" + d.point;})
	.attr("d", arc)
	.style("fill",function(d) {return coloring(d.point);})
	.attr("draggable","true")
	.attr("ondragstart","drag(event)")
	.on("click", function() {
      d3.event.stopPropagation();
			window.alert("toto");
		});

	// Entering points within vertex's group rotate (last added to be on top)
	var point = vertexGroupRotate
	.selectAll(".point")
	.data(function(d){return d.segments;}, function(d) {return d.point;})
	.enter()
	.append("circle")
	.attr("class", "point")
	.attr("id", function(d) {return d.point;})
	.attr("r", POINT_RADIUS)
	.attr("cx", function(d,i) {return d.posX;})
	.attr("cy", function(d,i) {return d.posY;});

	// Create a map of points across the vertices
	var points=[];
	vertexGroupRotate.each(function(d,i){
		d.segments.forEach(function(d,i){
			var index={index: i};
			var pc= d.pc;
			var hc= d.hc;
			var info= d.info;
			var cx= d.posX;
			var cy= d.posY;
			var ctrlpointx= cx * VERTEX_INNER_CIRCLE_RADIUS_RATIO;
			var ctrlpointy= cy * VERTEX_INNER_CIRCLE_RADIUS_RATIO;
			points.push(Object.assign({}, d, index, {pc: pc}, {hc: hc}, {cx: cx}, {cy: cy}, {ctrlpointx: ctrlpointx}, {ctrlpointy: ctrlpointy}));
		})
	});
	var pointsById = d3.map(points, function(d) { return d.point; });

	/*------------------------------------------------------------------
	 * Drawing hyperbolic arcs within the vertices
	 */
	var hyperbolicLnk = vertexGroupRotate
	.selectAll(".hyperbolicLnk")
	.data(function(d){return d.segments;}, function(d){return d.point;})
	.enter()
	.filter(function(d) {return (d.point.startsWith("T") && (d.hc == pointsById.get(d.peer).hc))})
	.append("path")
	.attr("class", "hyperbolicLnk")
		.attr("marker-end","url(#marker-end)")
		.attr("marker-start","url(#marker-start)")
	.attr("id", function(d) {return "arc_" + d.point;})
	// JUST AN EXAMPLE : TODO, remove
	.attr("d", function(d){
		return "M" + pointsById.get(d.point).cx + "," + pointsById.get(d.point).cy
		+ "C" + pointsById.get(d.point).ctrlpointx * ratioCtrlPointsHyperbolicLnk(pointsById.get(d.point), pointsById.get(d.peer))
		+ "," + pointsById.get(d.point).ctrlpointy * ratioCtrlPointsHyperbolicLnk(pointsById.get(d.point), pointsById.get(d.peer))
		+ " " + pointsById.get(d.peer).ctrlpointx * ratioCtrlPointsHyperbolicLnk(pointsById.get(d.point), pointsById.get(d.peer))
		+ "," + pointsById.get(d.peer).ctrlpointy * ratioCtrlPointsHyperbolicLnk(pointsById.get(d.point), pointsById.get(d.peer))
		+ " " + pointsById.get(d.peer).cx + "," + pointsById.get(d.peer).cy
		;
	});

	/*
	 * Applying previous stored Positionning
	 */
	var storedPosition = JSON.parse(localStorage.getItem("vertexLastPosition_json"));
	if (storedPosition && storedPosition.length > 0) {
		var storedPositionByOldestPoint = d3.map(storedPosition, function(d){return d.oPt})
		//applying vertices' position and rotation
		vertexGroup.each(function (d) {
			var storedVertex=storedPositionByOldestPoint.get(d.oldestPoint);
			if (storedVertex) {
				d.fx=storedVertex.oX;
				d.fy=storedVertex.oY;
				d3.select("#grotate_" + d.hc).attr("data-storedRotation",storedVertex.oRt); // reinitiated by force simulation, hence stored in local dataset replayed in ticks
				d3.select("#gvertex_"+ d.hc).select(".vertexCircle").classed("pinned", true);
			}
		})
	}

	// ******************************************************
	// Rendering planar edges
	// ******************************************************

	/*
	 * Force planar links between vertices (temporary)
	 */

	//TODO: remove when forces OK

		// virtual planar Lnk forces beween vertex's group layer

		// 1.creating a source/target array
		var forceLinks=[];
		pointsById.each(function(d){
			if (d.point.startsWith("T") && (d.hc != pointsById.get(d.peer).hc)) {
				var s = verticesbyHc.get(d.hc);
				var t = verticesbyHc.get(pointsById.get(d.peer).hc);
				var id = "forceLinksVertices_" + verticesbyHc.get(d.hc).hc;
				forceLinks.push({id: id, source: s, target: t});
			}
		});

		// 2.entering forceLink between quantum center
		var forceLink = container
		.selectAll(".forceLink")
		.data(forceLinks, function(d){return d.id;})
		.enter()
		.append("line").attr("class", "forceLink")
		.attr("id", function(d){return d.id;});

	//TODO: remove when forces OK

	/*
	 * Real qa links map
	 */
	 // Creating a list of all links (only planar and spheric)
	 // for drawing links & force simulation for positionning
	 // in d3 source/target format

	 var qaLinks=[];

	 pointsById.each(function(d){
		var topology = "";
		if (d.point == d.peer) { //spheric link case
			topology = "spheric";
			var s = Object.assign({}, d);
 			var t = Object.assign({}, d); // new fictionnal point alone in deep universe
 				t.point = d.peer;
 				t.peer = d.point;
 				t.virtual = true;
 			var id = topology + "_" + d.hc + "_" + d.point;
		}
		if (d.point.startsWith("T") && (d.hc != pointsById.get(d.peer).hc)) { // planar link
			topology = "planar";
			var s = Object.assign({}, d);
			var t = Object.assign({}, pointsById.get(d.peer));
			var id = topology + "_" + d.hc + "_" + t.hc + "_" + d.point;
		}
		if (topology) {qaLinks.push({topology:topology, id:id, source:s, target:t});}
 	});

	/*
	 * #D3_PATTERN# Adding links
	 */

		 var newQaLink = container
	 	.selectAll(".link")
	 	.data(qaLinks, function(d){return d.id;});

	 	newQaLink.exit().remove();

	 	newQaLink
	 	.enter()
	 	.append("line")
		.attr("class", function(d){return "link " + d.topology;})
	 	.attr("id", function(d){return d.id;})
		.attr("marker-end","url(#marker-end)")
		.attr("marker-start","url(#marker-start)");
	 	var qaLink =  container.selectAll(".link");

	/*
	 * #D3_PATTERN# Adding link labels
	 */

	 	var newQaLinkLabel = container
	 	.selectAll(".linkLabel")
	 	.data(qaLinks, function(d){return "label_" + d.id;});

	 	newQaLinkLabel.exit().remove();

	 	newQaLinkLabel
	 	.enter()
	 	.filter(function(d){return d.topology == "planar"}) //only planar links have labels
	 	.append("text")
	 	.attr("class", function(d) {return "linkLabel label " + d.topology;})
	 	.attr("id", function(d){return "label_" + d.id;})
	 	.text(function(d) {
			//return d.source.info + " " + d.source.point + "->" + d.target.point;
			return d.source.info;
			});

	 	var qaLinkLabel =  container.selectAll(".linkLabel");

	/* -----------------------------------------------------------------

			FORCES AND TICKS

    ------------------------------------------------------------------*/
	// Link forces
	verticesPositionning = qa_vertices_forces()
	verticesPositionning.force("link").links(qaLinks);
	verticesPositionning.nodes(vertices).on("tick", ticked).on("end", endTick);
	verticesPositionning.restart(); //reinit forces

	// Positionning calculation at each tick
	var semaphore = true;
	function ticked() {
		if (semaphore){
			try{
				semaphore = false

				//tick render
				vertexGroup
				.attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";});

				vertexGroupRotate
				.attr("transform", function(d) {return "rotate(" + d.spin + ")";}); //rotation by spin in coded in force
				/*.attr("transform", function(d) {return this.dataset.storedRotation });*/

				forceLink
				.attr("x1", function(d) {return d.source.x;})
				.attr("y1", function(d) {return d.source.y;})
				.attr("x2", function(d) {return d.target.x;})
				.attr("y2", function(d) {return d.target.y;});

				qaLink
				.filter(function(d){return (d.topology == "planar");})
				.attr("x1", function(d) {
					return getAbsCoord(d.source.point).x;})
				.attr("y1", function(d) {
					return getAbsCoord(d.source.point).y;})
				.attr("x2", function(d) {
					return getAbsCoord(d.target.point).x;})
				.attr("y2", function(d) {
					return getAbsCoord(d.target.point).y;});

				qaLink
				.filter(function(d){return (d.topology == "spheric");})
				.attr("x1", function(d) {return getAbsCoord(d.source.point).x;})
				.attr("y1", function(d) {return getAbsCoord(d.source.point).y;})
				.attr("x2", function(d) {
					return (getAbsCoord(d.source.point).x - getAbsCoord("gvertex_" + d.target.hc).x) * BEYOND;})
				.attr("y2", function(d) {return (getAbsCoord(d.source.point).y - getAbsCoord("gvertex_" + d.target.hc).y) * BEYOND;});

				qaLinkLabel
				.filter(function(d){return (d.topology == "planar");})
				.attr("x", function(d) {return getAbsCoord(d.source.point).x;})
				.attr("y", function(d) {return getAbsCoord(d.source.point).y;})
				.attr("transform", function(d) {return LnkLabelOrientation(getAbsCoord(d.source.point).x, getAbsCoord(d.source.point).y, getAbsCoord(d.target.point).x, getAbsCoord(d.target.point).y, "label_"+d.id)});

				storeLocalVertexPositionning(verticesbyHc); //store last vertex position and rotation
				}
			catch(error) {
			//console.log("fantom !");
}
			semaphore = true;
} else {
		console.log('multi-tick!');		}
	}

	function endTick() {
		//toggle force btn off
		//d3.select("#stop-animation").attr("value","start").text("Ended. Restart animation");
	}
}


/***********************************************************************
***********************************************************************/



function redrawLinksforOneVertex(vertexhc) {
	var trueVertexhc=Number(vertexhc.replace("grotate_",""));

	planarLink=d3.selectAll("line.planar")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("x1", function(d) {return getAbsCoord(d.source.point).x;})
	.attr("y1", function(d) {return getAbsCoord(d.source.point).y;})
	.attr("x2", function(d) {return getAbsCoord(d.target.point).x;})
	.attr("y2", function(d) {return getAbsCoord(d.target.point).y;});

	planarLinkLabel=d3.selectAll("text.planar")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("x", function(d) {return getAbsCoord(d.source.point).x;})
	.attr("y", function(d) {return getAbsCoord(d.source.point).y;})
	.attr("transform", function(d) {return LnkLabelOrientation(getAbsCoord(d.source.point).x, getAbsCoord(d.source.point).y, getAbsCoord(d.target.point).x, getAbsCoord(d.target.point).y, "label_" + d.id)});

	sphericLink=d3.selectAll("line.spheric")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("x1", function(d) {return getAbsCoord(d.source.point).x;})
	.attr("y1", function(d) {return getAbsCoord(d.source.point).y;})
	.attr("x2", function(d) {return (getAbsCoord(d.source.point).x - getAbsCoord("gvertex_" + d.target.hc).x) * BEYOND;})
	.attr("y2", function(d) {return (getAbsCoord(d.source.point).y - getAbsCoord("gvertex_" + d.target.hc).y) * BEYOND;});

	//store last vertex position and rotation
	var currentVertex = [];
	currentVertex.push(verticesbyHc.get(trueVertexhc));
	var currentVertexbyId = d3.map(currentVertex, function(d){return d.hc});
	storeLocalVertexPositionning(currentVertexbyId);
}

/**
 * Utility to find absolute x,y coordinates of a dom element in zoomed contexts
 * @param {string}  elt - element dom id
 * @returns {object} svg point - point coordinates {x,y}
 */
function getAbsCoord(elt) {
	if (svgScene.getElementById(elt)) { // to filter phantom links : TODO: improve by suppressing these fantom links
		var ptn = svgScene.getElementById(elt);
		var matrixPt = ptn.getCTM(); //get current elt transformation on svg
		var pt = svgScene.createSVGPoint(); //create new point on the svg
		pt.x = +ptn.getAttribute("cx");
		pt.y = +ptn.getAttribute("cy");
		var ptt = pt.matrixTransform(matrixPt); // apply coord translation on the new point
		var zm = d3.zoomTransform(svgScene); // get zoom transform of the viewport (x,y,k)
		ptt.x = (ptt.x - zm.x) / zm.k; // reverse the zoom translation on x
		ptt.y = (ptt.y - zm.y) / zm.k; // reverse the zoom translation on y
		return {
			x: ptt.x,
			y: ptt.y
		};
	} else {
			//console.log ("Internal Error: ", "getAbsCoord()", " While trying to found elt position of: ", elt); // not logged
			return {x:0, y:0}; //No error if elt not found
	}
}

/*
 * Vertex Computation
 *
 */

/**
 * Compute an array of vertices from a list of QAPoints The computation is done
 * until vertices are complete with a max number of iteration fixed by
 * VERTEX_COMPUTATION_MAX_ITERATION Also outputs logs and a div of the vertices
 * computed Vertices : bp = begin point id ep = end point id pc = point count hc =
 * hash of the segments segments = array of point objects
 * - computation of "oldest point" for the vertex
 * - computation of topology
 *
 * @param {array}
 *            QApointsList - array of QApoints (point, next, peer, type)
 * @returns an array of vertex objectqaLinks with a sub array of segments : the points
 *          of the vertex
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
	// Maximum of iteration for Vertices computation =
	// VERTEX_COMPUTATION_MAX_ITERATION
	while ((sr.find(function(s){return s.ep!=s.bp;})) && (j<VERTEX_COMPUTATION_MAX_ITERATION)){
		for(var i=0, n=sr.length; i<n; i++){
			if (!sr[i]){break;};
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

	//Adding positionning calculation of points and arcs as data in post computation
	for(var i=0, n=sr.length; i<n; i++){
		for (var k=0, l=sr[i].segments.length;k<l;k++) {
			var angle1 = k * (2*Math.PI / (sr[i].pc + (sr[i].pc + .5)%2));
			var angle2 = (k == l-1)? 2*Math.PI:(k+1) * (2*Math.PI / (sr[i].pc + (sr[i].pc + .5)%2));
			sr[i].segments[k].posX=VERTEX_RADIUS * Math.cos(angle1); // x coordinate of the point on the vertex's circle
			sr[i].segments[k].posY=VERTEX_RADIUS * Math.sin(angle1); // y coordinates of the point on the vertex's circle
			sr[i].segments[k].startAngle=angle1 + Math.PI*.5; // angle in degrees of the point on the vertex circle. To draw arcs (D3 pie format)
			sr[i].segments[k].endAngle=angle2 + Math.PI*.5; // angle in degrees of the next point on the vertex circle. To draw arcs (D3 pie format)
			sr[i].segments[k].index=k; // index of the point in the vertex
			sr[i].segments[k].padAngle=0; //no pading between arcs
			sr[i].segments[k].value=1; //all arcs have the same weight
		}
	}

	//oldest point (smallest number) of each vertex for managing positionning history of vertices
	for(var i=0, n=sr.length; i<n; i++){
		var sortOldest=sr[i].segments.sort(function(a, b){return Number((a.point.match(/[0-9]/g)).join(''))-Number((b.point.match(/[0-9]/g)).join(''))});
		sr[i].oldestPoint = sortOldest[0].point;
	}

	// logs TODO: remove
	console.log("Vertices reconstruction in ", (j + 1), " iterations: ", sr);
	return sr;
}

/**
 * Select a vertex, and change the layout.
 * If the vertex is already selected, unpin and unselect the vertex
 *
 * @param {d3vertex} - dom element object - must be a root group of a vertex
 * @returns nothing (select the vertex)
 */
function selectVertex(vertex){
	unselectVertices(); // 1. unselect all
	// 2. select current vertex or unpin and unselect
	var d3vertex = d3.select(vertex);
	if (!d3vertex.classed("focused")){
		d3vertex.classed("focused", true);
		var arc = d3vertex.selectAll(".arc");
		arc.classed("notdisplayed", false);
	} else {
		d3vertex.classed("focused", false);
		var arc = d3vertex.selectAll(".arc");
		arc.classed("notdisplayed", true);
		d3vertex.fx=null;
		d3vertex.fy=null;
		d3vertex.classed("pinned", false);
	}


}

/**
 * unselect vertices
 *
 * @returns nothing (unselect all vertices)
 */
function unselectVertices(){
	d3.selectAll(".focused").classed("focused", false);
	d3.selectAll(".arc").classed("notdisplayed", true);
}

/**
 * unselect & unpin vertices
 *
 * @returns nothing (unselect all vertices and resets fixed position)
 */
function unpinVertices(){
	d3.selectAll(".gvertex").each(function(d){d.fx=null;d.fy=null;});
	d3.selectAll(".gvertex").select(".vertexCircle").classed("pinned", false);
	unselectVertices()
}

/*
 * Misc functions & classes
 */

/**
 * Hash function Returns a integer value from a string with d2jb algo. If string
 * length is 0, returns 0. See website below
 *
 * @see http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
 * @param {string}
 *            str - js string value
 * @returns {integer} hascode - 32bit integer
 */
function hashCode(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

/**
 * Prints a Vertex as a string of the points segments or a hash of the value
 * Default is hash
 *
 * @param {object:vertex} -
 *            vertex object as defined in the code : {bp:point, ep:next, pc:1,
 *            hc:"", segments:segments}
 * @param {boolean}
 *            hash - if true returns a hash, otherwise the chain of the points.
 * @returns {chain|integer} chain or hascode - 32bit integer depending of hash
 *          param value
 */
function vertexToString(vertex, hash){
	var hash = (typeof hash !== 'undefined') ? hash : true;

	var vertexString=""
	for (var i=0, n=vertex.segments.length; i<n; i++) {
		vertexString += "bp:" + vertex.segments[i].point;
		vertexString += "ep:" + vertex.segments[i].next;
		vertexString += "pp:" + vertex.segments[i].peer;
	}
	if (hash) {
		return hashCode(vertexString);
	} else {
		return vertexString;
	}
}
/**
 * function for computing the arcs depending of points distance and points#
 * giving a nice shape and intersec vertex's circle
 *
 * @param {object:point} - point object from
 * @param {object:point} - point object to
 * @returns {integer} numeric - A ratio based on proximity to apply to point
 */
function ratioCtrlPointsHyperbolicLnk(pointSource, pointTarget){
	// PGT: 180205 - pas d'impact visible de cette valeur
	var distance = pointTarget.index - pointSource.index;
	return 1.0
}

/**
 * function for computing label orientation of a line
 *
 * @param {x1 -y2} - num - coordinates of the begin/end of the link
 * @param optional {labelId} - id - uid of the label to get correct positionning
 * @returns {string} - A SVG rotate transformation string
 */
function LnkLabelOrientation(x1, y1, x2, y2, labelId) {
	labelId = labelId || "";
	var rt = Math.atan2(-y2+y1, x2-x1) * -180/Math.PI;
	var labelBox, translate1 = 0, translate2 = 0;
	if (document.getElementById(labelId)) {
		labelBox = document.getElementById(labelId).getBBox();
	} else {
		labelBox = {x:0, y:0, width:0, height:0};
	}
	if (Math.abs(rt) < 90) {
		return "rotate(" + rt + " , " + x1 + " , " + y1 + ") translate (10, -3)";
	} else {
		return "rotate(" + (rt - 180) + " , " + x1 + " , " + y1 + ") translate (" + (-labelBox.width - 10) + " , -3)";
	}
}

/**
 * Store localy the position of the vertices (both tanslation & rotation) in the global variable vertexLastPosition
 *
 * @param {_verticesbyHc} - d3map - map of drawn vertices to register their transformations
 */
function storeLocalVertexPositionning(_verticesbyHc){
	vertexLastPositionbyPoint = d3.map(vertexLastPosition, function(d) {return d.oPt});
	_verticesbyHc.each(function (d) {
		if (document.getElementById("gvertex_" + d.hc).attributes.transform){
			transform_vertex = document.getElementById("gvertex_" + d.hc).attributes.transform.value;
		} else {
			transform_vertex = "";
		}
		if (document.getElementById("grotate_" + d.hc).attributes.transform){
			transform_vertexRotate = document.getElementById("grotate_" + d.hc).attributes.transform.value;
		} else {
			transform_vertexRotate = "rotate(0)";
		}
		if (!vertexLastPositionbyPoint.get(d.oldestPoint)) {
				vertexLastPosition.push({hc:d.hc, oPt:d.oldestPoint, oX: d.x, oY: d.y, oTf:transform_vertex, oRt:transform_vertexRotate});
		} else {
			vertexLastPositionbyPoint.get(d.oldestPoint).oX=d.x;
			vertexLastPositionbyPoint.get(d.oldestPoint).oY=d.y;
			vertexLastPositionbyPoint.get(d.oldestPoint).oTf=transform_vertex;
			vertexLastPositionbyPoint.get(d.oldestPoint).oRt=transform_vertexRotate;

		}
		var vertexLastPosition_json = JSON.stringify(vertexLastPosition);
		localStorage.setItem("vertexLastPosition_json", vertexLastPosition_json);
	})
}

	// ******************************************************             _______________________________
	// Applying Forces to elements
    //            1. forceCenter: center vertices                                   F O R C E S
    //            2. forceCollide: colliding vertices                     _______________________________
    //            3. qa_linkPoints: edge-directed force
	// ******************************************************

function qa_vertices_forces(qaLinks, vertices) {
	var xc= scene.property("clientWidth") / 2;
	var yc= scene.property("clientHeight") / 2;
	forces = d3.forceSimulation()
		//.alpha(def_alpha)
		//.alphaTarget(def_alphaTarget)
		.force("center", d3.forceCenter(xc,yc))
		.force("charge", d3.forceManyBody().strength(-30))
		//.force("charge", d3.forceCollide().radius(VERTEX_RADIUS * 2)/*.iterations(16)*/)
		.force("link", qa_linkPoints().distance(4*VERTEX_RADIUS).strength(1).id(function(d) {return d.id;})) // customized force
		//.force("link", d3.forceLink().distance(4*VERTEX_RADIUS).strength(4).id(function(d) {return d.id;})) // std d3 force
		//.force("link").links(forceLinks);
        ;
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
		if (!d) return 0
		var theta = Number(d.attributes.transform.value
                               .replace("rotate(", "").replace(")",""));
		theta /= 180.0; theta *= Math.PI
		theta += Math.atan2(point.cy, point.cx)
		return theta
}
/** --------------------------------------------------------------------
 * Defining a new force for vertices positioning driven by points' positions and links
 * Driven from original link function from d3 4.12.2 (https://d3js.org/)
 * Require several new properties in the link definition
 */

  function force(alpha) {
	  // left bound for spheric binding to it 
      for (var i = 0, x_min = 10000000000000.0; i < links.length; ++i) {
      	var link = links[i], source = link.source; 
			x_min = Math.min(getAbsCoord(source.point).x, x_min)};  

      for (var i = 0; i < links.length; ++i) {
        var f    = alpha * strengths[i];           /* force intensity */
        var b    = bias[i]                              /* force bias */
        var link = links[i], source = link.source, target = link.target;
                                                         /* link data */
		var d_tgt, d_src; try {
			d_tgt = d3.select("#gvertex_"+target.hc).datum();
			d_src = d3.select("#gvertex_"+source.hc).datum();
		} catch (e) {
			//console.log("(error - data) i:", i, "id: ", links[i].id);
			continue;}                              /* vertex d3 data */

		var src_rot = getAbsTheta(source), tgt_rot = getAbsTheta(target),
		                                              /* point angles */
		    xy_src  = getAbsCoord(source.point), xy_tgt  = getAbsCoord(target.point),
		                                        /*  point coordinates */
		    x       = xy_tgt.x - xy_src.x || qa_jiggle(),
			y       = xy_tgt.y - xy_src.y || qa_jiggle();
                                        /* point to point link vector */

	    var l = Math.sqrt(x * x + y * y);           /*       distance */
	                      x /= l, y /= l;           /*    unit vector */

		// -------------------------------------------------------------
                               
        /* SPHERIC LINK CASE */
		if (link.topology=='spheric') {
			console.log("(spheric) i:", i, "id: ", links[i].id);
			var vtt = tgt_rot + Math.PI;
			vtt %= 2 * Math.PI; if(vtt > Math.PI) vtt -= 2 * Math.PI;  
	        d_src.spin -= vtt       / 3;          /* bind theta to TT */
	        d_src.vx   -= (xy_tgt.x - x_min) / 3;    /* bind x to min */
			continue;}

		/* SOURCE SPIN */
		var vtt = tgt_rot - Math.atan2(y,x) + Math.PI;
		vtt %= 2 * Math.PI; if(vtt > Math.PI) vtt -= 2 * Math.PI;  
		vtt *= f                   

		/* TARGET SPIN */
		var vst = src_rot - Math.atan2(y, x);
		                             /* differential to expectation */
		vst %= 2 * Math.PI; if (vst > Math.PI) vst -= 2 * Math.PI;
                                               /* put it in [-TT, TT[ */
		vtt *= f                         /* scale spin with intensity */

		/* LINK FORCE */
		/** may be improved by controling a vector rather than distance
		    TBD : find the desired vector with source and target angle

			(at the stage, could removed, replaced by standard force
			 and subsequent code compression)
         **/

	    var intensity = f * (l - distances[i]);        //force intensity
	    var flx = x * intensity, fly = y * intensity;  //force vector 

		// -------------------------------------------------------------                               
	    d_tgt.vx -= flx * b ;
        d_tgt.vy -= fly * b;    
	    d_src.vx += flx * (1 - b);
		d_src.vy += fly * (1 - b);                      //link force
		 

	    d_tgt.spin -= vtt                              //target spin
	    d_src.spin -= vst;                             //source spin

		//console.log("[planar]", i, x,y, l, tgt_rot, src_rot, '[success]', d_tgt.vx, d_tgt.vy,  d_src.vx, d_src.vy);
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
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(vertexById, link.source);
      if (typeof link.target !== "object") link.target = find(vertexById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), qa_initializeStrength();
    distances = new Array(m), qa_initializeDistance();
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


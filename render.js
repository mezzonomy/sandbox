/**
 * @file render.js
 * @copyright (c) 2014-2018, sarl mezzònomy
 * @author mezzònomy
 */

const SCENE_COLOR = "none",
			POINT_RADIUS = +1,
			VERTEX_RADIUS = +30,
			VERTEX_RADIUS_M = 10, //The vertex radius is multiplied by ((this ratio) * sqrt(point number))
			VERTEX_COMPUTATION_MAX_ITERATION = 100, // Limits the vertex computation iterations
			BEYOND=800, // to get infinite line for spheric edges
			ARC_INNER_RADIUS=.1, // Proportional to VERTEX_RADIUS. It is the radius of the inner donut circle of a selected vertex
			AMEND_TOOLBOX_ID = "amendment",
			AMEND_EDITZONE_ID = "amendment-editzone",
			AMEND_TEMPLATE_T_X = "<bhb:link push='$ID'>\nINSERT XML\n</bhb:link>",
			AMEND_TEMPLATE_B_X = "<bhb:link after='$ID'>\nINSERT XML\n</bhb:link>",
			TEXT_TOOLBOX_ID = "text",
			TEXT_EDITZONE_ID = "text-editzone";

var scene, //d3 object select scene
		svgScene, //dom object byid scene
		def_alpha = 1, // [0-1] default 1
		fast_alpha = .3, // accelerate forces when dragging
		zoom,
		vertexLastPosition=[],
		verticesbyHc=[],
		verticesPositionning,
		edgesColored = false;

function dragstarted(d) {
	d3.event.sourceEvent.stopPropagation();
	if (!d3.event.active) {
		verticesPositionning.alphaTarget(fast_alpha).restart();
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
		verticesPositionning.alphaTarget(fast_alpha);
	}
	//d.fx = null, d.fy = null;
	// fixed last place
	d.fx = d.x;
	d.fy = d.y;
	d3.select(this).classed("dragging", false);
	d3.select(this).select(".vertexCircle").classed("pinned", true);
	//console.log("VertexDragEvent ended on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function arcDragStarted(d) {
	d3.event.sourceEvent.stopPropagation();
	d3.select("#" + AMEND_EDITZONE_ID).attr("placeholder","drag the selected arc here to amend it !");
	d3.select(this).classed("dragging",true)
	d3.select("#" + AMEND_EDITZONE_ID).classed("targeted", true);
	// TODO: fix adding dataTransfert API to drag/drop outside the browser
	//console.log("arcDragStarted started on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function arcDragged(d) {
	d3.select(this).attr("transform", "translate("+  d3.event.x + "," + d3.event.y + ")");
	if (d3.event.sourceEvent.target.id == AMEND_EDITZONE_ID) {
		d3.select("#" + AMEND_EDITZONE_ID).classed("zoom11", true);
	} else {
		d3.select("#" + AMEND_EDITZONE_ID).classed("zoom11", false);
	}
	if (d3.event.sourceEvent.target.id == AMEND_TOOLBOX_ID) {
		if (!d3.select("#" + AMEND_TOOLBOX_ID).classed("opened")) {
			d3.select("#" + AMEND_TOOLBOX_ID).classed("opened", true).classed("closed", false);
		}
	}
	//d3.select(this).classed("dragging", true);
	//console.log("arcDragged dragged on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

function arcDragEnded(d) {
	//d3.select(this).classed("dragging", false);
	if (d3.event.sourceEvent.target.id == AMEND_EDITZONE_ID) {
		alertInit();
		var point = d3.event.subject.point.replace(/T_/,"").replace(/B_/,"");
		document.getElementById(AMEND_TOOLBOX_ID + "-point").value = d.point;
		document.getElementById(AMEND_TOOLBOX_ID + "-next").value = d.next;
		if (d3.event.subject.point.startsWith("T_")){
			document.getElementById(AMEND_EDITZONE_ID).value = AMEND_TEMPLATE_T_X.replace("$ID",point);
		}
		if (d3.event.subject.point.startsWith("B_")){
			document.getElementById(AMEND_EDITZONE_ID).value = AMEND_TEMPLATE_B_X.replace("$ID",point);
		}
	}
	d3.select("#" + AMEND_EDITZONE_ID)
	.classed("targeted", false).classed("zoom11", false)
	.on("focus",function(d){
		d3.selectAll(".arc.edited").classed("edited",false);
		d3.select(this).classed("edited",true);
	});
	d3.select(this).attr("transform", null); //return arc to initial position
	//console.log("arcDragEnded ended on:", this, "d3.event:",  d3.event, "d3.mouse:", d3.mouse(this));
}

/***********************************************************************
***********************************************************************/
/*
 * Main render function. Called each time by the engine via websockets
 * @param data {array} Array of QA points
 * @returns a svg display of the vertices
 */

function render(data){
	// ******************************************************
	// Scene definition
	// ******************************************************
	scene = d3.select("#placeholder svg");

	// ------- no scene handler
	if (scene.empty()){
		scene = d3.select("#placeholder").append("svg").attr("id", "scene");
	}
	svgScene = document.getElementById("scene");
	// ******************************************************
	// svg definitions
	// ******************************************************
	var defs= scene.select("defs");

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
			.attr("d", "M 0 5 L 10 5")
			.attr("stroke","black");
		defs.append("marker")
			.attr("id", "marker-start")
			.attr("markerWidth", "10")
			.attr("markerHeight", "10")
			.attr("refX", "9")
			.attr("refY", "5")
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M 0 5 L 10 5")
			.attr("stroke","black");
		defs.append("marker")
			.attr("id", "marker-start-entry")
			.attr("markerWidth", "40")
			.attr("markerHeight", "40")
			.attr("refX", "10")
			.attr("refY", "20")
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M35 35 L5 20 L35 5")
			.attr("stroke","black");
		defs.append("marker")
			.attr("id", "marker-end-entry")
			.attr("markerWidth", "40")
			.attr("markerHeight", "40")
			.attr("refX", "30")
			.attr("refY", "20")
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M5 35 L35 20 L5 5")
			.attr("stroke","black");
	}

	// ******************************************************
	// container
	// ******************************************************
	var container = scene.select("#container");

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

	function zoomed() {
		container.attr("transform", d3.event.transform);
	}

	// ******************************************************
	// perspective buttons
	// ******************************************************
	//TODO: dev mode cheat
	// Add controls to perspective
	var div_perspective = d3.select("#perspective-footer");
	var btnResetZoom = div_perspective.select("#btnReset-zoom");
	if (btnResetZoom.empty()) {
			//reset zoom
			btnResetZoom = div_perspective.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btnReset-zoom").text("zoom");
			btnResetZoom.on("click", function(){
				scene.transition()
				.duration(750)
				.call(zoom.transform, d3.zoomIdentity);
				})
	}
	var btnResetPosHistory = div_perspective.select("#btnReset-posHistory");
	if (btnResetPosHistory.empty()) {
			//reset zoom
			btnResetPosHistory = div_perspective.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btnReset-posHistory").text("reset");
			btnResetPosHistory.on("click", function(){
				verticesPositionning.stop();
				localStorage.removeItem("vertexLastPosition_json");
				//d3.selectAll(".container").remove();
				unpinVertices();
				//scene.call(zoom.transform, d3.zoomIdentity);
				verticesPositionning.restart();
				//mainRender(data);
        return;
			})
	}
	var btnstopAnimation = div_perspective.select("#btn-stop-animation");
	if (btnstopAnimation.empty()) {
		btnstopAnimation = div_perspective.append("button").attr("type","button").attr("class","btn btn-dark").attr("id","btn-stop-animation").attr("value","stop").text("freeze");
		btnstopAnimation.on("click", function(){
			verticesPositionning.stop();
		})
	}
	/*var btnEdgesColored = div_perspective.select("#btn-edgesColored");
	if (btnEdgesColored.empty()) {
		btnEdgesColored = div_perspective.append("button").attr("type","button").attr("class","btn btn-info").attr("id","btn-edgesColored").attr("value","uncolored").text("Color Edges");
		btnEdgesColored.on("click", function(){
			if (btnEdgesColored.attr("value") == "uncolored") {
				edgesColored=true;
				mainRender(data);
				btnEdgesColored.attr("value","colored").text("Uncolored Edges");
			} else {
				edgesColored=false;
				mainRender(data);
				btnEdgesColored.attr("value","uncolored").text("Color Edges");
			}
		})
	}*/
	// ******************************************************
	//	Dynamic colors and markers
	// ******************************************************
	// add a style id="sandbox-styles" section to the header
	var style = d3.select("#sandbox-styles");

	if (style.empty()){
		d3.select("#head").append("style").attr("id", "sandbox-styles");
	}

	// define coloring scheme
	var coloring_arcs = d3.scaleOrdinal(d3.schemeBlues[9]);
	var coloring_tags = d3.scaleOrdinal(d3.schemeCategory20);

	/*------------------------------------------------------------------
	 * Map of tags color and add selection on hover
	 */
	 var tagsColor=[];
	 var tags = d3.select("#perspective").selectAll("span.badge");

		tags.on("mouseover", function(d){
			d3.selectAll(".edges").classed("selected", false);
			var currentTag =  this.dataset.tagname.replace(":","_");
			d3.selectAll(".edges").filter(function(e){return e.tagnet == currentTag;}).classed("selected", true);}
		);
		tags.on("mouseout", function(d){
			d3.selectAll(".edges").classed("selected", false);}
		);

		if (edgesColored) {
			tags.each(function(d,i) {
 	 			tagsColor.push({tag:this.dataset.tagname.replace(":","_"), color:coloring_tags(i)})
 	 			d3.select(this).select("span.tag-legend").classed(this.dataset.tagname.replace(":","_"), true);
 	 			}
 	 		);
 	 		tagsColor.push({tag:"nocolor", color:"black"})

			//create styles for coloring
			addStyles(tagsColor);

			//add defs with colors
			var newStyledMarkerEnd = defs.selectAll("marker.end")
			.data(tagsColor, function(d) {return d.tag;});

			newStyledMarkerEnd.exit().remove();

			newStyledMarkerEnd
			.enter()
			.append("marker")
			.attr("id", function(d){return "marker-end-" + d.tag;})
			.attr("class", function(d){return "end " + d.tag;})
			.attr("markerWidth", "10")
			.attr("markerHeight", "10")
			.attr("refX", "1")
			.attr("refY", "5")
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M 0 5 L 10 5")
			.attr("class", function(d){return d.tag;});

			var newStyledMarkerStart = defs.selectAll("marker.start")
			.data(tagsColor, function(d) {return d.tag;});

			newStyledMarkerStart.exit().remove();

			newStyledMarkerStart
			.enter()
			.append("marker")
			.attr("id", function(d){return "marker-start-" + d.tag;})
			.attr("class", function(d){return "start " + d.tag;})
			.attr("markerWidth", "10")
			.attr("markerHeight", "10")
			.attr("refX", "9")
			.attr("refY", "5")
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M 0 5 L 10 5")
			.attr("class", function(d){return d.tag;})
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

		// Entering a svg group for each vertex (for creating a logical group and a group drag behaviour)
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
		.attr("pointNumber", function(d) {return d.pc;});

		// Selecting all displayed vertex groups
		var vertexGroup = container.selectAll(".gvertex");

		vertexGroup.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

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
		d3.select(this).attr("data-storedRotation", "rotate(" + (curRt + d3.event.wheelDelta) + ")"); // store on vertex for simulation forces ticks
		redrawEdgesforOneVertex(this.id);
	});

	// entering a dummy circle for rotation event handling
	vertexGroupRotate.selectAll(".vertexCircleRotate")
	.data(function(d){return [d];})
	.enter()
	.append("circle")
	.attr("class", "vertexCircleRotate")
	.attr("r",function(d){return d.radius;});

	// Entering arcs within vertex's group grotate
	var arcs = d3.arc()
	    .outerRadius(function(d){return d.radius;})
	    .innerRadius(function(d){return d.radius * ARC_INNER_RADIUS;} );

	vertexGroupRotate
	.selectAll(".arc")
	.data(function(d){return d.segments;}, function(d) {return "arc_" + d.point;}) //pie calculation already in data (segment reconstruction), standard d3 pie() not used
	.enter()
	.append("path")
	.attr("class", "arc notdisplayed") //arcs are hidden by default
	.attr("id", function(d) {return "arc_" + d.point;})
	.attr("d", arcs)
	.style("fill",function(d) {return coloring_arcs(d.point);});

	// Entering points within vertex's group rotate (last added to be on top)
	vertexGroupRotate
	.selectAll(".point")
	.data(function(d){return d.segments;}, function(d) {return d.point;})
	.enter()
	.append("circle")
	.attr("class", "point")
	.attr("id", function(d) {return d.point;})
	.attr("r", POINT_RADIUS)
	.attr("cx", function(d,i) {return d.ptX;})
	.attr("cy", function(d,i) {return d.ptY;});

	// Create a map of points across the vertices
	var points=[];
	vertexGroupRotate.each(function(d,i){
		d.segments.forEach(function(d,i){points.push(Object.assign({}, d));})
	});
	var pointsById = d3.map(points, function(d) { return d.point; });

	/*------------------------------------------------------------------
	 * Drawing hyperbolic edges within the vertices
	 */
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
	.on("mouseover", function(d){d3.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname==d.tagnet}).classed("selected", true);})
	.on("mouseout", function(d){d3.select("#perspective").selectAll("span.badge").filter(function(e){return this.dataset.tagname==d.tagnet}).classed("selected", false);})
	;

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
	// Rendering edges
	// ******************************************************
	/*
	 * Edges map
	 */
	 // Creating a list of all planar and spheric edges
	 // for drawing links & force simulation
	 // in d3 source/target format

	 var edges=[];

	 pointsById.each(function(d){
		var id="", s, t;
		if (d.topology == "spheric") { //spheric edge case
			s = Object.assign({}, d);
 			t = Object.assign({}, d); // new fictionnal point alone in deep universe
 				t.point = d.peer;
 				t.peer = d.point;
 				t.virtual = true;
				t.tagnet = d.tagnet;
				t.tagraw = d.tagraw;
 			id = d.topology + "_" + d.hc + "_" + d.point;
		}
		if (d.point.startsWith("T") && (d.topology == "planar")) { // planar edge
			s = Object.assign({}, d);
			t = Object.assign({}, pointsById.get(d.peer));
			id = d.topology + "_" + d.hc + "_" + t.hc + "_" + d.point;
		}
		if (id) {edges.push({topology:d.topology, id:id, source:s, target:t, point:d.point, peer:d.peer, tagnet:d.tagnet, tagraw:d.tagraw});}
 	});

	/*
	 * #D3_PATTERN# Adding edges
	 */

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
		.attr("stroke-dasharray", function(d) {if (d.topology=="spheric") {return "0.9";}})
		.append("title")
		.text(function(d){return d.source.info.xsl_element;});

		var edge =  container.selectAll(".edge");

	/*
	 * #D3_PATTERN# Adding edge labels
	 */

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
			return d.source.info.xsl_element;
			});

	 	var edgeLbl =  container.selectAll(".edgeLbl");

		/* Reselect the Edited point if any*/

		if (edgesColored) {
			d3.selectAll(".edges")
			.attr("class", function(d) {return this.classList.toString() + " " + d.tagnet;})
			.attr("marker-end",function(d){return "url(#marker-end-" + d.tagnet + ")";})
			.attr("marker-start",function(d){return "url(#marker-start-" + d.tagnet + ")";});
			d3.selectAll(".edgeLbl")
			.attr("class", function(d) {return this.classList.toString() + " " + d.tagnet;});
		}

		if (document.getElementById(TEXT_EDITZONE_ID).value) {
			simulateClick(document.getElementById(document.getElementById(TEXT_TOOLBOX_ID + "-point").value)); //once to select verrtex
			simulateClick(document.getElementById(document.getElementById(TEXT_TOOLBOX_ID + "-point").value)); //once to select point
		}

	/* -----------------------------------------------------------------

			FORCES AND TICKS

    ------------------------------------------------------------------*/
	// Edge forces
	verticesPositionning = qa_vertices_forces(edges, vertices);
	verticesPositionning.on("tick", ticked).on("end", endTick);
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
				.attr("transform", function(d) {
					if (d.spin) {
						return "rotate(" + (d.spin) + ")";
					} else if (this.dataset.storedRotation) {
						return this.dataset.storedRotation;
					} else {
						return "rotate(0)";
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
																																	"lbl_"+d.id,
																																	d.topology)});


				//console.log("ticks done : ", Math.ceil(Math.log(this.alpha()) / Math.log(1 - this.alphaDecay())));
				//console.log("Total ticks number : ", Math.ceil(Math.log(this.alphaMin()) / Math.log(1 - this.alphaDecay())));

				if (Math.ceil(Math.log(this.alpha()) / Math.log(1 - this.alphaDecay()))%50 == 0) { //save positionning every 50 ticks
					storeLocalVertexPositionning(verticesbyHc); //store last vertex position and rotation
				}
			}
			catch(error) {
			//console.log("shadow tick !");
}
			semaphore = true;
} else {
		console.log('multi-tick!');		}
	}

	function endTick() {
		//toggle force btn off
		//d3.select("#btn-stop-animation").attr("value","start").text("Ended. Restart animation");
		storeLocalVertexPositionning(verticesbyHc); //store last vertex position and rotation
	}
}

/** End of main render function ***************************************
***********************************************************************/


/**
 * To redraw edges when a single Vertex is rotated
 * @param _vertexhc {string}  hash code (id) of a vertex
 * @returns {nothing} - Redraw the edges
 */
function redrawEdgesforOneVertex(_vertexhc) {
	var trueVertexhc=Number(_vertexhc.replace("grotate_",""));

	d3.selectAll("path.planar")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("d", function(d){return drawPlanar(d.source.point, d.target.point).path;});

	d3.selectAll("path.spheric")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("d", function(d){return drawSpheric(d.source.point, "gvertex_" + d.target.hc).path;})

	d3.selectAll("text.edgeLbl")
	.filter(function(d){return (d.source.hc==trueVertexhc || d.target.hc==trueVertexhc);})
	.attr("x", function(d) {return getAbsCoord(d.source.point).x;})
	.attr("y", function(d) {return getAbsCoord(d.source.point).y;})
	.attr("transform", function(d) {return EdgeLblOrientation(getAbsCoord(d.source.point).x, getAbsCoord(d.source.point).y, getAbsCoord(d.target.point).x, getAbsCoord(d.target.point).y, "lbl_" + d.id, d.topology)});

	//store last vertex position and rotation
	var currentVertex = [];
	currentVertex.push(verticesbyHc.get(trueVertexhc));
	var currentVertexbyId = d3.map(currentVertex, function(d){return d.hc});
	storeLocalVertexPositionning(currentVertexbyId);
}

/**
 * Utility to find absolute x,y coordinates of a dom element in zoomed contexts
 * @param elt {string}  elt - element dom id string
 * @returns {object} svg point - point coordinates {x,y}
 */
function getAbsCoord(elt) {
	if (svgScene.getElementById(elt)) { // to filter phantom s : TODO: improve by suppressing these fantom Edges
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
			y: ptt.y,
			pxy: ptt.x + " " + ptt.y
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
			if (sr[i].segments[k].point == sr[i].segments[k].peer) {sr[i].segments[k].topology="spheric";}
			// PGT: attention ! Ceci est la caractérisation des topologies "text".
			// Cela fonctionne pour le moment car nous n'avons pas de "text".
			// if (sr[i].segments[k].info.bhb_spheric) {sr[i].segments[k].topology="spheric";} // fallback for spheric TODO:fix
			if (sr[i].segments[k].info.xsl_element == "spheric") {sr[i].segments[k].topology="spheric";}
			if (sr[i].segments[k].hc != pointsById.get(sr[i].segments[k].peer).hc) {sr[i].segments[k].topology="planar";}
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

/**
 * Select a vertex, and change the layout.
 * If the vertex is already selected, unpin and unselect the vertex
 *
 * @param {vertex} - dom element object - must be a root group of a vertex
 * @returns nothing (select the vertex)
 */
function selectVertex(vertex){
	unselectVertices(); // 1. unselect all
	// 2. select current vertex or unpin and unselect
	var vtx = d3.select(vertex);
	var arc = vtx.selectAll(".arc");
	var edges = d3.selectAll(".edge").filter(function(d){return (d.source.hc == vtx.datum().hc || d.target.hc == vtx.datum().hc);}); // raise the proper external edges
	var point = vtx.selectAll(".point");
	vtx.raise();
	edges.raise();
	point.raise();
	if (!vtx.classed("focused")){
		vtx.classed("focused", true);
		arc.classed("notdisplayed", false).classed("draggable", true);
		point.classed("point-displayed", true);
	} else {
		vtx.classed("focused", false);
		arc.classed("notdisplayed", true);
		point.classed("point-displayed", false);
		vtx.fx=null;
		vtx.fy=null;
		vtx.classed("pinned", false);
	}
	arc.call(d3.drag() //add edit arc listener
				.filter(function(d){return !this.classList.contains("notdisplayed");}) //not fired if arc is not displayed (removing the handler is buggy)
				.on("start", arcDragStarted)
				.on("drag", arcDragged)
				.on("end", arcDragEnded));

	point.on("click", function(d) {
		d3.event.stopPropagation();
		console.log("click on point ",d.point, ": ", d);
		// populates hidden inputs for dummy navbar
		document.getElementById(TEXT_TOOLBOX_ID + "-point").value = d.point;
		document.getElementById(TEXT_TOOLBOX_ID + "-next").value = d.next;
		document.getElementById(TEXT_TOOLBOX_ID + "-peer").value = d.peer;
		document.getElementById(TEXT_TOOLBOX_ID + "-before").value = d3.selectAll(".point").filter(function(s){return s.next == d.point;}).datum().point;
		text_nav(d);
		// reinit prevously selected point
		d3.selectAll(".viewed").classed("viewed",false);
		if (!edgesColored) {
			d3.selectAll("path.start").attr("marker-start", "url(#marker-start)").classed("start",false);
			d3.selectAll("path.end").attr("marker-end", "url(#marker-end)").classed("end",false);
		} else {
			d3.selectAll("path.start").attr("marker-start", function(d){return "url(#marker-start-" + d.tagnet + ")";}).classed("start",false);
			d3.selectAll("path.end").attr("marker-end", function(d){return "url(#marker-end-" + d.tagnet + ")";}).classed("end",false);
		}
		// open text toolbox and poupulates edit zone
		if (!d3.select("#" + TEXT_TOOLBOX_ID).classed("opened")) {
			d3.select("#" + TEXT_TOOLBOX_ID).classed("opened", true).classed("closed", false);
		}
		document.getElementById(TEXT_EDITZONE_ID).value = text_readInfo(d);
		var selectedEdge = d3.selectAll("path.edges").filter(function(l){return (l.point == d.point || l.peer == d.point);});
		// select Point, Edge and style them it with the wiev marker
		d3.select(this).classed("viewed",true);
		selectedEdge.classed("viewed",true);
		if (selectedEdge.datum().point == d.point) {
			selectedEdge.classed("start", true);
			if (selectedEdge.datum().toplogy == "hyperbolic") {
				selectedEdge.attr("marker-start",function(d){return "url(#marker-end-entry)";})
			} else {
				selectedEdge.attr("marker-start",function(d){return "url(#marker-start-entry)";})
			}
		} else {
			selectedEdge.classed("end", true);
			if (selectedEdge.datum().toplogy == "hyperbolic") {
				selectedEdge.attr("marker-end",function(d){return "url(#marker-start-entry)";})
			} else {
				selectedEdge.attr("marker-end",function(d){return "url(#marker-end-entry)";})
			}
		}
	});
}

/**
 * print out info on point
 * @param {_datum} - d3 datum object - point
 * @returns a xml node string with the info
 */
function text_readInfo(_datum){
	var info=_datum.info;
	var t = Object.entries(info);
	var tagidx = t.findIndex(function(s){return s[0].endsWith("_element");});
	if (tagidx > -1) {var tag = t.splice(tagidx, 1);}
	var output = "";
	if (tag) {output += "<" + tag[0][0].split("_" , 1) + ":" + tag[0][1];} // TODO: fix: "_" is not a good joker !
	for(var i=0, n=t.length; i<n; i++){
		output += " " + t[i][0].replace(/_/, ":") + "=" + '"' + t[i][1] + '"';
	}
	if (tag) {output += "/>";}
	return output;
}

/**
 * print out info on point
 * @param {_datum} - d3 datum object - point
 * @returns a navbar (does it once for all, if the navbar is drawn, it won't be again)
 */
function text_nav(_datum){
	//nav buttons
	var navTool = d3.select("#" + TEXT_TOOLBOX_ID + "-pointnavtool");
	var btnNextPt = navTool.select("#" + TEXT_TOOLBOX_ID + "-btnNextPt");
	if (!btnNextPt.empty()) {return;} // Exits if already drawned
	// creates nav buttons
	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-primary")
	.attr("id",TEXT_TOOLBOX_ID + "-btnBeforePt")
	.text(String.fromCharCode(8634)) //8592
	.attr("title", "Before")
	.attr("accessKey", "f")
	.attr("onClick", 'simulateClick(document.getElementById(document.getElementById("' + TEXT_TOOLBOX_ID + '-before").value));');

	navTool.append("button") //twoclicks, one to select a new vertex, one to select the point
	.attr("type","button")
	.attr("class","btn btn-primary")
	.attr("id",TEXT_TOOLBOX_ID + "-btnPeerPt")
	.text(String.fromCharCode(8645)) //8645 8597
	.attr("title", "Peer")
	.attr("accessKey", "38")
	.attr("onClick", 'simulateClick(document.getElementById(document.getElementById("' + TEXT_TOOLBOX_ID + '-peer").value)); simulateClick(document.getElementById(document.getElementById("' + TEXT_TOOLBOX_ID + '-peer").value));');

	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-primary")
	.attr("id",TEXT_TOOLBOX_ID + "-btnNextPt")
	.text(String.fromCharCode(8635)) // 8594
	.attr("title", "Next")
	.attr("accessKey", "39")
	.attr("onClick", 'simulateClick(document.getElementById(document.getElementById("' + TEXT_TOOLBOX_ID + '-next").value));');

	navTool.append("button")
	.attr("type","button")
	.attr("class","btn btn-secondary")
	.attr("id",TEXT_TOOLBOX_ID + "-unselect")
	.text(String.fromCharCode(215))
	.attr("title", "unselect")
	.on("click", function(d) {
		d3.select("#" + TEXT_TOOLBOX_ID).classed("opened", false).classed("closed", true);
		document.getElementById(TEXT_EDITZONE_ID).value = null;
		d3.selectAll(".viewed").classed("viewed",false);
		if (!edgesColored) {
			d3.selectAll("path.start").attr("marker-start", "url(#marker-start)").classed("start",false);
			d3.selectAll("path.end").attr("marker-end", "url(#marker-end)").classed("end",false);
		} else {
			d3.selectAll("path.start").attr("marker-start", function(d){return "url(#marker-start-" + d.tagnet + ")";}).classed("start",false);
			d3.selectAll("path.end").attr("marker-end", function(d){return "url(#marker-end-" + d.tagnet + ")";}).classed("end",false);
		}
	});
}

/**
 * unselect vertices
 *
 * @returns nothing (unselect all vertices)
 */
function unselectVertices(){
	d3.selectAll(".focused").classed("focused", false);
	d3.selectAll(".arc").classed("notdisplayed", true).classed("draggable", false);
	d3.selectAll(".point-displayed").classed("point-displayed", false).on("click", "");
	d3.selectAll(".gvertex").lower();
	d3.selectAll(".egde").raise(); // raise edges above vortices
	d3.selectAll(".edgeLbl").raise();
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
 * @param str {string} str - js string value
 * @returns {integer} hascode - 32bit integer
 */
function hashCode(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (var i=0; i < str.length; i++) {
        var char = str.charCodeAt(i);
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
	hash = (typeof hash !== 'undefined') ? hash : true;

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
 * function for computing the hyperbolics arcs
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
		if (rm < 0.001) {
			path =  "M" + s.ptX + "," + s.ptY
			+ "L" + t.ptX + "," + t.ptY;
			return {path:path};}
		var tm = Math.atan2(ym, xm)
	 	rm = radius * radius / rm
		var xr = s.ptX - Math.cos(tm) * rm
		var yr = s.ptY - Math.sin(tm) * rm
		var rf = Math.sqrt(xr*xr + yr*yr)
		if (Math.sin(t.startAngle - s.startAngle) < 0) {
			path =  "M" + t.ptX + "," + t.ptY
			+ "A " + rf + " " + rf + " 0 0 0"
			+ " " + s.ptX + "," + s.ptY;
		} else {
			path =  "M" + s.ptX + "," + s.ptY
			+ "A " + rf + " " + rf + " 0 0 0"
			+ " " + t.ptX + "," + t.ptY;
		}
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
 * Store localy the position of the vertices (both tanslation & rotation) in the global variable vertexLastPosition
 *
 * @param _verticesbyHc {d3map} - map of drawn vertices to register their transformations
 * @returns {-} - Stores positionning as a json string in nav's localStorage
 */
function storeLocalVertexPositionning(_verticesbyHc){
	var tf_vtx, tf_vtxRt;
	var vtxLastPosbyPt = d3.map(vertexLastPosition, function(d) {return d.oPt});
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
				vertexLastPosition.push({hc:d.hc, oPt:d.oldestPoint, oX: d.x, oY: d.y, oTf:tf_vtx, oRt:tf_vtxRt});
		} else {
			vtxLastPosbyPt.get(d.oldestPoint).oX=d.x;
			vtxLastPosbyPt.get(d.oldestPoint).oY=d.y;
			vtxLastPosbyPt.get(d.oldestPoint).oTf=tf_vtx;
			vtxLastPosbyPt.get(d.oldestPoint).oRt=tf_vtxRt;

		}
		var vertexLastPosition_json = JSON.stringify(vertexLastPosition);
		localStorage.setItem("vertexLastPosition_json", vertexLastPosition_json);
	})
}

/**
 * Add css classes in local document for coloring by tag
 * The html header node "style" must be set before
 *
 * @param _tagsColor {array} - array {tag: color:}
 * @returns {-} - add new classes on top
 */
function addStyles(_tagsColor) {
	var styleSheet = document.querySelector('#sandbox-styles').sheet;
	var rules = d3.entries(styleSheet.cssRules);
	_tagsColor.forEach(function (elt) {
				var ruleExists = rules.find(function(e){return e.value.selectorText == "." + elt.tag.replace(/:/,"_")});
				if (ruleExists) {styleSheet.deleteRule(Number(ruleExists.key));}
				var colorStyle = '.' + elt.tag.replace(/:/,"_") + ' { stroke: ' + elt.color + '; color: ' +  elt.color + '; }';
				styleSheet.insertRule(colorStyle, 0); // index 0 to add on the top
	});
}


	// ******************************************************					_______________________________
	// Applying Forces to elements
	//			1. forceCenter: center vertices                                   F O R C E S
	//			2. forceCollide: colliding vertices												_______________________________
	//			3. forceManyBody: Electrostatic force
	//			4. qa_linkPoints: edge-directed force and rotation
	// ******************************************************

function qa_vertices_forces(edges, vertices) {
	var xc= scene.property("clientWidth") / 2;
	var yc= scene.property("clientHeight") / 2;
	var forces = d3.forceSimulation()
	//.alpha(def_alpha)
		.nodes(vertices)
		.force("center", d3.forceCenter(xc,yc)) // force toward the center
		.force("charge", d3.forceManyBody().strength(function(d){return (d.pc_planars) * -10;}))  // Nodes attracting or reppelling each others (negative = repelling)
		.force("collide", d3.forceCollide().radius(function(d){return d.radius + 10;})) // collision detection
		.force("link", qa_linkPoints().links(edges).distance(function(d){return (d.source.radius + d.target.radius) * 2;}).id(function(d) {return d.id;})) // customized force
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
			d_tgt = d3.select("#gvertex_"+target.hc).datum();
			d_src = d3.select("#gvertex_"+source.hc).datum();
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
		x   -=  distances[i] * Math.cos(src_rot);
		y   -=  distances[i] * Math.sin(src_rot);
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

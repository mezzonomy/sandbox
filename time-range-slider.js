/**
 * @file render.js
 * @copyright (c) 2014-2018, sarl mezzònomy
 * @author mezzònomy
 */

// Time formaters & parsers
var formatDate = d3.timeFormat("%a %_d %b %Y");
var formatDateP1 = d3.timeFormat("%a %_d");
var formatDateP2 = d3.timeFormat("%b %y");
var formatDateP3 = d3.timeFormat("%H:%M");
var formatDateP = d3.timeFormat("%a %_d %b %y %H:%M:%S")
var formatDateMonth = d3.timeFormat("%b %Y");
var formatDateBhb = d3.timeFormat("%Y%m%d:%H%M%S");
var parseDateBhb = d3.timeParse("%Y%m%d:%H%M%S");

// Construct time array
var historyDates=[];
d3.selectAll(".explorer-history-date").each(function() {historyDates.push({date:parseDateBhb(this.innerText)});});

// Render the slider
// 1. domain
var minDate = new Date(historyDates[0].date);
var maxDate = Date.now();
// 2. sliders
var startDate = minDate;
var endDate = new Date(historyDates[historyDates.length -1].date);
// 3. render the slider
timeRangeSlider(startDate, endDate, minDate, maxDate, updateDates, "explorer-time-slider");

/**
 * Function to update the explorer toolbox from a time range slider
 * @param _d1 {string}  from date format
 * @param _d2 {string}  to date format
 * @param _dmin {string}  Minimum range value to date format
 * @param _dmax {string}  Maximum range value to date format
 * @param _action
 * @param _divId
 * @returns {nothing} draw a slider
 */
function updateDates(_from, _to){
   var from= new Date(_from);
   var to=new Date(_to);
   document.getElementById("explorer-from-date-ISO8601").value=from.toISOString();
   document.getElementById("explorer-to-date-ISO8601").value=to.toISOString();
   document.getElementById("explorer-from-date-bhb").value=formatDateBhb(from);
   document.getElementById("explorer-to-date-bhb").value=formatDateBhb(to);
   //document.getElementById("explorer-from-date-bhb").onchange() // TODO : does not fire
   //eval(document.getElementById("explorer-from-date-bhb").attributes.onchange.value);
   //TODO : refresh data
   simulateOnchange(document.getElementById("explorer-from-date-bhb"));
}

 /**
  * Function to setup a dual range slider
  * @param _d1 {string}  from date format
  * @param _d2 {string}  to date format
  * @param _dmin {string}  Minimum range value to date format
  * @param _dmax {string}  Maximum range value to date format
  * @param _action
  * @param _divId
  * @returns {nothing} draw a slider
  */
function timeRangeSlider(_d1, _d2, _dmin, _dmax, _action, _divId){
  var sliderVals=[_d1, _d2];
  var width = 140; // TODO:fix width = document.getElementById(_divId).clientWidth,

  var x = d3.scaleTime()
  .domain([_dmin, _dmax])
  .range([0, width])
  .clamp(true);

  var xMin=x(_dmin);
  var xMax=x(_dmax);

  // Add svg & main slider group
  svg = d3.select("#" + _divId).append("svg")
  .attr('width', width + 30)
  .attr('height', 80);

  var slider = svg.append("g", ".track-overlay")
  .attr("class", "slider")
  .attr("transform", "translate(30,70)");

  // Add slider line
  slider.append("line")
  .attr("class", "track")
  .attr("x1", x.range()[0])
  .attr("x2", x.range()[1]);

  /*slider.insert("g", ".track-overlay")
  .attr("class", "ticks")
  .attr("transform", "translate(10,24)")
  .selectAll("text")
  .data(x.ticks(3))
    .enter().append("text")
    .attr("x", x)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("class", "ticks")
    .text(function(d) { return formatDateMonth(d); });*/

  var ghandle = slider.selectAll("g.handle")
  .data([0, 1])
  .enter().append("g")
  .attr("class", "handle")
  .attr("transform", function(d) {return "translate(" + x(sliderVals[d])+ ",0)"})
  .call(d3.drag()
    .on("start", startDragHandle)
    .on("drag", dragHandle)
    .on("end", endDragHandle)
  );

  ghandle.append("circle")
  .attr("class", "track-overlay handle")
  .attr("cy", 0)
  .attr("cx", 0)
  .attr("r", 5);

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
  .text(function(d) {return formatDateP1(sliderVals[d]);});

  ghandle.append("text")
  .attr("text-anchor", "middle")
  .attr("class", "handle-label part2")
  .attr("y", -30)
  .attr("x", 0)
  .text(function(d) {return formatDateP2(sliderVals[d]);});

  ghandle.append("text")
  .attr("text-anchor", "middle")
  .attr("class", "handle-label part3")
  .attr("y", -18)
  .attr("x", 0)
  .text(function(d) {return formatDateP3(sliderVals[d]);});

  ghandle.append("polygon")
  .attr("class", "handle-label")
  .attr("points", function(d) {return (x(sliderVals[d])) + ",-5 " + (x(sliderVals[d]) -5) + ",-10 " + (x(sliderVals[d]) +5) + ",-10";});

  var selRange = slider.append("line")
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
  var gevts = slider
  .append("g")
  .attr("class", "evts")
  .attr("transform", "translate(0,-65)");

  gevts.selectAll(".evts")
  .data(historyDates, function(d){return d.date})
  .enter()
  .append("circle")
  .attr("class", "evts")
  .attr("r", 2)
  .attr("cx", function(d){return x(d.date);})
  .append("title").text(function(d){return formatDateP(d.date);});

  slider.selectAll(".evts").on("click", function(d){
    var ptx = +d3.select(this).attr("cx");
    var date = d3.select(this).datum().date;
    slider.selectAll("g.handle").attr("transform", "translate(" + ptx +",0)");
    slider.select("line.sel-range").attr("x1", ptx).attr("x2", ptx);
    sliderVals = [date, date];
    _action(date,date);
  });

  function startDragHandle(d){
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).raise().classed("active", true);
  }

  function dragHandle(d){
    var ptx = d3.event.x;
    if (ptx > xMax) {ptx = xMax} else if (ptx < xMin) {ptx = xMin}
    sliderVals[d] = ptx;
    var selHandle = d3.select(this);
    selHandle.attr("transform", function(d) {return "translate("+ ptx +",0)"; });
    selHandle.selectAll("text.handle-label").filter(function(d){return this.classList.contains("part1")}).text(function(d) {return formatDateP1(x.invert(ptx));});
    selHandle.selectAll("text.handle-label").filter(function(d){return this.classList.contains("part2")}).text(function(d) {return formatDateP2(x.invert(ptx));});
    selHandle.selectAll("text.handle-label").filter(function(d){return this.classList.contains("part3")}).text(function(d) {return formatDateP3(x.invert(ptx));});
    var ptx2=x(sliderVals[d==0?1:0]);
    selRange.attr("x1", ptx).attr("x2", ptx2)
  }

  function endDragHandle(d){
    var v=Math.round(x.invert(d3.event.x));
    var elt=d3.select(this);
    sliderVals[d] = v;
    var v1=Math.min(sliderVals[0], sliderVals[1]);
    var v2=Math.max(sliderVals[0], sliderVals[1]);
    elt.classed("active", false).attr("x", x(v));
    selRange.attr("x1", x(v1)).attr("x2", x(v2))
    _action(v1,v2);
  }

  function startDragRange(){
  d3.select(this).classed("active", true);
  }

  function dragRange(){
  var dx = +d3.event.dx;
  var ox1 = +d3.select(this).attr("x1");
  var ox2 = +d3.select(this).attr("x2");
  var dx1 = ox1 + dx;
  var dx2 = ox2 + dx;
  if(dx1 > xMax){dx1 = xMax} else if (dx1 < xMin){dx1 = xMin}
  if(dx2 > xMax){dx2 = xMax} else if (dx2 < xMin){dx2 = xMin}
  d3.select(this).attr("x1", dx1);
  d3.select(this).attr("x2", dx2);
  ghandle.attr("transform", function(d,i){return "translate(" + (i==0?dx1:dx2) + ",0)";});
  }

  function endDragRange(d){
  var ox1 = +d3.select(this).attr("x1");
  var ox2 = +d3.select(this).attr("x2");
  var vx1 = Math.round(x.invert(ox1));
  var vx2 = Math.round(x.invert(ox2));
  var elt=d3.select(this);
  var v1=Math.min(vx1, vx2);
  var v2=Math.max(vx1, vx2);
  elt.classed("active", false);
  _action(v1,v2);
  }
}

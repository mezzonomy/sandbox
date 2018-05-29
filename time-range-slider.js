/**
 * @file render.js
 * @copyright (c) 2014-2018, sarl mezzònomy
 * @author mezzònomy
 */

// Time formaters & parsers


const BHB_DATE_ENCODING = "%Y-%m-%dT%H:%M:%SZ"
var FORMAT_DATE, FORMAT_DATE_P1, FORMAT_DATE_P2, FORMAT_DATE_P3, FORMAT_DATE_TIME,FORMAT_DATE_BHB, PARSE_DATE_BHB;


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
  var historyDates=[];
  d3.selectAll(".explorer-history-date").each(function() {historyDates.push({date:PARSE_DATE_BHB(this.innerText)});});
  if (historyDates.length > 0) { // Case no evts
    // Render the slider
    // 1. domain
    var minDate = new Date(historyDates[0].date);
    var maxDate = Date.now();
    // 2. sliders
    if (!document.getElementById("explorer-bhb-from").dataset.bhbdate) {
      var startDate = minDate;
      var endDate = new Date(historyDates[historyDates.length -1].date);
    } else {
      var startDate = PARSE_DATE_BHB(document.getElementById("explorer-bhb-from").dataset.bhbdate);
      var endDate = PARSE_DATE_BHB(document.getElementById("explorer-bhb-to").dataset.bhbdate);
    }
    // 3. render the slider
    var divId = "explorer-time-slider";
    var width = document.getElementById(divId).parentNode.parentNode.clientWidth - 10;
    timeRangeSlider(historyDates, startDate, endDate, minDate, maxDate, updateDates, divId, width);
  }
}
/**
 * Function to update the explorer toolbox from a time range slider
 * @param _from {string}  from date format
 * @param _to {string}  to date format
 * @returns {nothing} updates bhb
 */
function updateDates(_from, _to){
   var from= new Date(_from);
   var to=new Date(_to);
   document.getElementById("explorer-bhb-from").value=FORMAT_DATE_BHB(from);
   document.getElementById("explorer-bhb-to").value=FORMAT_DATE_BHB(to);
   var fromQuery = document.getElementById("explorer-bhb-from").dataset.bhbquery.replace("$$DATE",FORMAT_DATE_BHB(from));
   var toQuery = document.getElementById("explorer-bhb-to").dataset.bhbquery.replace("$$DATE",FORMAT_DATE_BHB(to));
   console.log(fromQuery);
   console.log(toQuery);
   eval(fromQuery);
   eval(toQuery);
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
  var sliderVals=[_d1, _d2];
  var width = _width - 60;

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

  var ghandle = slider.selectAll("g.ghandle")
  .data([0, 1])
  .enter().append("g")
  .attr("class", "ghandle")
  .attr("transform", function(d) {return "translate(" + x(sliderVals[d])+ ",0)"})
  .call(d3.drag()
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
  .data(_evts, function(d){return d.date})
  .enter()
  .append("circle")
  .attr("class", "evts")
  .attr("r", 2)
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

  function dragHandle(d){
    var ptx = d3.event.x;
    if (ptx > xMax) {ptx = xMax} else if (ptx < xMin) {ptx = xMin}
    sliderVals[d] = ptx;
    var selHandle = d3.select(this);
    selHandle.attr("transform", function(d) {return "translate("+ ptx +",0)"; });
    selHandle.selectAll("text.handle-label").filter(function(d){return this.classList.contains("part1")}).text(function(d) {return FORMAT_DATE_P1(x.invert(ptx));});
    selHandle.selectAll("text.handle-label").filter(function(d){return this.classList.contains("part2")}).text(function(d) {return FORMAT_DATE_P2(x.invert(ptx));});
    selHandle.selectAll("text.handle-label").filter(function(d){return this.classList.contains("part3")}).text(function(d) {return FORMAT_DATE_P3(x.invert(ptx));});
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
  d3.select(this).raise().classed("active", true);
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
  ghandle.attr("transform", function(d,i){return "translate(" + (i==0?ox1:ox2) + ",0)";});
  elt.classed("active", false);
  sliderVals = [v1, v2];
  _action(v1,v2);
  }
}

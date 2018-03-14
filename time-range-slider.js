/**
 * @file render.js
 * @copyright (c) 2014-2018, sarl mezzònomy
 * @author mezzònomy
 */

var formatDate = d3.timeFormat("%a %_d %b %Y");
var formatDateP1 = d3.timeFormat("%a %_d");
var formatDateP2 = d3.timeFormat("%b %Y");
var formatDateMonth = d3.timeFormat("%b %Y");

var minDate = new Date("2004-11-01"), maxDate = new Date("2018-03-14");
var startDate = new Date("2011-11-01"), endDate = new Date("2017-04-01");
var sliderdivId = "explorer-time-slider"
timeRangeSlider(startDate, endDate, minDate, maxDate, updateDates, sliderdivId);



function updateDates(_from, _to){
   document.getElementById("explorer-from-date").value=formatDate(_from);
   document.getElementById("explorer-to-date").value=formatDate(_to);
   var from= new Date(_from);
   var to=new Date(_to);
   document.getElementById("explorer-from-date-ISO8601").value=from.toISOString();
   document.getElementById("explorer-to-date-ISO8601").value=to.toISOString();
   //TODO : refresh data
   //var data = getData(min, max);
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

var sliderVals=[_d1, _d2],
    // TODO:fix width = document.getElementById(_divId).clientWidth,
    width = 160,
    svg = d3.select("#" + _divId).append("svg")
      .attr('width', width + 30)
      .attr('height', 100);

var x = d3.scaleTime()
    .domain([_dmin, _dmax])
    .range([0, width])
    .clamp(true);

var xMin=x(_dmin),
    xMax=x(_dmax)

var slider = svg.append("g", ".track-overlay")
    .attr("class", "slider")
    .attr("transform", "translate(5,70)");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])

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

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(10,24)")
  .selectAll("text")
  .data(x.ticks(4))
  .enter().append("text")
    .attr("x", x)
    .attr("text-anchor", "middle")
    .attr("class", "ticks")
    .text(function(d) { return formatDateMonth(d); });

    var handle = slider.selectAll("circle.handle")
      .data([0, 1])
      .enter().append("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("cy", 0)
        .attr("cx", function(d) { return x(sliderVals[d]); })
        .attr("r", 5)
        .call(
            d3.drag()
              .on("start", startDrag)
              .on("drag", drag)
              .on("end", endDrag)
        );


function startDrag(d){
  d3.select(this).raise().classed("active", true);
  var ptx = d3.event.x;
  slider.append("circle")
    .attr("class", "handle-label")
    .attr("cy", -38)
    .attr("cx", ptx)
    .attr("r", 30);
  slider.append("text")
    .attr("text-anchor", "middle")
    .attr("class", "handle-label part1")
    .attr("y", -35)
    .attr("x", ptx)
    .text(formatDateP1(x.invert(ptx)))
  slider.append("text")
    .attr("text-anchor", "middle")
    .attr("class", "handle-label part2")
    .attr("y", -25)
    .attr("x", ptx)
    .text(formatDateP2(x.invert(ptx)));
  slider.append("polygon")
				.attr("class", "handle-label")
				.attr("points", (ptx) + ",-5 " + (ptx-5) + ",-10 " + (ptx+5) + ",-10");

}

function drag(d){
  var ptx=d3.event.x;
  if (ptx > xMax) {ptx = xMax} else if (ptx < xMin) {ptx = xMin}
  d3.select(this).attr("cx", ptx);
  var ptx2=x(sliderVals[d==0?1:0]);
  slider.select("circle.handle-label").attr("cx", ptx);
  slider.select("polygon.handle-label").attr("points", (ptx) + ",-5 " + (ptx-5) + ",-10 " + (ptx+5) + ",-10");
  slider.selectAll("text.handle-label").attr("x", ptx).text(function(d,i){return i==0?formatDateP1(x.invert(ptx)):formatDateP2(x.invert(ptx));});
  selRange.attr("x1", ptx).attr("x2", ptx2)
}

function endDrag(d){
  var v=Math.round(x.invert(d3.event.x))
  var elt=d3.select(this)
  sliderVals[d] = v
  var v1=Math.min(sliderVals[0], sliderVals[1]),
      v2=Math.max(sliderVals[0], sliderVals[1]);
  elt.classed("active", false)
    .attr("x", x(v));
  slider.selectAll(".handle-label").remove();
  selRange
      .attr("x1", x(v1))
      .attr("x2", x(v2))
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
        handle.attr("cx", function(d,i){return i==0?dx1:dx2;});
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

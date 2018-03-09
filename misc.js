/**
 * @file misc.js
 * @copyright (c) 2014-2018, sarl mezzònomy
 * @author mezzònomy
 */

/**
 * Open/close the current toolbox by changing classes on the element
 * css classed .closed and .opened must be defined
 *
 * @param tlbx {dom elt} dom element typically "this"
 * @returns changes the classes on the element opened => closed or closed => opened
 * @example <div id="{$toolbox_ID}" class="toolbox lower-left opened" onclick="ui_tlbx_toggle(this);">
 */
function ui_tlbx_toggle(tlbx) {
  if (d3.select(tlbx).classed("opened")) {
      d3.select(tlbx).classed("opened", false).classed("closed", true);
  } else {
    d3.select(tlbx).classed("closed", false).classed("opened", true);
  }
}

/**
 * Simulate a click event.
 * @public
 * @param {Element} elem  the element to simulate a click on
 */
var simulateClick = function (elem) {
	// Create our event (with options)
	var evt = new MouseEvent('click', {
		bubbles: true,
		cancelable: true,
		view: window
	});
	// If cancelled, don't dispatch our event
	var canceled = !elem.dispatchEvent(evt);
};

/**
 * complete amendment for xml wellformedness
 * and send validation code
 *
 * @param txt {sring} string for a valid dom element id
 * @returns fire xml validation
 */
function validateAmendment(txt) {
  var text = document.getElementById(txt).value.trim();
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
 * Code for validating XML (inspired from https://www.w3schools.com/xml/xml_validator.asp)
 */
 var xt="", h3OK=1;
 var AMENDMENT_EDITINFO = document.getElementById("amendment-editinfo");
 var AMENDMENT_VALIDATE = document.getElementById("amendment-validbtn");

 function alertInit() {
   d3.select(AMENDMENT_EDITINFO).classed("alert-success", false).classed("alert-danger", false);
   d3.select(AMENDMENT_VALIDATE).attr("disabled", "disabled");
   d3.select(AMENDMENT_EDITINFO).text(null);
 }

 function alertSuccess(txt) {
   d3.select(AMENDMENT_EDITINFO).classed("alert-success", true).classed("alert-danger", false);
   d3.select(AMENDMENT_VALIDATE).attr("disabled", null);
   d3.select(AMENDMENT_EDITINFO).text(txt);
 }

 function alertFail(txt) {
   d3.select(AMENDMENT_EDITINFO).classed("alert-success", false).classed("alert-danger", true);
   d3.select(AMENDMENT_VALIDATE).attr("disabled", "disabled");
   d3.select(AMENDMENT_EDITINFO).text(txt);
 }

function validateXML(text)
{
if (document.implementation.createDocument){
  try {
    var parser=new DOMParser();
    var xmlDoc=parser.parseFromString(text,"application/xml");
  } catch(err) {
    alertFail(err.message);
  }

if (xmlDoc.getElementsByTagName("parsererror").length>0) {
    checkErrorXML(xmlDoc.getElementsByTagName("parsererror")[0]);
    alertFail(xt);
   } else {
    alertSuccess("Amendment valid");
   }
 } else {
   alertFail("Your browser cannot handle XML validation");
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

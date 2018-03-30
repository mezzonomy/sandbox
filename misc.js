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
    var loader ='<img src="sandbox/loader1.gif" alt="loading..." width="42" height="42" style="position: absolute; left: 50%; top: 50%;"/>';
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
 * Simulate a click event.
 * @public
 * @param {Element} elem  the element to simulate a click on
 */
var simulateOnchange = function (elem) {
	// Create our event (with options)
	var evt = new Event('change', {
		bubbles: true,
		cancelable: true,
		view: window
	});
	// If cancelled, don't dispatch our event
	var canceled = !elem.dispatchEvent(evt);
};

/**
 * Opens a modal window with a close button and title and content
 * @public
 * @param {string} _text  text content of the window
 * @param {string} _title  Title on window
 * @param {string} _style  The style on dialog div, to give dimensions ie : 'max-width: 90%; margin-top: 10px;'
 */
function openModal (_text, _title, _style){
var universe = document.getElementById('universe');
var modal =
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
function removeModal (){
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
 * Code for exporting data to csv (inspired from https://halistechnology.com/2015/05/28/use-javascript-to-export-your-data-as-csv/)
 */

function convertArrayOfObjectsToCSV(_data) {
  var result, ctr, keys, mainKeys=[], infoKeys=[], columnDelimiter, lineDelimiter, data, res;

  data = _data || null;
  if (data == null || !data.length) {return null;}

  columnDelimiter = ';';
  lineDelimiter = '\n';

  // construct column header
  data.forEach(function(item) {
      mainKeys = mainKeys.concat(Object.keys(item));
      infoKeys = infoKeys.concat(Object.keys(item.info));
  });
  mainKeys = arrayUnique(mainKeys);
  infoKeys = arrayUnique(infoKeys);
  keys = mainKeys.concat(infoKeys);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function(item) {
      ctr = 0;
      mainKeys.forEach(function(key) {
          if (ctr > 0) result += columnDelimiter;
          res = item[key];
          if (res == undefined) res = "";
          if (typeof res == "object") res = "[object]";
          result += '"' + res + '"';
          ctr++;
      });
      ctr = 0;
      result += columnDelimiter;
      infoKeys.forEach(function(key) {
          if (ctr > 0) result += columnDelimiter;
          res = item.info[key];
          if (res == undefined) res = "";
          if (typeof res == "object") res = "[object]";
          result += '"' + res + '"';
          ctr++;
      });
      result += lineDelimiter;
  });

  return result;
}

function downloadCSV(_data) {
  var data, filename, link;
  var csv = convertArrayOfObjectsToCSV(_data);
  if (csv == null) return;

  filename = "bhb_points_" + FORMAT_DATE_TIME_SHORT(Date.now()) + ".csv";

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
            if(a[i] === a[j])
                a.splice(j--, 1);
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

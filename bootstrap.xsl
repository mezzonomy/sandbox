<?xml version='1.0' encoding='utf-8'?>
<?NDA (c) 2014-2017, sarl mezzònomy

	Only the following societies are granted by sarl mezzonomy
	to read and modify this piece of code, engineer part of
	the HYPER software :

	 - SYNTYS

	By detaining a copy of this file on their disks, these
	societies accepts the following term : do not disclose
	the content to this file to any third parties.

	This agreement has no limit in time.

	If you discover this file on a disk of a society not listed
	in the above list, this detention could be prosecuted as
	violation of the intellectuel property of sarl mezzonomy.

	Please delete it.
?>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   P R E L U D E
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!--| xmlns:*       : namespace déclaration
  -->

<xsl:stylesheet         version = "1.0"
	xmlns:sandbox="bhb://the.sandbox"
    xmlns:xsl = "http://www.w3.org/1999/XSL/Transform"
    xmlns:bhb = "bhb://the.hypertext.blockchain"
    xmlns:on  = "bhb://sourced.events"
>

<!--| defaultss.xsl : dom default output for engineers
  -->

<xsl:import href="../hyper/defaultss.xsl"/>
<xsl:import href="../hyper/structure-modal.xsl"/>

<!--| situation     : url
    | perspective   : dom
  -->
<xsl:variable name="perspective" select="bhb:perspective($situation)"/>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   S T A T U T S'
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<xsl:template match="/bhb:structure">
	<bhb:protocol>
		<on:body  method="filter-body" select="." />
		<on:block method="emit_paraph" filter="not(@bhb:sign)"
			select="//bhb:display[ @user=bhb:signatures()]"/>
		<on:block method="drop" filter="@bhb:sign and not(@bhb:hook)"
			 update="break"/>
		<on:block method="freeze" filter="@bhb:sign and @bhb:hook"/>
		<on:promote method="emit_paraph" filter="not(@bhb:sign)"
			select="//bhb:display[ @user=bhb:signatures()]"/>
	</bhb:protocol>
</xsl:template>

<xsl:template match="/sandbox:map">
	<xsl:variable name="position" select="//*[ @matricule = $perspective/@username]"/>
	<xsl:variable name="default-position">
		<xsl:apply-templates select="*[1]" mode="bottom-alpha"/>
	</xsl:variable>
	<xsl:variable name="mode" select="bhb:default($perspective/@bhb:mode, 'graph')"/>
	<html>
		<head>
			<title>
				<xsl:text>Sandbox&#160;[</xsl:text>
				<xsl:value-of select="$perspective/@username"/>
				<xsl:text>]</xsl:text>
			</title>
			<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
			<link type="text/css" rel="stylesheet" href="hyper/defaultss.css" charset="utf-8"/>
			<link type="text/css" rel="stylesheet" href="sandbox/codemirror/lib/codemirror.css" charset="utf-8"/>
			<link type="text/css" rel="stylesheet" href="sandbox/codemirror/addon/hint/show-hint.css" charset="utf-8"/>
	  	<link type="text/css" rel="stylesheet" href="sandbox/codemirror/addon/fold/foldgutter.css" charset="utf-8"/>>
			<link type="text/css" rel="stylesheet" href="sandbox/sandbox.css" charset="utf-8"/>
			<link type="text/css" rel="stylesheet" href="sandbox/render.css" charset="utf-8"/>
			<link type="text/css" rel="stylesheet" href="sandbox/time-range-slider.css" charset="utf-8"/>
			<link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,700&amp;subset=latin-ext" rel="stylesheet"/>
			<script src="sandbox/misc.js" type="text/javascript"></script>
			<script src="sandbox/d3-wlibrairies.js" type="text/javascript"></script>
			<script src="sandbox/codemirror/lib/codemirror.js" type="text/javascript"></script>
			<script src="sandbox/codemirror/addon/search/search.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/search/searchcursor.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/hint/show-hint.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/hint/xml-hint.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/fold/foldcode.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/fold/foldgutter.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/fold/brace-fold.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/fold/xml-fold.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/fold/indent-fold.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/fold/markdown-fold.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/fold/comment-fold.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/edit/matchtags.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/addon/selection/mark-selection.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/codemirror/mode/xml/xml.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/render.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/time-range-slider.js" type="text/javascript" defer="defer"></script>
		</head>
		<body>
			<div id="loader" style="z-index: 1072; overflow-x: hidden; overflow-y: auto; position: fixed;top: 0; right: 0; bottom: 0; left: 0; display: block; background-color: rgb(0,0,0); background-color: rgba(33,33,33,.6);"/>
			<div id="universe" data-bhbmode="{$mode}" data-bhbposition="{bhb:default($perspective/@bhb:position, $default-position)}">
				<nav id="toolboxes" class="{$mode}">
					<xsl:call-template name="explorer"><xsl:with-param name="mode" select="$mode"/></xsl:call-template>
					<xsl:call-template name="perspective"><xsl:with-param name="mode" select="$mode"/></xsl:call-template>
					<xsl:call-template name="amendment"><xsl:with-param name="role" select="'admin'"/><xsl:with-param name="mode" select="$mode"/></xsl:call-template>
					<xsl:call-template name="text"><xsl:with-param name="mode" select="$mode"/></xsl:call-template>
				</nav>
				<div id="workspace" class="{$mode}">
					<xsl:call-template name="workspace">
						<xsl:with-param name="mode" select="$mode"/>
					</xsl:call-template>
				</div>
			</div>
		</body>
	</html>
</xsl:template>

<!-- Workspaces layout-->
<xsl:template name="workspace">
	<xsl:param name="mode"/>
	<xsl:choose>
		 <xsl:when test="$mode = 'graph'">
			 <xsl:call-template name="bhbgraph"/>
		 </xsl:when>
		 <xsl:when test="$mode = 'text'">
			 <xsl:call-template name="bhbtext"/>
		 </xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="mini_workspace">
	<xsl:param name="mode"/>
	<xsl:choose>
		 <xsl:when test="$mode = 'text'">
			 <xsl:call-template name="bhbgraph"/>
		 </xsl:when>
		 <xsl:when test="$mode = 'graph'">
			 <xsl:call-template name="bhbtext"/>
		 </xsl:when>
	 </xsl:choose>
</xsl:template>

<!-- Text -->
<xsl:template name="bhbtext">
	<div id="bhb-text">
			 <xsl:apply-templates select="bhb:modal($situation)" mode="xsl:default"/>
	</div>
</xsl:template>

<!-- Graph (point matrix) & fire render js UI (default render)-->
<xsl:template name="bhbgraph">
		<xsl:variable name="js">
			<xsl:apply-templates mode="spheric"/>
		</xsl:variable>
		<xsl:processing-instruction name="js-diff-matrix">
			<xsl:text>DATA=[</xsl:text>
			<xsl:value-of select="normalize-space($js)"/>
			<xsl:text>];</xsl:text>
		</xsl:processing-instruction>
		<xsl:processing-instruction name="js-draw-matrix">
			<xsl:text>DATA=[</xsl:text>
			<xsl:value-of select="normalize-space($js)"/>
			<xsl:text>];</xsl:text>
			<!-- this postlude should be embedded in global prelude -->
			<xsl:text>
				function wait4loader() {
				    if (typeof initLoader != 'undefined') {
				        initLoader();
				    }
				    else {
				        setTimeout(wait4loader, 50);
				    }
				}
				function wait4render() {
				    if (typeof d3 != 'undefined' &amp;&amp; typeof CodeMirror != 'undefined' &amp;&amp; typeof render != 'undefined') {
							closeLoader();
							render(DATA, js_diff_matrix);
				    }
				    else {
				        setTimeout(wait4render, 1000);
				    }
				}
				wait4loader();
				wait4render();
			 </xsl:text>
		</xsl:processing-instruction>
</xsl:template>

<xsl:template match="*" mode="info">
	<xsl:param name="spheric">0</xsl:param>
	<xsl:param name="point"/>
	<xsl:param name="path"/>
	<xsl:param name="order"/>
	<xsl:param name="next"/>
	<xsl:param name="peer"/>
{"point":"<xsl:value-of select="$point"/>",
"path":"<xsl:value-of select="$path"/>",
"order":"<xsl:value-of select="$order"/>",
"next":"<xsl:value-of select="$next"/>",
"peer":"<xsl:value-of select="$peer"/>",
"info":{"xsl_element": "<xsl:value-of select="name()"/>",
	<xsl:if test="$spheric='1'">"bhb_spheric": "1",</xsl:if>
	<xsl:apply-templates select="@*" mode="info"/>
	},},
</xsl:template>

<xsl:template match="@*" mode="info">
	"<xsl:value-of select="translate(name(),':','_')"/>": "<xsl:value-of select="."/>",
</xsl:template>

</xsl:stylesheet>

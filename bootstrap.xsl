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
	   S T A T U T S
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
	<xsl:variable name="position" select="//*[ @matricule = $perspective/@username]" />
	<html>
		<head>
			<title>
				<!--xsl:value-of select="$situation"/-->
				<xsl:text>SANDBOX [</xsl:text>
				<xsl:value-of select="$perspective/@username" />
				<xsl:text>]</xsl:text>
			</title>
			<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
			<link type="text/css" rel="stylesheet" href="sandbox/sandbox.css" charset="utf-8" />
			<link type="text/css" rel="stylesheet" href="hyper/defaultss.css" charset="utf-8" />
			<link type="text/css" rel="stylesheet" href="sandbox/render.css" charset="utf-8" />
			<link type="text/css" rel="stylesheet" href="sandbox/time-range-slider.css" charset="utf-8" />
			<script src="sandbox/misc.js" type="text/javascript"></script>
			<script src="sandbox/d3-wlibrairies.js" type="text/javascript"></script>
			<script src="sandbox/render.js" type="text/javascript" defer="defer"></script>
			<script src="sandbox/time-range-slider.js" type="text/javascript" defer="defer"></script>
		</head>
		<body>
			<div id="loader" style="z-index: 1072; overflow-x: hidden; overflow-y: auto; position: fixed;top: 0; right: 0; bottom: 0; left: 0; display: block; background-color: rgb(0,0,0); background-color: rgba(33,33,33,.6);"/>
			<div id="universe">
				<nav id="toolboxes" class="graphical">
					<xsl:call-template name="explorer"/>
					<xsl:call-template name="perspective"/>
					<xsl:call-template name="amendment">
						<xsl:with-param name="role" select="'admin'" />
					</xsl:call-template>
					<xsl:call-template name="text"/>
				</nav>
				<xsl:call-template name="placeholder" class="graphical"/>
			</div>
			<div id="bhb-situation" class="hidden">
					<xsl:apply-templates select="bhb:modal($situation)" mode="xsl:default"/>
			</div>
		</body>
	</html>
</xsl:template>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   J A V A S C R I P T   I N T E R F A C E
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<xsl:template name="placeholder">
	<div id="placeholder" class="render-scene">
		<xsl:variable name="js">
			<xsl:apply-templates mode="spheric"/>
		</xsl:variable>
		<xsl:processing-instruction name="js-draw-matrix">
			<xsl:text>data=[</xsl:text>
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
				    if (typeof d3 != 'undefined' || typeof render != 'undefined') {
							closeLoader();
							render(data);
				    }
				    else {
				        setTimeout(wait4render, 1000);
				    }
				}
				wait4loader();
				wait4render();
			 </xsl:text>
		</xsl:processing-instruction>
	</div>
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

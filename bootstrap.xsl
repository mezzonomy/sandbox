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

<xsl:template name="sandbox:header">
	<xsl:param name="role"/>
	<div class="header">
		<img id="logo" src="sandbox/mezzonomy-logo-small.png" height="50"/>
		<div id="environment" class="environment">
			<p id="env-name">
				<xsl:value-of select="$perspective/@username"/>
				<sub>
					<select id="env-role">
						<option value="NOSELECT">
							<xsl:value-of select="$role"/>
							<?TBD multi-role situation?>
						</option>
					</select>
				</sub>
			</p>
		</div>
	</div>
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
			<link type="text/css" rel="stylesheet" href="sandbox/sandbox.css" charset="utf-8" />
			<link type="text/css" rel="stylesheet" href="hyper/defaultss.css" charset="utf-8" />
			<link type="text/css" rel="stylesheet" href="sandbox/render.css" charset="utf-8" />
			<script src="sandbox/misc.js" type="text/javascript"></script>
			<script src="sandbox/d3.js" type="text/javascript"></script>
			<script src="sandbox/d3-scale-chromatic.js" type="text/javascript"></script>
			<script src="sandbox/render.js" type="text/javascript"></script>
		</head>
		<body>
			<div id="loader" style="z-index: 1072; overflow-x: hidden; overflow-y: auto; position: fixed;top: 0; right: 0; bottom: 0; left: 0; display: block; background-color: rgb(0,0,0); background-color: rgba(33,33,33,.6);"/>
			<div id="universe">
				<xsl:call-template name="explorer"/>
				<xsl:call-template name="perspective"/>
				<xsl:call-template name="amendment">
					<xsl:with-param name="role" select="'admin'" />
				</xsl:call-template>
				<xsl:call-template name="text"/>
				<xsl:call-template name="placeholder"/>
			</div>
		</body>
	</html>
</xsl:template>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   N O D E   T R A N S C R I P T I O N
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<xsl:template match="*" mode="info">
	<xsl:param name="spheric">0</xsl:param>
	{"xsl_element": "<xsl:value-of select="name()"/>",
	<xsl:if test="$spheric='1'">"bhb_spheric": "1",</xsl:if>
	<xsl:apply-templates select="@*" mode="info"/>
	}
</xsl:template>

<xsl:template match="@*" mode="info">
	"<xsl:value-of select="translate(name(),':','_')"/>": "<xsl:value-of select="."/>",
</xsl:template>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   M O D A L   M A C H I N E R Y
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

	<xsl:template name="matrix-line">
		<xsl:param name="point"/>
		<xsl:param name="next"/>
		<xsl:param name="peer"/>
		<xsl:param name="info"/>
{"point":"<xsl:value-of select="$point"/>",
"next":"<xsl:value-of select="$next"/>",
"peer":"<xsl:value-of select="$peer"/>",
"info":<xsl:value-of select="$info"/>,},
	</xsl:template>

	<xsl:template name="placeholder">
		<div id="placeholder" class="render-scene">
			<xsl:variable name="js">
				<xsl:apply-templates mode="root"/>
			</xsl:variable>
			<xsl:processing-instruction name="js">
				<xsl:text>data=[</xsl:text>
				<xsl:value-of select="normalize-space($js)"/>
				<xsl:text>];</xsl:text>
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
					    if (typeof render != 'undefined') {
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

<xsl:template match="*[not( self::bhb:source)][not( self::bhb:link)]" mode="root">
	<!-- noeud racine est en omega -->
	<xsl:variable name="bottom">
		<xsl:apply-templates select="." mode="bottom-alpha"/>
	</xsl:variable>
	<xsl:call-template name="matrix-line">
		<xsl:with-param name="point" select="$bottom"/>
		<xsl:with-param name="next">
			<xsl:choose>
				<xsl:when test="child::*">
					<xsl:apply-templates select="child::*[1]" mode="top-alpha"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="." mode="bottom-alpha"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:with-param>
		<xsl:with-param name="peer" select="$bottom"/>
		<xsl:with-param name="info">
			<xsl:apply-templates select="." mode="info">
				<xsl:with-param name="bhb:spheric">1</xsl:with-param>
			</xsl:apply-templates>
		</xsl:with-param>
	</xsl:call-template>
	<xsl:apply-templates select="descendant::*" mode="alpha-rho"/>
</xsl:template>

<xsl:template match="*" mode="alpha-rho">

	<xsl:variable name="top">
		<xsl:apply-templates select="." mode="top-alpha"/>
	</xsl:variable>

	<xsl:variable name="bottom">
		<xsl:apply-templates select="." mode="bottom-alpha"/>
	</xsl:variable>

	<xsl:variable name="after">
		<xsl:choose>
			<xsl:when test="following-sibling::*">
				<xsl:apply-templates select="following-sibling::*[1]" mode="top-alpha"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select=".." mode="bottom-alpha"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<xsl:variable name="push">
		<xsl:choose>
			<xsl:when test="@bhb:symbol">
				<xsl:variable name="symbol" select="@bhb:symbol"/>
				<xsl:variable name="peer" select="following::*[ @bhb:symbol=$symbol]"/>
				<xsl:choose>
					<xsl:when test="$peer/following-sibling::*">
						<xsl:apply-templates select="$peer/following-sibling::*[1]" mode="top-alpha"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:apply-templates select="$peer/.." mode="bottom-alpha"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<xsl:choose>
					<xsl:when test="child::*">
						<xsl:apply-templates select="child::*[1]" mode="top-alpha"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:apply-templates select="." mode="bottom-alpha"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<xsl:variable name="name" select="name()"/>
	<xsl:variable name="planar">
			<xsl:value-of select="$perspective/@*[ name()=$name]"/>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$planar='1'">
			<!-- planar -->
			<xsl:call-template name="matrix-line">
				<xsl:with-param name="point" select="$top"/>
				<xsl:with-param name="next" select="$after"/>
				<xsl:with-param name="peer" select="$bottom"/>
				<xsl:with-param name="info">
					<xsl:apply-templates select="." mode="info"/>
				</xsl:with-param>
			</xsl:call-template>
			<xsl:call-template name="matrix-line">
				<xsl:with-param name="point" select="$bottom"/>
				<xsl:with-param name="next" select="$push"/>
				<xsl:with-param name="peer" select="$top"/>
				<xsl:with-param name="info">
					<xsl:apply-templates select="." mode="info"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<!-- hyperbolic -->
			<xsl:call-template name="matrix-line">
				<xsl:with-param name="point" select="$top"/>
				<xsl:with-param name="next" select="$push"/>
				<xsl:with-param name="peer" select="$bottom"/>
				<xsl:with-param name="info">
					<xsl:apply-templates select="." mode="info"/>
				</xsl:with-param>
			</xsl:call-template>
			<xsl:call-template name="matrix-line">
				<xsl:with-param name="point" select="$bottom"/>
				<xsl:with-param name="next" select="$after"/>
				<xsl:with-param name="peer" select="$top"/>
				<xsl:with-param name="info">
					<xsl:apply-templates select="." mode="info"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*[ preceding::*/@bhb:symbol=current()/@bhb:symbol]" mode="alpha-rho"/>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   N A M I N G   S T R A T E G Y
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<xsl:template match="*" mode="top-alpha">ERROR</xsl:template>
<xsl:template match="*" mode="bottom-alpha">ERROR</xsl:template>

<xsl:template match="*[ @bhb:identity][ not(@bhb:symbol)]" mode="top-alpha">
 	<xsl:text>T_</xsl:text>
	<xsl:value-of select="@bhb:identity"/>
</xsl:template>

<xsl:template match="*[ @bhb:identity][ not(@bhb:symbol)]" mode="bottom-alpha">
 	<xsl:text>B_</xsl:text>
	<xsl:value-of select="@bhb:identity"/>
</xsl:template>

<xsl:template match="*[ @bhb:symbol]" mode="top-alpha">
	<xsl:variable name="symbol" select="@bhb:symbol"/>
	<xsl:choose>
		<xsl:when test="preceding::*[ @bhb:symbol=$symbol]">
		 	<xsl:text>T_</xsl:text>
			<xsl:value-of select="@bhb:symbol"/>
		</xsl:when>
		<xsl:otherwise>
		 	<xsl:text>B_</xsl:text>
			<xsl:value-of select="@bhb:symbol"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*[ @bhb:symbol]" mode="bottom-alpha">
	<xsl:variable name="symbol" select="@bhb:symbol"/>
	<xsl:choose>
		<xsl:when test="preceding::*[ @bhb:symbol=$symbol]">
		 	<xsl:text>B_</xsl:text>
			<xsl:value-of select="@bhb:symbol"/>
		</xsl:when>
		<xsl:otherwise>
		 	<xsl:text>T_</xsl:text>
			<xsl:value-of select="@bhb:symbol"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>

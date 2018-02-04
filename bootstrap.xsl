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
			<script src="sandbox/d3.js" type="text/javascript"></script>
			<script src="sandbox/render.js" type="text/javascript"></script>
		</head>
		<body>
			<div id="universe">
				<xsl:call-template name="explorer"/>
				<xsl:call-template name="perspective"/>
				<xsl:call-template name="amendment"/>
				<xsl:call-template name="text"/>
				<xsl:call-template name="placeholder"/>
			</div>
		</body>
	</html>
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
"info":"<xsl:value-of select="$info"/>",},
	</xsl:template>

	<xsl:template name="placeholder">
		<div id="placeholder" class="render-scene">
			<xsl:variable name="js">
				<xsl:apply-templates mode="root"/>
			</xsl:variable>
			<xsl:processing-instruction name="js">
				<xsl:text>data=[</xsl:text>
				<xsl:value-of select="normalize-space($js)"/>
				<xsl:text>];
				try{render(data)}catch(error)
				{if (error instanceof ReferenceError) {
					console.log(error);
					setTimeout(function(){render(data)}, 200);
				} else {throw error}};</xsl:text>
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
		<xsl:with-param name="info">bhb:spheric</xsl:with-param>
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
	<xsl:variable name="hyperbolic">
		<xsl:choose>
			<xsl:when test="self::bhb:link and $perspective/@*[ name()=$name]='1'">0</xsl:when>
			<xsl:when test="self::bhb:link">1</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$perspective/@*[ name()=$name]"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$hyperbolic='1'">
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
		</xsl:when>
		<xsl:otherwise>
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

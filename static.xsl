<?xml version='1.0' encoding='utf-8'?>
<?NDA (c) 2014-2017, sarl mezzònomy
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

<xsl:import href="bootstrap.xsl"/>
<!--| situation     : url
    | perspective   : dom
  -->
<xsl:variable name="perspective" select="bhb:perspective($situation)"/>


<xsl:template match="*" mode="info">
	<xsl:variable name="name" select="name()"/>
	<xsl:value-of select="$name"/>
</xsl:template>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   S T A T I C
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<xsl:template name="perspective">
	<div id="perspective" class="toolbox lower-left">
		<h1> Perspectives </h1>
		<xsl:variable name="dictionary" select="@*"/>
		<xsl:for-each select="bhb:unique(*/descendant::*)/@key">
			<xsl:variable name="name" select="bhb:short_ns(.)"/>
			<p>
				<xsl:choose>
					<xsl:when test="$perspective/@*[ name()=$name]='1'">
						<a onclick="{bhb:query(.,'0')}">&#x2611; </a>
					</xsl:when>
					<xsl:otherwise>
						<a onclick="{bhb:query(.,'1')}">&#x2610; </a>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:choose>
					<xsl:when test="$dictionary[ name()=$name]">
						<xsl:value-of select="$dictionary[ name()=$name]"/>
					</xsl:when>
					<xsl:otherwise>
						<I>
							<xsl:value-of select="$name"/>
						</I>
					</xsl:otherwise>
				</xsl:choose>
			</p>
		</xsl:for-each>
	</div>
</xsl:template>

<xsl:template name="explorer">
	<div id="explorer" class="toolbox upper-left">
		<h1> Explorer </h1>
	</div>
</xsl:template>

<xsl:template name="amendment">
	<div id="amendment" class="toolbox upper-right">
		<h1> Amendments </h1>
	</div>
</xsl:template>

<xsl:template name="text">
	<div id="text" class="toolbox lower-right">
		<h1> Text </h1>
	</div>
</xsl:template>


<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   W A S T E B A S K E T
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

</xsl:stylesheet>
<?bhb-document on:id='static' on:source='example'  bhb:sign='auto'?>

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

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   S T A T I C
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<xsl:template name="tagname">
	<xsl:param name="name"/>
	<xsl:param name="dictionary"/>
	<xsl:param name="population"/>
	<xsl:attribute name="data-tagname"><xsl:value-of select="$name"/></xsl:attribute>
		<span class="tag-legend">&#9632;&#160;</span>
		<xsl:choose>
			<xsl:when test="$dictionary[ name()=$name]">
				<xsl:value-of select="$dictionary[ name()=$name]"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$name"/>
			</xsl:otherwise>
		</xsl:choose>
		<xsl:text> (</xsl:text>
			<xsl:value-of select="
			   count($population[ name()=$name][ not(@bhb:symbol)])
			+  count($population[ name()=$name][ @bhb:symbol]) div 2"/>
		<xsl:text>)</xsl:text>
</xsl:template>


<xsl:template name="perspective">
	<xsl:variable name="toolbox_ID">perspective</xsl:variable>
	<xsl:variable name="toolbox_LBL">Perspective</xsl:variable>
	<div id="{$toolbox_ID}" class="toolbox lower-left closed">
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/></p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<xsl:variable name="dictionary" select="@*"/>
			<xsl:variable name="top" select="*"/>
			<xsl:variable name="inner" select="*/descendant::*"/>
			<div>
				<div>Bases</div>
				<xsl:variable name="spheric" select="*"/>
				<xsl:for-each select="bhb:unique($top)/@key">
					<xsl:variable name="name" select="bhb:short_ns(.)"/>
						<span class="badge badge-pill badge-spheric">
							<xsl:call-template name="tagname">
								<xsl:with-param name="name" select="$name"/>
								<xsl:with-param name="dictionary" select="$dictionary"/>
								<xsl:with-param name="population" select="$top"/>
							</xsl:call-template>
						</span>
				</xsl:for-each>
			</div>
			<div>
				<div>Déployés</div>
				<xsl:for-each select="bhb:unique($inner)/@key">
					<xsl:variable name="name" select="bhb:short_ns(.)"/>
					<xsl:if test="$perspective/@*[ name()=$name]='1'">
						<span class="badge badge-pill badge-planar badge-clickable" onclick="{bhb:query(.,'0')}">
							<xsl:call-template name="tagname">
								<xsl:with-param name="name" select="$name"/>
								<xsl:with-param name="dictionary" select="$dictionary"/>
								<xsl:with-param name="population" select="$inner"/>
							</xsl:call-template>
						</span>
					</xsl:if>
				</xsl:for-each>
			</div>
			<div>
				<div>Compressés</div>
				<xsl:for-each select="bhb:unique(*/descendant::*)/@key">
					<xsl:variable name="name" select="bhb:short_ns(.)"/>
					<xsl:if test="not($perspective/@*[ name()=$name]='1')">

						<span class="badge badge-pill badge-hyperbolic badge-clickable"  onclick="{bhb:query(.,'1')}">
							<xsl:call-template name="tagname">
								<xsl:with-param name="name" select="$name"/>
								<xsl:with-param name="dictionary" select="$dictionary"/>
								<xsl:with-param name="population" select="$inner"/>
							</xsl:call-template>

						</span>
					</xsl:if>
				</xsl:for-each>
			</div>
		</div>
		<div id="{$toolbox_ID}-footer" class="toolbox-body">
		</div>
	</div>
</xsl:template>

<xsl:template name="explorer">
	<xsl:variable name="toolbox_ID">explorer</xsl:variable>
	<xsl:variable name="toolbox_LBL">Explorer</xsl:variable>
	<div id="{$toolbox_ID}" class="toolbox upper-left closed">
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/></p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<div id="{$toolbox_ID}-time-slider"/>
			<input id="{$toolbox_ID}-from-date" name="{$toolbox_ID}-from-date" type="text" value=""/>
			<input id="{$toolbox_ID}-to-date" name="{$toolbox_ID}-to-date" type="text" value=""/>
			<input id="{$toolbox_ID}-from-date-ISO8601" name="{$toolbox_ID}-from-date-ISO8601" type="text" value=""/>
			<input id="{$toolbox_ID}-to-date-ISO8601" name="{$toolbox_ID}-to-date-ISO8601" type="text" value=""/>
			<div id="slider1"/>
			<xsl:variable name="dictionary" select="@*"/>
			<xsl:for-each select="bhb:key('{bhb://the.hypertext.blockchain}link')/@key">
				<xsl:variable name="name" select="bhb:short_ns(.)"/>
				<p class="tag">
					<xsl:attribute name="data-tagname"><xsl:value-of select="$name"/></xsl:attribute>
					<xsl:choose>
						<xsl:when test="$perspective/@*[ name()=$name]='1'">
							<a onclick="{bhb:query(.,'0')}">&#x2611;</a>
						</xsl:when>
						<xsl:otherwise>
							<a onclick="{bhb:query(.,'1')}">&#x2610;</a>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:choose>
						<xsl:when test="$dictionary[ name()=$name]">
							&#160;<xsl:value-of select="$dictionary[ name()=$name]"/>
						</xsl:when>
						<xsl:otherwise>
							<i>&#160;<xsl:value-of select="$name"/></i>
						</xsl:otherwise>
					</xsl:choose>
				</p>
			</xsl:for-each>
		</div>
	</div>
</xsl:template>

<xsl:template name="amendment">
	<xsl:param name="role"/>
	<xsl:variable name="toolbox_ID">amendment</xsl:variable>
	<xsl:variable name="toolbox_LBL">Amendment</xsl:variable>
	<div id="{$toolbox_ID}" class="toolbox upper-right closed">
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/> as <xsl:value-of select="$perspective/@username"/>&#160;(<xsl:value-of select="$role"/>)</p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<form id="{$toolbox_ID}-valid-form" name="{$toolbox_ID}-valid-form" action="javascript:void(0);">
				<on:submit create="bhb:block">
					<on:attribute name="body" script="_get('{$toolbox_ID}-editzone').value"/>
					<bhb:copy-of select="bhb:parse(@body)"/>
				</on:submit>
				<input id="{$toolbox_ID}-point" name="{$toolbox_ID}-point" type="hidden" value=""/>
				<input id="{$toolbox_ID}-next" name="{$toolbox_ID}-next" type="hidden" value=""/>
				<input id="{$toolbox_ID}-user" name="{$toolbox_ID}-user" type="hidden" required="required">
					<xsl:attribute name="value"><xsl:value-of select="$perspective/@username"/></xsl:attribute>
				</input>
				<input id="{$toolbox_ID}-role" name="{$toolbox_ID}-role" type="hidden" required="required">
					<xsl:attribute name="value"><xsl:value-of select="$role"/></xsl:attribute>
				</input>
				<label for="{$toolbox_ID}-editzone">Edit Amendment</label>
				<textarea id="{$toolbox_ID}-editzone" name="{$toolbox_ID}-editzone" rows="10" class="form-control" placeholder="Please drop a vertex arc here to create a new amendment" spellcheck="false" required="required" oninput="validateAmendment('{$toolbox_ID}-editzone')" onchange="validateAmendment('{$toolbox_ID}-editzone')"/>
				<div id="{$toolbox_ID}-editinfo" class="alert"/>
				<!--<button type="button" id="amendment-checkbtn" name="amendment-checkbtn" class="btn btn-info left" onclick="validateAmendment('amendment-editzone')">check</button>-->
				<button type="submit" form="{$toolbox_ID}-valid-form" value="Submit" id="{$toolbox_ID}-validbtn" name="{$toolbox_ID}-validbtn" class="btn btn-primary right" disabled="disabled">validate</button>
			</form>
		</div>
	</div>
</xsl:template>

<xsl:template name="text">
	<xsl:variable name="toolbox_ID">text</xsl:variable>
	<xsl:variable name="toolbox_LBL">Text</xsl:variable>
	<div id="{$toolbox_ID}" class="toolbox lower-right closed">
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/></p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<form id="{$toolbox_ID}-valid-form" name="{$toolbox_ID}-valid-form" action="javascript:void(0);">
				<div id="{$toolbox_ID}-pointnavtool">
					<input id="{$toolbox_ID}-point" name="{$toolbox_ID}-point" type="hidden" value=""/>
					<input id="{$toolbox_ID}-next" name="{$toolbox_ID}-next" type="hidden" value=""/>
					<input id="{$toolbox_ID}-peer" name="{$toolbox_ID}-peer" type="hidden" value=""/>
					<input id="{$toolbox_ID}-before" name="{$toolbox_ID}-before" type="hidden" value=""/>
				</div>
				<label for="{$toolbox_ID}-editzone">Content</label>
				<textarea id="{$toolbox_ID}-editzone" name="{$toolbox_ID}-editzone" rows="10" class="form-control" placeholder="Please select a point on a vertex to see content" spellcheck="false"/>
			</form>
		</div>
	</div>
</xsl:template>


<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   W A S T E B A S K E T
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

</xsl:stylesheet>
<?bhb-document on:id='static' on:source='example'  bhb:sign='auto'?>

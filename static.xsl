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

<xsl:template match="xsl:warning" mode="xsl:default">
		<xsl:text>Please select a point</xsl:text>
</xsl:template>

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

<!-- Toolboxes -->
<!-- Toolboxes - Perspective-->
<xsl:template name="perspective">
	<xsl:param name="mode"/>
	<xsl:variable name="toolbox_ID">perspective</xsl:variable>
	<xsl:variable name="toolbox_LBL">Perspective</xsl:variable>
	<div id="{$toolbox_ID}">
		<xsl:attribute name="class">
			<xsl:choose>
				<xsl:when test="$mode = 'graph'">
					<xsl:text>toolbox lower-left closed</xsl:text>
				</xsl:when>
				<xsl:when test="$mode = 'text'">
					<xsl:text>toolbox nav-upper closed</xsl:text>
				</xsl:when>
			</xsl:choose>
		</xsl:attribute>
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/></p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<xsl:variable name="dictionary" select="@*"/>
			<xsl:variable name="top" select="*"/>
			<xsl:variable name="inner" select="*/descendant::*"/>
			<div>
				<div><h6>Bases</h6></div>
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
				<div><h6>Déployés<i class="small">&#160;(Cliquer pour compresser)</i></h6></div>
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
				<div><h6>Compressés<i class="small">&#160;(Cliquer pour déployer)</i></h6></div>
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

<!-- Toolboxes - Explorer-->
<xsl:template name="explorer">
	<xsl:param name="mode"/>
	<xsl:variable name="toolbox_ID">explorer</xsl:variable>
	<xsl:variable name="toolbox_LBL">Explorer</xsl:variable>
	<div id="{$toolbox_ID}">
		<xsl:attribute name="class">
			<xsl:choose>
				<xsl:when test="$mode = 'graph'">
					<xsl:text>toolbox upper-left closed</xsl:text>
				</xsl:when>
				<xsl:when test="$mode = 'text'">
					<xsl:text>toolbox nav-upper closed</xsl:text>
				</xsl:when>
			</xsl:choose>
		</xsl:attribute>
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/></p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<div id="{$toolbox_ID}-checkbox" class="toolbox-body">
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
			<div id="{$toolbox_ID}-time-slider"/>
			<xsl:for-each select="bhb:key('{bhb://the.hypertext.blockchain}from', '{bhb://the.hypertext.blockchain}to')/@key">
				<xsl:variable name="key"  select="bhb:short_ns(.)"/>
				<input id="{$toolbox_ID}-{translate(bhb:short_ns(.),':','-')}"
					type="hidden" value=""
					data-bhbquery="{bhb:query(.,'$$DATE')}"
					data-bhbdate="{$perspective/@*[ name()=$key]}"/>
			</xsl:for-each>
			<ol style="font-size:6pt"><!--style="display:none"-->
				<xsl:for-each select="bhb:key('{bhb://the.hypertext.blockchain}from')/@key">
					<xsl:for-each select="$perspective/bhb:solid/bhb:signet">
						<xsl:apply-templates select="bhb:block(@id)" mode="history-ol">
							<xsl:with-param name="toolbox_ID" select="$toolbox_ID"/>
						</xsl:apply-templates>
					</xsl:for-each>
				</xsl:for-each>
			</ol>
		</div>
	</div>
</xsl:template>

<xsl:template match="bhb:block|bhb:document" mode="history-ol">
		<xsl:param name="toolbox_ID"/>
		<li class="{$toolbox_ID}-history-date"><xsl:value-of select="@on:clock"/></li>
</xsl:template>

<!-- Toolboxes - Perspective-->
<xsl:template name="amendment">
	<xsl:param name="mode"/>
	<xsl:param name="role"/>
	<xsl:variable name="toolbox_ID">amendment</xsl:variable>
	<xsl:variable name="toolbox_LBL">Amendment</xsl:variable>
	<div id="{$toolbox_ID}">
		<xsl:attribute name="class">
			<xsl:choose>
				<xsl:when test="$mode = 'graph'">
					<xsl:text>toolbox upper-right closed</xsl:text>
				</xsl:when>
				<xsl:when test="$mode = 'text'">
					<xsl:text>toolbox nav-upper closed</xsl:text>
				</xsl:when>
			</xsl:choose>
		</xsl:attribute>
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/><i class="small">&#160;as&#160;<xsl:value-of select="$perspective/@username"/>&#160;(<xsl:value-of select="$role"/>)</i></p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<form id="{$toolbox_ID}-valid-form" name="{$toolbox_ID}-valid-form" action="javascript:void(0); initAmendment();">
				<on:submit create="bhb:block">
					<on:attribute name="body" script="_get('{$toolbox_ID}-editzone').value.replace(/\u0022/g, String.fromCharCode(39))"/> <!--replaces " by ' :-)-->
					<bhb:copy-of select="bhb:parse(@body)"/>
				</on:submit>
				<input id="{$toolbox_ID}-user" name="{$toolbox_ID}-user" type="hidden" required="required">
					<xsl:attribute name="value"><xsl:value-of select="$perspective/@username"/></xsl:attribute>
				</input>
				<input id="{$toolbox_ID}-role" name="{$toolbox_ID}-role" type="hidden" required="required">
					<xsl:attribute name="value"><xsl:value-of select="$role"/></xsl:attribute>
				</input>
				<label for="{$toolbox_ID}-editzone">Edit Amendment<i class="small">&#160;(glisser un vertex ou un noeud)</i></label>
				<textarea id="{$toolbox_ID}-editzone" name="{$toolbox_ID}-editzone" rows="13" class="form-control" spellcheck="false" required="required" oninput="validateAmendment('{$toolbox_ID}-editzone')" onchange="validateAmendment('{$toolbox_ID}-editzone')"/>
				<div id="{$toolbox_ID}-editinfo" class="alert"/>
				<button type="submit" form="{$toolbox_ID}-valid-form" value="Submit" id="{$toolbox_ID}-validbtn" name="{$toolbox_ID}-validbtn" class="btn btn-primary right" disabled="disabled">&#10003;</button>
			</form>
		</div>
	</div>
</xsl:template>

<!-- Toolboxes - Text-->
<xsl:template name="text">
	<xsl:param name="mode"/>
	<xsl:variable name="toolbox_ID">text</xsl:variable>
	<xsl:variable name="toolbox_LBL">Text</xsl:variable>
	<div id="{$toolbox_ID}">
		<xsl:attribute name="class">
			<xsl:choose>
				<xsl:when test="$mode = 'graph'">
					<xsl:text>toolbox lower-right closed</xsl:text>
				</xsl:when>
				<xsl:when test="$mode = 'text'">
					<xsl:text>toolbox nav-upper opened</xsl:text>
				</xsl:when>
			</xsl:choose>
		</xsl:attribute>
		<div id="{$toolbox_ID}-header" class="toolbox-header" onclick="ui_tlbx_toggle(this.parentElement);">
			<p><xsl:value-of select="$toolbox_LBL"/></p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<form id="{$toolbox_ID}-valid-form" name="{$toolbox_ID}-valid-form" action="javascript:void(0);">
				<h6 data-bhbmode="{$mode}">Content&#160; <button type="button" style="padding: 0; margin: 0; background: none; text-align: unset; vertical-align: text-top;line-height: 1.2; font-size: small;" onclick="openModal(document.getElementById('bhb-text').innerHTML,'Content','max-width: 90%; margin-top: 10px;');">
				<span>&#8599;</span>
				</button>
				<button type="button" style="padding: 0; margin: 0; background: none; text-align: unset; vertical-align: text-top;line-height: 1.2; font-size: small;" onclick="switchView();">
			 <span>&#8621;</span>
		 </button>
				</h6>
				<div id="mini-workspace" data-bhbmode="{$mode}">
					<xsl:call-template name="mini_workspace">
						<xsl:with-param name="mode" select="$mode"/>
					</xsl:call-template>
				</div>
				<div id="{$toolbox_ID}-pointnavtool" data-bhbmode="{$mode}">
					<input id="{$toolbox_ID}-point" name="{$toolbox_ID}-point" type="hidden" value=""/>
					<input id="{$toolbox_ID}-next" name="{$toolbox_ID}-next" type="hidden" value=""/>
					<input id="{$toolbox_ID}-peer" name="{$toolbox_ID}-peer" type="hidden" value=""/>
					<input id="{$toolbox_ID}-before" name="{$toolbox_ID}-before" type="hidden" value=""/>
				</div>
			</form>
		</div>
	</div>
</xsl:template>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   Rewrites defaultss.xsl templates for sandbox and add new ones
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->
<xsl:template match="*" mode="xsl:default">
	<xsl:variable name="nodeName" select="local-name(.)"/>
	<DIV data-elt="{$nodeName}" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
		<xsl:attribute name="class">
			<xsl:text>e unwraped </xsl:text>
			<xsl:value-of select="$nodeName"/>
		</xsl:attribute>
		<NAV class="placeholder_amend_hidden before" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
			<xsl:call-template name="entity-ref">
				<xsl:with-param name="name">#10565</xsl:with-param>
			</xsl:call-template>
		</NAV>
		<DIV class="INDENT">
			<SPAN class="m">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#60</xsl:with-param>
				</xsl:call-template>
			</SPAN>
			<SPAN>
				<xsl:attribute name="class"><xsl:if test="xsl:*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
				<xsl:apply-templates select="." mode="xsl:name"/>
				<xsl:if test="@*">
					<xsl:text> </xsl:text>
				</xsl:if>
			</SPAN>
			<xsl:apply-templates select="@*" mode="xsl:default"/>
			<!--<SPAN class="m"> No more auto close node, but close node on same line
				<xsl:text>/&gt;</xsl:text>
			</SPAN>-->
			<SPAN class="m">
				<xsl:text>&gt;</xsl:text>
			</SPAN>
			<NAV class="placeholder_amend_hidden push append" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#10565</xsl:with-param>
				</xsl:call-template>
			</NAV>
			<SPAN class="m endtag">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#60</xsl:with-param>
				</xsl:call-template>/</SPAN>
			<SPAN>
				<xsl:attribute name="class"><xsl:if test="xsl:*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
				<xsl:apply-templates select="." mode="xsl:name"/>
			</SPAN>
			<SPAN class="m">
				<xsl:text>></xsl:text>
			</SPAN>
		</DIV>
		<NAV class="placeholder_amend_hidden after" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
			<xsl:call-template name="entity-ref">
				<xsl:with-param name="name">#10565</xsl:with-param>
			</xsl:call-template>
		</NAV>
	</DIV>
</xsl:template>

<xsl:template match="*[text() and not (comment() or processing-instruction())]" mode="xsl:default">
	<DIV class="e">
		<DIV>
			<SPAN class="m">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#60</xsl:with-param>
				</xsl:call-template>
			</SPAN>
			<SPAN>
				<xsl:attribute name="class"><xsl:if test="xsl:*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
				<xsl:apply-templates select="." mode="xsl:name"/>
				<xsl:if test="@*">
					<xsl:text> </xsl:text>
				</xsl:if>
			</SPAN>
			<xsl:apply-templates select="@*" mode="xsl:default"/>
			<SPAN class="m">
				<xsl:text>></xsl:text>
			</SPAN>
			<SPAN class="tx">
				<xsl:value-of select="."/>
			</SPAN>
			<SPAN class="m">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#60</xsl:with-param>
				</xsl:call-template>/</SPAN>
			<SPAN>
				<xsl:attribute name="class"><xsl:if test="xsl:*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
				<xsl:apply-templates select="." mode="xsl:name"/>
			</SPAN>
			<SPAN class="m">
				<xsl:text>></xsl:text>
			</SPAN>
		</DIV>
	</DIV>
</xsl:template>

<xsl:template match="*[*]" priority="20" mode="xsl:default">
	<xsl:variable name="nodeName" select="local-name(.)"/>
	<DIV data-elt="{$nodeName}" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
		<xsl:attribute name="class">
			<xsl:text>e unwraped </xsl:text>
			<xsl:value-of select="$nodeName"/>
		</xsl:attribute>
		<NAV class="placeholder_amend_hidden before" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
			<xsl:call-template name="entity-ref">
				<xsl:with-param name="name">#10565</xsl:with-param>
			</xsl:call-template>
		</NAV>
		<DIV class="c">
			<SPAN class="m">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#60</xsl:with-param>
				</xsl:call-template>
			</SPAN>
			<SPAN onclick="ui_wrap_toggle(this.parentNode.parentNode);">
				<xsl:attribute name="class"><xsl:if test="xsl:*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
				<xsl:apply-templates select="." mode="xsl:name"/>
				<xsl:if test="@*">
					<xsl:text> </xsl:text>
				</xsl:if>
			</SPAN>
			<xsl:apply-templates select="@*" mode="xsl:default"/>
			<SPAN class="m">
				<xsl:text>></xsl:text>
			</SPAN>
		</DIV>
		<DIV>
			<NAV class="placeholder_amend_hidden push" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#10565</xsl:with-param>
				</xsl:call-template>
			</NAV>
			<xsl:apply-templates mode="xsl:default"/>
			<NAV class="placeholder_amend_hidden append" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#10565</xsl:with-param>
				</xsl:call-template>
			</NAV>
			<DIV class="endtag">
				<SPAN class="m">
					<xsl:call-template name="entity-ref">
						<xsl:with-param name="name">#60</xsl:with-param>
					</xsl:call-template>/</SPAN>
				<SPAN>
					<xsl:attribute name="class"><xsl:if test="xsl:*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
					<xsl:apply-templates select="." mode="xsl:name"/>
				</SPAN>
				<SPAN class="m">
					<xsl:text>></xsl:text>
				</SPAN>
			</DIV>
			<NAV class="placeholder_amend_hidden after" data-on_id="{@on:id}" data-path="{@path}" data-identity="{@bhb:identity}">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#10565</xsl:with-param>
				</xsl:call-template>
			</NAV>
		</DIV>
	</DIV>
</xsl:template>

<xsl:template match="bhb:link" mode="xsl:name">
	<span>
		<xsl:attribute name="title">
			<xsl:value-of select="namespace-uri(.)"/>
			<xsl:text>:</xsl:text>
			<xsl:value-of select="local-name(.)"/>
		</xsl:attribute>
		<xsl:attribute name="class">
			<xsl:text>bhb dragxmlelement </xsl:text>
			<xsl:value-of select="local-name(.)"/>
		</xsl:attribute>
		<xsl:attribute name="data-path">
			<xsl:value-of select="@on:id"/>
		</xsl:attribute>
		<xsl:text>amendment</xsl:text>
	</span>
</xsl:template>

<xsl:template match="*" mode="xsl:name">
	<span class="notbhb dragxmlelement">
		<xsl:attribute name="data-path">
			<xsl:value-of select="@on:id"/>
		</xsl:attribute>
		<xsl:value-of select="name(.)"/>
	</span>
</xsl:template>

<xsl:template match="@on:clock" mode="xsl:default">
	<xsl:call-template name="entity-ref">
		<xsl:with-param name="name">#32</xsl:with-param>
	</xsl:call-template>
		<span class="bhb on_clock">
			<xsl:attribute name="title">
				<xsl:value-of select="namespace-uri(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="local-name(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:attribute name="data-on_clock">
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:text>on:clock="</xsl:text><xsl:value-of select="."/><xsl:text>"</xsl:text>
		</span>
</xsl:template>

<xsl:template match="@bhb:symbol" mode="xsl:default">
	<xsl:call-template name="entity-ref">
		<xsl:with-param name="name">#32</xsl:with-param>
	</xsl:call-template>
		<span class="bhb on_symbol">
			<xsl:attribute name="title">
				<xsl:value-of select="namespace-uri(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="local-name(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:attribute name="data-on_symbol">
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:text>bhb:symbol="</xsl:text><xsl:value-of select="."/><xsl:text>"</xsl:text>
		</span>
</xsl:template>

<!-- Do not display identity nor id, not to get too messy in the display-->
<xsl:template match="@bhb:identity" mode="xsl:default"/>
<xsl:template match="@on:id" mode="xsl:default"/>

<xsl:template match="@*" mode="xsl:default">
	<xsl:call-template name="entity-ref">
		<xsl:with-param name="name">#32</xsl:with-param>
	</xsl:call-template>
	<SPAN>
		<xsl:attribute name="class"><xsl:if test="xsl:*/@*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
		<xsl:value-of select="name(.)"/>
	</SPAN>
	<SPAN class="m">="</SPAN>
	<SPAN class="av">
		<xsl:apply-templates select="." mode="xsl:attribute"/>
	</SPAN>
	<SPAN class="m">"</SPAN>
</xsl:template>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
	   W A S T E B A S K E T
     = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

</xsl:stylesheet>
<?bhb-document on:id='static' on:source='example'  bhb:sign='auto'?>

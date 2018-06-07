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

<xsl:stylesheet         version = "1.0"
	xmlns:sandbox="bhb://the.sandbox"
    xmlns:xsl = "http://www.w3.org/1999/XSL/Transform"
    xmlns:bhb = "bhb://the.hypertext.blockchain"
    xmlns:on  = "bhb://sourced.events"
>

<xsl:import href="../hyper/defaultss.xsl"/>
<xsl:import href="../hyper/structure-modal.xsl"/>

<xsl:import href="sandbox-defaultss.xsl"/>

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
			<link type="text/css" rel="stylesheet" href="sandbox/sandbox.css" charset="utf-8"/>
			<link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,700&amp;subset=latin-ext" rel="stylesheet"/>
			<script src="sandbox/sandbox-misc.js" type="text/javascript"></script>
			<script src="sandbox/sandbox.js" type="text/javascript" defer="defer"></script>
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
			 <xsl:call-template name="bhbtext">
				 <xsl:with-param name="mode" select="$mode"/>
			 </xsl:call-template>
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
			<xsl:call-template name="bhbtext">
				<xsl:with-param name="mode" select="$mode"/>
			</xsl:call-template>
		</xsl:when>
	 </xsl:choose>
</xsl:template>

<!-- Text -->
<xsl:template name="bhbtext">
	<xsl:param name="mode"/>
	<div id="bhb-text" data-bhbmode="{$mode}">
			<div id="bhb-text-perspective-icon" data-bhbmode="{$mode}"/>
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


<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
		T O O L B O X E S
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
			<ol style="font-size:6pt; display:none;">
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
			<form id="{$toolbox_ID}-valid-form" name="{$toolbox_ID}-valid-form" action="javascript:void(0); initAmendment(cm_editor, true); updateToDateIfSet();">
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
				<label for="{$toolbox_ID}-editzone">
					Edit Amendment
					<xsl:text>    </xsl:text>
					<button type="button" style="padding: 0; margin: 0; background: none; vertical-align: unset;" onclick="cm_editor.setOption('fullScreen', true); cm_editor.setOption('theme', 'material')">
						<span>&#8599;</span>
					</button></label>
				<textarea id="{$toolbox_ID}-editzone" placeholder= "Enter amendment or drag and drop an arc from the graph or an xml node from text... (F11/Esc for full screen editing)" name="{$toolbox_ID}-editzone" class="form-control" required="required" onchange="validateAmendment('{$toolbox_ID}-editzone')"/>
				<div id="{$toolbox_ID}-editinfo" class="alert"/>
				<button type="submit" form="{$toolbox_ID}-valid-form" value="Submit" id="{$toolbox_ID}-validbtn" name="{$toolbox_ID}-validbtn" class="btn btn-primary right" disabled="disabled">&#10003;</button>
				<button type="button" title="Add drop placeholder here (current cursor position)" class="btn btn-secondary right" onclick="cmAddDropPlaceholder(cm_editor);">_</button>
				<button type="button" title="Clear amendment" class="btn btn-secondary right" onclick="initAmendment(cm_editor, false);">&#x000D7;</button>
			</form>
		</div>
	</div>
</xsl:template>

<!-- Toolboxes - Text-->
<xsl:template name="text">
	<xsl:param name="mode"/>
	<xsl:variable name="toolbox_ID">text</xsl:variable>
	<xsl:variable name="toolbox_LBL">
		<xsl:choose>
			<xsl:when test="$mode = 'graph'">
				<xsl:text>Text</xsl:text>
			</xsl:when>
			<xsl:when test="$mode = 'text'">
				<xsl:text>Graph</xsl:text>
			</xsl:when>
		</xsl:choose>
	</xsl:variable>
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
			<p>
				<xsl:value-of select="$toolbox_LBL"/>
				<xsl:text>    </xsl:text>
				<button type="button" style="padding: 0; margin: 0; background: none; text-align: unset; vertical-align: text-top;line-height: 1.2; font-size: small; color:red;" onclick="switchView();">
					<span>&#8621;</span>
				</button>
			</p>
		</div>
		<div id="{$toolbox_ID}-body" class="toolbox-body">
			<form id="{$toolbox_ID}-valid-form" name="{$toolbox_ID}-valid-form" action="javascript:void(0);">
				<h6 data-bhbmode="{$mode}">Content&#160; <button type="button" style="padding: 0; margin: 0; background: none; text-align: unset; vertical-align: text-top;line-height: 1.2; font-size: small;" onclick="openModal(document.getElementById('bhb-text').innerHTML,'Content','max-width: 90%; margin-top: 10px;');">
				<span>&#8599;</span>
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

</xsl:stylesheet>

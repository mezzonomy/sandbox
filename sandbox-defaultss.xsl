<?xml version="1.0" encoding="utf-8"?>
<?NDA (c) 2014-2017, sarl mezzònomy
	If you discover this file on a disk of a society not listed
	in the above list, this detention could be prosecuted as
	violation of the intellectuel property of sarl mezzonomy.

	Please delete it.
?>
<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
		P R E L U D E
		= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->
<xsl:stylesheet xmlns:sandbox="bhb://the.sandbox" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:bhb="bhb://the.hypertext.blockchain" xmlns:on="bhb://sourced.events" version="1.0">

<!--| defaultss.xsl : dom default output for engineers-->
<!--= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
		Rewrites defaultss.xsl templates for sandbox and add new ones
		= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = -->
<xsl:template match="*" mode="xsl:default">
	<xsl:variable name="nodeName" select="local-name(.)"/>
	<DIV data-elt="{$nodeName}" data-path="{@on:id}" data-identity="{@bhb:identity}">
		<xsl:attribute name="class">
			<xsl:text>e unwraped </xsl:text>
			<xsl:value-of select="$nodeName"/>
		</xsl:attribute>
		<xsl:if test="@on:id">
			<NAV class="placeholder_amend_hidden before" data-path="{@on:id}" data-identity="{@bhb:identity}">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#10565</xsl:with-param>
				</xsl:call-template>
			</NAV>
		</xsl:if>
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
			<SPAN class="m">
				<xsl:text>&gt;</xsl:text>
			</SPAN>
			<xsl:if test="@on:id">
				<NAV class="placeholder_amend_hidden push append" data-path="{@on:id}" data-identity="{@bhb:identity}">
					<xsl:call-template name="entity-ref">
						<xsl:with-param name="name">#10565</xsl:with-param>
					</xsl:call-template>
				</NAV>
			</xsl:if>
			<SPAN class="m endtag">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#60</xsl:with-param>
				</xsl:call-template>/</SPAN>
			<SPAN>
				<xsl:attribute name="class"><xsl:if test="xsl:*"><xsl:text>x</xsl:text></xsl:if><xsl:text>t</xsl:text></xsl:attribute>
				<xsl:apply-templates select="." mode="xsl:name"/>
			</SPAN>
			<SPAN class="m">
				<xsl:text>&gt;</xsl:text>
			</SPAN>
		</DIV>
		<xsl:if test="@on:id">
			<NAV class="placeholder_amend_hidden after" data-path="{@on:id}" data-identity="{@bhb:identity}">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#10565</xsl:with-param>
				</xsl:call-template>
			</NAV>
		</xsl:if>
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
				<xsl:text>&gt;</xsl:text>
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
				<xsl:text>&gt;</xsl:text>
			</SPAN>
		</DIV>
	</DIV>
</xsl:template>

<xsl:template match="*[*]" priority="20" mode="xsl:default">
	<xsl:variable name="nodeName" select="local-name(.)"/>
	<DIV data-elt="{$nodeName}" data-path="{@on:id}" data-identity="{@bhb:identity}">
		<xsl:attribute name="class">
			<xsl:text>e unwraped </xsl:text>
			<xsl:value-of select="$nodeName"/>
		</xsl:attribute>
		<xsl:if test="@on:id">
			<NAV class="placeholder_amend_hidden before" data-path="{@on:id}" data-identity="{@bhb:identity}">
				<xsl:call-template name="entity-ref">
					<xsl:with-param name="name">#10565</xsl:with-param>
				</xsl:call-template>
			</NAV>
		</xsl:if>
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
				<xsl:text>&gt;</xsl:text>
			</SPAN>
		</DIV>
		<DIV>
			<xsl:if test="@on:id">
				<NAV class="placeholder_amend_hidden push" data-path="{@on:id}" data-identity="{@bhb:identity}">
					<xsl:call-template name="entity-ref">
						<xsl:with-param name="name">#10565</xsl:with-param>
					</xsl:call-template>
				</NAV>
			</xsl:if>
			<xsl:apply-templates mode="xsl:default"/>
			<xsl:if test="@on:id">
				<NAV class="placeholder_amend_hidden append" data-path="{@on:id}" data-identity="{@bhb:identity}">
					<xsl:call-template name="entity-ref">
						<xsl:with-param name="name">#10565</xsl:with-param>
					</xsl:call-template>
				</NAV>
			</xsl:if>
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
					<xsl:text>&gt;</xsl:text>
				</SPAN>
			</DIV>
			<xsl:if test="@on:id">
				<NAV class="placeholder_amend_hidden after" data-path="{@on:id}" data-identity="{@bhb:identity}">
					<xsl:call-template name="entity-ref">
						<xsl:with-param name="name">#10565</xsl:with-param>
					</xsl:call-template>
				</NAV>
			</xsl:if>
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
		<xsl:attribute name="data-identity">
			<xsl:value-of select="@bhb:identity"/>
		</xsl:attribute>
		<xsl:text>amendment</xsl:text>
	</span>
</xsl:template>

<xsl:template match="*" mode="xsl:name">
	<span class="notbhb dragxmlelement">
		<xsl:attribute name="data-path">
			<xsl:value-of select="@on:id"/>
		</xsl:attribute>
		<xsl:attribute name="data-identity">
			<xsl:value-of select="@bhb:identity"/>
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

<xsl:template match="@bhb:lock" mode="xsl:default">
	<xsl:call-template name="entity-ref">
		<xsl:with-param name="name">#32</xsl:with-param>
	</xsl:call-template>
		<span class="bhb bhb_lock">
			<xsl:attribute name="title">
				<xsl:value-of select="namespace-uri(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="local-name(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:attribute name="data-bhb_lock">
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:text>bhb:lock="</xsl:text><xsl:value-of select="."/><xsl:text>"</xsl:text>
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

<xsl:template match="@bhb:spheric" mode="xsl:default">
	<xsl:call-template name="entity-ref">
		<xsl:with-param name="name">#32</xsl:with-param>
	</xsl:call-template>
		<span class="bhb on_spheric">
			<xsl:attribute name="title">
				<xsl:value-of select="namespace-uri(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="local-name(.)"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:attribute name="data-on_spheric">
				<xsl:value-of select="."/>
			</xsl:attribute>
			<xsl:text>bhb:spheric="</xsl:text><xsl:value-of select="."/><xsl:text>"</xsl:text>
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
</xsl:stylesheet>

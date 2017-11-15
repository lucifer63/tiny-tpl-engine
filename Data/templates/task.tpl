<!-- test conditions -->

<table>
	<tr>
		<td><image_block><img url="icon.png" /></image_block></td>
		<if condition="$( this ).attr('icon') == 'icon'">
			<td><image_block><img url="some-other-icon.png" /></image_block></td>
		</if>
		<td>{content}</td>
	</tr>
</table>



<table width="100%" border-style="none">
	<tr attribute="icon" must_include="yule">
		<td width="50px" text-valign="top">
			<image_block width="32px">
			<img url="Data/images/icons/"/>
			</image_block>
		</td>
		<td text-valign="top">{content}</td>
	</tr>
	<tr attribute="icon" must_be_equal_to="yule">
		<td width="50px" text-valign="top">
			<image_block width="32px">
			<img url="Data/images/icons/"/>
			</image_block>
		</td>
		<td text-valign="top">{content}</td>
	</tr>
	<tr attribute="icon" must_exist">
		<td width="50px" text-valign="center">
			<image_block width="32px">
			<img url="Data/images/icons/"/>
			</image_block>
		</td>
		<td width="50px" text-valign="center">
			<image_block width="32px">
			<img url="Data/images/icons/"/>
			</image_block>
		</td>
		<td text-valign="center">{content}</td>
	</tr>
</table>
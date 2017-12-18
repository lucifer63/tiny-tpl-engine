module.exports = function(grunt) {

	var path = grunt.option('path');

	if (!path) {
		throw new Error('Can\'t proceed without path to project!');
	}

	var tpl_config_json = grunt.file.read(path + '\\tiny-tpl-engine.cfg')
			.replace(
				/\b([a-z-_]+)\b(?=\s*:)/g, 
				function(match, m1) {
					return '"' + m1 + '"';
				}
			)
			.replace(/\\/g,'\\\\'),
		tpl_config 			= JSON.parse(tpl_config_json),
		project_config		= grunt.file.read(path + '\\Data\\configs\\config.cfg'),
		extract_texttags	= new RegExp('textTags\\s*=\\s*(\\[.*?\\])', 'gi'),
		inline_elements		= JSON.parse(extract_texttags.exec(project_config)[1]);

	inline_elements.push("nobr");

	grunt.initConfig({
		prettify: {
			options: {
				condense: false,
				indent: 1,
				indent_char: '\t',
				max_preserve_newlines: 1,
				unformatted: inline_elements
			},
			all: {
				expand: true,
				cwd: path + '\\' + tpl_config.folders.articles,
				ext: '.xml',
				src: ['*.xml'],
				dest: path + '\\' + tpl_config.folders.articles
			}
		}
	});

	grunt.loadNpmTasks('grunt-prettify');

	grunt.registerTask('default', ['prettify']);
};
module.exports = function(grunt) {

	var path = grunt.option('path');

	if (!path) {
		throw new Error('Can\'t proceed without path to project!');
	}

	var tpl_config_fake_json	= grunt.file.read(path + '\\tiny-tpl-engine.cfg').replace(/\//g, '\\\\'),
		tpl_config				= eval('(' + tpl_config_fake_json + ')'),
		project_config			= grunt.file.read(path + '\\Data\\configs\\config.cfg'),
		extract_texttags		= new RegExp('textTags\\s*=\\s*(\\[.*?\\])', 'gi'),
		inline_elements			= JSON.parse(extract_texttags.exec(project_config)[1]);

	inline_elements.push("text", "nobr");

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
				cwd: path + '\\' + tpl_config.folders.processed,
				ext: '.xml',
				src: ['*.xml'],
				dest: path + '\\' + tpl_config.folders.processed
			}
		}
	});

	grunt.loadNpmTasks('grunt-prettify');

	grunt.registerTask('default', ['prettify']);
};
module.exports = function(grunt) {

	/*
	var config				= grunt.file.read('Data/configs/config.cfg'),
		extract_texttags	= new RegExp('textTags\\s*=\\s*(\\[.*?\\])', 'gi');
	*/

	//inline_elements = JSON.parse(extract_texttags.exec(config)[1]);

	var inline_elements		= [],
		path				= grunt.option('path');

	if (!path) {
		throw new Error('Can\'t proceed without path to project!');
	}

	var config_json = grunt.file.read(path + '\\tiny-tpl-engine.cfg')
		.replace(
			/\b([a-z-_]+)\b(?=\s*:)/g, 
			function(match, m1) {
				return '"' + m1 + '"';
			}
		)
		.replace(/\\/g,'\\\\'),
		config = JSON.parse(config_json);

	inline_elements.push("img");

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
				cwd: path + '\\' + config.folders.articles,
				ext: '.xml',
				src: ['*.xml'],
				dest: path + '\\' + config.folders.articles
			}
		}
	});

	grunt.loadNpmTasks('grunt-prettify');

	grunt.registerTask('default', ['prettify']);
};
module.exports = function(grunt) {

	var path = grunt.option('path');

	if (!path) {
		throw new Error('Can\'t proceed without path to project!');
	}

	var tpl_config_fake_json	= grunt.file.read(path + '\\tiny-tpl-engine.cfg').replace(/\//g, '\\\\'),
		tpl_config				= eval('(' + tpl_config_fake_json + ')'),
		project_config			= grunt.file.read(path + '\\Data\\configs\\config.cfg'),
		extract_texttags		= new RegExp('textTags\\s*=\\s*(\\[.*?\\])', 'gi'),
		inline_elements			= JSON.parse(extract_texttags.exec(project_config)[1]),
		default_inline_elements = [ "nobr", "img" ],
		grunt_prettify_options	= {
			condense: false,
			indent: 1,
			indent_char: '\t',
			max_preserve_newlines: 1
		};

	if (!tpl_config.grunt_prettify_options) tpl_config.grunt_prettify_options = {};

	Object.assign(grunt_prettify_options, tpl_config.grunt_prettify_options);
	grunt_prettify_options.unformatted = [];

	if (tpl_config.grunt_prettify_options.unformatted instanceof Array) {
		if (tpl_config.grunt_prettify_options.unformatted_merge_mode === 'set') {
			grunt_prettify_options.unformatted = tpl_config.grunt_prettify_options.unformatted;	
		} else {
			grunt_prettify_options.unformatted = default_inline_elements;
			[].push.apply(grunt_prettify_options.unformatted, tpl_config.grunt_prettify_options.unformatted);
		}
	}

	if (tpl_config.grunt_prettify_options.unformatted_include_inline !== false) {
		[].push.apply(grunt_prettify_options.unformatted, inline_elements);
	}

	grunt.initConfig({
		prettify: {
			options: grunt_prettify_options,
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
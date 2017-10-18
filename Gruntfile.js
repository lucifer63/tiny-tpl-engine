module.exports = function(grunt) {

	var config				= grunt.file.read('Data/configs/config.cfg'),
		extract_texttags	= new RegExp('textTags\\s*=\\s*(\\[.*?\\])', 'gi');
		inline_elements		= JSON.parse(extract_texttags.exec(config)[1]);

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
				cwd: 'dirty/',
				ext: '.xml',
				src: ['*.xml'],
				dest: 'pretty/'
			},
		}
	});

	grunt.loadNpmTasks('grunt-prettify');

	grunt.registerTask('default', ['prettify']);
};
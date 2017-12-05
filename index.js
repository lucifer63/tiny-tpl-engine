'use strict';

require('.//utils.js');
require('.//element_processor.js');

const 	resolve 		= require('path').resolve,
		default_folders	= [ "styles", "scripts", "templates", "configs", "articles_raw", "articles" ];

utils.fs		= require('fs');
utils.cheerio	= require('cheerio');
utils.juice		= require('juice');
utils.templates	= {};
utils.xml_trees	= {};
utils.style		= '';
utils.scripts	= {};

utils.debug = false;

if (process.argv.length < 3) {
	throw new Error('Path to a folder containing .xml files must be passed!');
}

const	project_folder	= resolve(process.argv[2]),
		config_json		= utils.fs.readFileSync(project_folder + '\\tiny-tpl-engine.cfg', 'utf-8')
			.replace(
				/\b([a-z-_]+)\b(?=\s*:)/g, 
				function(match, m1) {
					return '"' + m1 + '"';
				}
			)
			.replace(/\\/g,'\\\\'),
		config			= JSON.parse(config_json);

if (!config.folders) {
	config.folders = {};
}
if (!config.paths) {
	config.paths = {};
}
for (var folder of default_folders) {
	if (!config.folders[ folder ]) {
		config.folders[ folder ] = folder;
	}
}

ignite([
	[ readTemplates, readAndProcessXMLFiles, readStyles, readScripts ],
	applyTemplates,
	inlineStyles,
	applyCounters,
	executeScripts,
	saveFiles
])

function readTemplates(finish, abort) {
	utils.log('Starting to readTemplates.')
	utils.readDir({
		dirname: project_folder + '\\' + config.folders.templates,
		onFile: (i, filename, content) => utils.templates[ filename.split('.')[0] ] = content,
		callback: () => {
			utils.log('Finished procedure readTemplates.')
			finish();
		}
	});
}

function readAndProcessXMLFiles(finish, abort) {
	utils.log('Starting to readAndProcessXMLFiles.')
	utils.readDir({
		dirname: project_folder + '\\' + config.folders.articles_raw,
		onFile: (i, filename, content) => utils.xml_trees[ filename.split('.')[0] ] = utils.cheerio.load( content, { xmlMode: true, decodeEntities: false }),
		callback: () => {
			utils.log('Finished procedure readAndProcessXMLFiles.')
			finish();
		}
	});
}

function readStyles(finish, abort) {
	utils.log('Starting to readStyles.')

	var	extension = '.css',
		contents = [],
		options = {
			dirname: project_folder + '\\' + config.folders.styles,
			onFile: (i, filename, content) => contents[i] = content,
			callback: () => {
				utils.style = contents.join('\n');
				utils.log('Finished procedure readStyles.')
				finish();
			}
		};

	if (config.paths.styles && config.paths.styles instanceof Array) {
		config.paths.styles = config.paths.styles.map(path => path.slice( - extension.length ) === extension ? path : path + extension)
		options.files = config.paths.styles;
		utils.readFiles( options )	
	} else {
		utils.readDir( options );
	}
}

function readScripts(finish, abort) {
	utils.log('Starting to readScripts.')

	var	extension = '.js',
		contents = [],
		options = {
			dirname: project_folder + '\\' + config.folders.scripts,
			onFile: (i, filename, content) => contents[i] = content,
			callback: () => {
				utils.scripts = contents;
				utils.log('Finished procedure readScripts.')
				finish();
			}
		};

	if (config.paths.scripts && config.paths.scripts instanceof Array) {
		config.paths.scripts = config.paths.scripts.map(path => path.slice( - extension.length ) === extension ? path : path + extension)
		options.files = config.paths.scripts;
		utils.readFiles( options )	
	} else {
		utils.readDir( options );
	}
}

function applyTemplates(finish, abort) {
	utils.log('Starting to applyTemplates.')
	for (var tree in utils.xml_trees) {
		element_processor.applyTemplates( utils.xml_trees[ tree ] );
	}
	delete utils.templates;
	utils.log('Finished procedure applyTemplates.')
	finish();
}

function inlineStyles(finish, abort) {
	utils.log('Starting to inlineStyles.')
	for (var tree in utils.xml_trees) {
		utils.juice.inlineDocument( utils.xml_trees[tree], utils.style);
		element_processor.styleToAttributes( utils.xml_trees[ tree ] );
	}
	utils.log('Finished procedure inlineStyles.')
	finish();
}

function applyCounters(finish, abort) {
	utils.log('Starting to applyCounters.')
	for (var tree in utils.xml_trees) {
		element_processor.applyCounters( utils.xml_trees[tree].root(), {}, utils.xml_trees[tree] );
	}
	utils.log('Finished procedure applyCounters.')
	finish();
}

function executeScripts(finish, abort) {
	utils.log('Starting to executeScripts.')
	for (var tree in utils.xml_trees) {
		element_processor.executeScripts( utils.xml_trees[tree].root(), utils.xml_trees[tree] );
	}
	utils.log('Finished procedure executeScripts.')
	finish();
}

function saveFiles() {
	utils.log('Starting to saveFiles.')
	for (var tree in utils.xml_trees) {
		utils.xml_trees[ tree ] = utils.xml_trees[ tree ].html();
	}

	utils.saveFiles({
		dirname: project_folder + '\\' + config.folders.articles,
		file_object: utils.xml_trees,
		callback: () => {
			utils.log('Finished procedure saveFiles.')
		}
	});
}
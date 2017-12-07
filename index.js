'use strict';

require('.//utils.js');
require('.//element_processor.js');

const 	resolve 		= require('path').resolve,
		default_folders	= [ "styles", "scripts", "templates", "configs", "articles_raw", "articles" ];

utils.fs		= require('fs');
utils.cheerio	= require('cheerio');
utils.juice		= require('juice');
utils.mkdirp	= require('mkdirp');
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
	var dirname = project_folder + '\\' + config.folders.templates;

	if (!utils.fs.existsSync(dirname)) {
		console.log(`There is no "${ dirname }" directory!`);
		return finish();
	}

	utils.readDir({
		dirname: dirname,
		callback: files => {
			if (!files.size) {
				console.log(`No files found in "${ dirname }" directory!`);
				return finish();
			}
			for (var filename of files.keys()) {
				utils.templates[ filename.split('.')[0] ] = files.get(filename);
			}
			utils.log('Finished procedure readTemplates.');
			return finish();

		}
	});
}

function readAndProcessXMLFiles(finish, abort) {
	utils.log('Starting to readAndProcessXMLFiles.')
	var dirname = project_folder + '\\' + config.folders.articles_raw;

	if (!utils.fs.existsSync(dirname)) {
		return abort(`There is no "${ dirname }" directory!`);
	}

	utils.readDir({
		dirname: dirname,
		callback: files => {
			if (!files.size) {
				return abort(`No files found in "${ dirname }" directory!`);
			}
			for (var filename of files.keys()) {
				utils.xml_trees[ filename.split('.')[0] ] = utils.cheerio.load( files.get(filename), { xmlMode: true, decodeEntities: false });
			}
			utils.log('Finished procedure readAndProcessXMLFiles.');
			return finish();
		}
	});
}

function readStyles(finish, abort) {
	utils.log('Starting to readStyles.')
	var dirname = project_folder + '\\' + config.folders.styles;

	if (!utils.fs.existsSync(dirname)) {
		console.log(`There is no "${ dirname }" directory!`);
		return finish();
	}

	var	extension = '.css',
		options = {
			dirname: dirname,
			callback: files => {
				if (!files.size) {
					console.log(`No files found in "${ dirname }" directory!`);
					return finish();
				}
				for (var filename of files.keys()) {
					if (filename.slice(-extension.length) === extension) {
						utils.style += files.get(filename) + '\n';	
					}
				}
				utils.log('Finished procedure readStyles.');
				return finish();
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
	var dirname = project_folder + '\\' + config.folders.scripts;

	if (!utils.fs.existsSync(dirname)) {
		console.log(`There is no "${ dirname }" directory!`);
		return finish();
	}

	var	extension = '.js',
		options = {
			dirname: dirname,
			callback: files => {
				if (!files.size) {
					console.log(`No files found in "${ dirname }" directory!`);
					return finish();
				}
				utils.scripts = files;
				utils.log('Finished procedure readScripts.');
				return finish();
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
	utils.log('Finished procedure applyTemplates.');
	return finish();
}

function inlineStyles(finish, abort) {
	utils.log('Starting to inlineStyles.')
	for (var tree in utils.xml_trees) {
		utils.juice.inlineDocument( utils.xml_trees[tree], utils.style);
		element_processor.styleToAttributes( utils.xml_trees[ tree ] );
	}
	utils.log('Finished procedure inlineStyles.');
	return finish();
}

function applyCounters(finish, abort) {
	utils.log('Starting to applyCounters.')
	for (var tree in utils.xml_trees) {
		element_processor.applyCounters( utils.xml_trees[tree].root(), {}, utils.xml_trees[tree] );
	}
	utils.log('Finished procedure applyCounters.');
	return finish();
}

function executeScripts(finish, abort) {
	utils.log('Starting to executeScripts.')
	for (var tree in utils.xml_trees) {
		element_processor.executeScripts( utils.xml_trees[tree] );
	}
	utils.log('Finished procedure executeScripts.');
	return finish();
}

function saveFiles(finish, abort) {
	utils.log('Starting to saveFiles.')
	for (var tree in utils.xml_trees) {
		utils.xml_trees[ tree ] = utils.xml_trees[ tree ].html();
	}

	utils.saveFiles({
		dirname: project_folder + '\\' + config.folders.articles,
		file_object: utils.xml_trees,
		callback: () => {
			utils.log('Finished procedure saveFiles.');
			return finish();
		}
	});
}
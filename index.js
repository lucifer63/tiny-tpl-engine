'use strict';

require('.//utils.js');

const 	resolve 		= require('path').resolve,
		default_folders	= [ "styles", "scripts", "templates", "configs", "raw", "processed" ];

utils.fs			= require('fs');
utils.cheerio		= require('cheerio');
utils.juice			= require('juice');
utils.mkdirp		= require('mkdirp');
utils.templates		= {};
utils.xml_trees		= {};
utils.style			= '';
utils.scripts		= {};
utils.script_steps	= [
	"init",
	"applyTemplates",
	"inlineStyles",
	"applyCounters",
	"saveFiles",
];

require('.//element_processor.js');

utils.debug = false;

if (process.argv.length < 3) {
	throw new Error('Path to a folder containing .xml files must be passed!');
}

const	project_folder		= resolve(process.argv[2]),
		config_fake_json	= utils.fs.readFileSync(project_folder + '\\tiny-tpl-engine.cfg', 'utf-8').replace(/\//g, '\\\\'),
		config				= eval('(' + config_fake_json + ')');

config.project_folder = project_folder;
utils.config = config;

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
	divideScriptsBySteps,
	init,
	applyTemplates,
	inlineStyles,
	applyCounters,
	saveFiles
], true);

async function readTemplates() {
	utils.log('Starting to readTemplates.')
	var dirname = project_folder + '\\' + config.folders.templates;

	if (!utils.fs.existsSync(dirname)) {
		console.log(`There is no "${ dirname }" directory!`);
		return;
	}

	let files = await utils.readDir({
		dirname: dirname,
		callback: files => {
			if (!files.size) {
				console.log(`No files found in "${ dirname }" directory!`);
				return;
			}
			for (var filename of files.keys()) {
				utils.templates[ filename.split('.')[0] ] = files.get(filename);
			}
			utils.log('Finished procedure readTemplates.');

		}
	});
}

async function readAndProcessXMLFiles() {
	var dirname = project_folder + '\\' + config.folders.raw;

	if (!utils.fs.existsSync(dirname)) {
		utils.log(`There is no "${ dirname }" directory!`)
		return;
	}

	utils.readDir({
		dirname: dirname,
		callback: files => {
			if (!files.size) {
				utils.log(`No files found in "${ dirname }" directory!`)
				return;
			}
			for (var filename of files.keys()) {
				utils.xml_trees[ filename.split('.')[0] ] = utils.cheerio.load( files.get(filename), { xmlMode: true, decodeEntities: false });
			}
		}
	});
}

async function readStyles() {
	var dirname = project_folder + '\\' + config.folders.styles;

	if (!utils.fs.existsSync(dirname)) {
		console.log(`There is no "${ dirname }" directory!`);
		return;
	}

	var	extension = '.css',
		options = {
			dirname: dirname,
			callback: files => {
				if (!files.size) {
					console.log(`No files found in "${ dirname }" directory!`);
					return;
				}
				for (var filename of files.keys()) {
					if (filename.slice(-extension.length) === extension) {
						utils.style += files.get(filename) + '\n';
					}
				}
			}
		};

	if (config.paths.styles && config.paths.styles instanceof Array) {
		config.paths.styles = config.paths.styles.map(path => path.slice( - extension.length ) === extension ? path : path + extension)
		options.files = config.paths.styles;
		await utils.readFiles( options )
	} else {
		await utils.readDir( options );
	}
}

async function readScripts() {
	var dirname = project_folder + '\\' + config.folders.scripts;

	if (!utils.fs.existsSync(dirname)) {
		console.log(`There is no "${ dirname }" directory!`);
		return;
	}

	var	extension = '.js',
		options = {
			dirname: dirname,
			callback: files => {
				if (!files.size) {
					console.log(`No files found in "${ dirname }" directory!`);
					return;
				}
				utils.scripts = files;
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

async function divideScriptsBySteps() {
	var step_reg = /^\s*\/\*\s*step:\s*([a-z]*?)\s*\*\//i,
		scripts = utils.scripts;

	utils.scripts = {};

	utils.script_steps.forEach(function(step) {
		utils.scripts[ step ] = new Map();
	});

	if (scripts.size) {
		scripts.forEach(function(code, filename) {
			var step = step_reg.exec( code );

			if (step && utils.script_steps.indexOf(step[1]) !== -1) {
				step = step[1];
			} else {
				step = utils.script_steps.last();
			}

			utils.scripts[ step ].set(filename, code);
		});
	}
}

async function init() {
	/* just a placeholder function to execute scripts bound to step:init */
}

async function applyTemplates() {
	for (var tree in utils.xml_trees) {
		element_processor.applyTemplates( utils.xml_trees[ tree ] );
	}
	delete utils.templates;
}

async function inlineStyles() {
	for (var tree in utils.xml_trees) {
		utils.juice.inlineDocument( utils.xml_trees[tree], utils.style);
		element_processor.styleToAttributes( utils.xml_trees[ tree ] );
	}
}

async function applyCounters() {
	for (var tree in utils.xml_trees) {
		element_processor.applyCounters( utils.xml_trees[tree].root(), {}, utils.xml_trees[tree] );
	}
}

async function saveFiles() {
	for (var tree in utils.xml_trees) {
		utils.xml_trees[ tree ] = utils.xml_trees[ tree ].html();
	}

	await utils.saveFiles({
		dirname: project_folder + '\\' + config.folders.processed,
		file_object: utils.xml_trees,
		callback: () => {
			console.log('All files has been saved!');
		}
	});
}
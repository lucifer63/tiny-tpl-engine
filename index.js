const utils	= require('.//utils.js');

utils.fs		= require('fs');
utils.cheerio	= require('cheerio');
utils.juice		= require('juice');
utils.templates	= {};
utils.xml_trees	= {};

if (process.argv.length < 3) {
	throw new Error('Path to a folder containing .xml files must be passed!');
}

const project_folder = process.argv[2];

utils.ignite([
	[ readTemplates, readAndProcessXMLFiles ],
	applyTemplates,
	saveFiles
])

function readTemplates(resolve, reject) {
	utils.readDir(project_folder + '\\Data\\templates\\', function(filename, content) { 
		utils.templates[ filename.split('.')[0] ] = content; 
	}, utils.throwErr, resolve);
}

function readAndProcessXMLFiles(resolve, reject) {
	utils.readDir(project_folder + '\\Data\\articles_raw\\', function(filename, content) {
		utils.xml_trees[ filename.split('.')[0] ] = utils.cheerio.load( content, { xmlMode: true });
	}, utils.throwErr, resolve);
}

function applyTemplates(resolve, reject) {
	for (tree in utils.xml_trees) {
		utils.applyTemplates( utils.xml_trees[ tree ] );
	}
	resolve();
}

function saveFiles() {
	for (tree in utils.xml_trees) {
		//utils.xml_trees[ tree ] = utils.xml_trees[ tree ].html();
		utils.juice.inlineDocument( utils.xml_trees[tree], 'page { color: red; }');
		console.log(utils.xml_trees[tree].html())

	}

	utils.saveFiles(project_folder + '\\Data\\articles\\', utils.xml_trees, utils.throwErr, function() {
		console.log('Done!')
	})
}

//	console.log( utils.juice.inlineDocument( utils.xml_trees[ 'test' ], 'div { color: red; }' ) );
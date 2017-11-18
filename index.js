// + 1. Excessive/recursive template application, 
// + 2. Template logic, same step as of #1?
// 3. Fix counters.

'use strict';

const utils	= require('.//utils.js');

utils.fs		= require('fs');
utils.cheerio	= require('cheerio');
utils.juice		= require('juice');
utils.templates	= {};
utils.xml_trees	= {};
utils.style		= '';

utils.debug = false;

if (process.argv.length < 3) {
	throw new Error('Path to a folder containing .xml files must be passed!');
}

const project_folder = process.argv[2];

utils.ignite([
	[ readTemplates, readAndProcessXMLFiles, readStyles ],
	applyTemplates,
	inlineStyles,
	applyCounters,
	saveFiles
])

function readTemplates(resolve, reject) {
	utils.log('Starting to readTemplates.')
	utils.readDir(project_folder + '\\Data\\templates\\', function(filename, content) { 
		utils.templates[ filename.split('.')[0] ] = content; 
	}, utils.throwErr, function() {
		utils.log('Finished procedure readTemplates.')
		resolve();
	});
}

function readAndProcessXMLFiles(resolve, reject) {
	utils.log('Starting to readAndProcessXMLFiles.')
	utils.readDir(project_folder + '\\Data\\articles_raw\\', function(filename, content) {
		utils.xml_trees[ filename.split('.')[0] ] = utils.cheerio.load( content, { xmlMode: true, decodeEntities: false });
	}, utils.throwErr, function() {
		utils.log('Finished procedure readAndProcessXMLFiles.')
		resolve();
	});
}

function readStyles(resolve, reject) {
	utils.log('Starting to readStyles.')
	utils.readDir(project_folder + '\\Data\\styles\\', function(filename, content) {
		utils.style += '\n' + content;
	}, utils.throwErr, function() {
		utils.log('Finished procedure readStyles.')
		resolve();
	});
}

function applyTemplates(resolve, reject) {
	utils.log('Starting to applyTemplates.')
	for (var tree in utils.xml_trees) {
		utils.applyTemplates( utils.xml_trees[ tree ] );
	}
	delete utils.templates;
	utils.log('Finished procedure applyTemplates.')
	resolve();
}

function inlineStyles(resolve, reject) {
	utils.log('Starting to inlineStyles.')
	for (var tree in utils.xml_trees) {
		utils.juice.inlineDocument( utils.xml_trees[tree], utils.style);
		utils.styleToAttributes( utils.xml_trees[ tree ] );
	}
	utils.log('Finished procedure inlineStyles.')
	resolve();
}

function applyCounters(resolve, reject) {
	utils.log('Starting to applyCounters.')
	for (var tree in utils.xml_trees) {
		utils.applyCounters( utils.xml_trees[tree].root(), {}, utils.xml_trees[tree] );
	}
	utils.log('Finished procedure applyCounters.')
	resolve();
}

function saveFiles() {
	utils.log('Starting to saveFiles.')
	for (var tree in utils.xml_trees) {
		utils.xml_trees[ tree ] = utils.xml_trees[ tree ].html();
	}

	utils.saveFiles(project_folder + '\\Data\\articles\\', utils.xml_trees, utils.throwErr, function() {
		utils.log('Finished procedure saveFiles.')
	})
}
'use strict';

global.utils = {};
var self = utils;


global.ignite = function( fuse ) {
	var end_of_the_wick, f;

	if (fuse[0] instanceof Array) {
		end_of_the_wick = Promise.all( fuse[0].map(f => new Promise(f)) );
	} else if  (typeof fuse[0] === 'object') {
		end_of_the_wick = Promise.all( Object.values( fuse[0] ).map(f => new Promise(f)) );	
	} else if (typeof fuse[0] === 'function') {
		end_of_the_wick = new Promise(fuse[0]);
	} else {
		throw new Error('Array passed to ignite should only contain arrays, object or functions!');
	}

	for (let i = 1; i < fuse.length; i++) {
		if (fuse[i] instanceof Array) {
			f = function() {
				return Promise.all( fuse[i].map(f => new Promise(f)) );
			}			
		} else if  (typeof fuse[i] === 'object') {
			f = function() {
				return Promise.all( Object.values( fuse[i] ).map(f => new Promise(f)) );	
			}			
		} else if (typeof fuse[i] === 'function') {
			f = function() {
				return new Promise(fuse[i]);
			}
		} else {
			throw new Error('Array passed to ignite should only contain arrays, object or functions!');
		}

		end_of_the_wick = end_of_the_wick.then(f);
	}
};

Object.assign(RegExp, {
	empty_lines:		/^\s*[\r\n]/gm,
	spaces:				/\s+/g,
	content_marker:		/{content}/g,
	single_attr:		/attr(?!\()/g
})

Array.prototype.last = function() {	
	return this[this.length - 1];
}

String.prototype.trim_empty_lines = function() {
	return this.replace(RegExp.empty_lines, '');
}

Object.assign(self, {
	throwErr: function(err) {
		throw err;
	},
	log: (function() {
		var styles = {
			reset: 0,
			bright: 1,
			dim: 2,
			underscore: 4,
			blink: 5,
			reverse: 7,
			hidden: 8,
			fgblack: 30,	black: 30,
			fgred: 31,		red: 31,
			fggreen: 32,	green: 32,
			fgyellow: 33,	yellow: 33,
			fgblue: 34,		blue: 34,
			fgmagenta: 35,	magenta: 35,
			fgcyan: 36,		cyan: 36,
			fgwhite: 37,	white: 37,
			bgblack: 40,
			bgred: 41,
			bggreen: 42,
			bgyellow: 43,
			bgblue: 44,
			bgmagenta: 45,
			bgcyan: 46,
			bgwhite: 47
		}

		return function() {
			if (this.debug) {
				if (arguments[0] in styles) {
					arguments[0] = '\x1b[' + styles[arguments[0]] + 'm%s\x1b[0m';
				}
				console.log.apply(null, Array.prototype.slice.call(arguments));
				return true;
			}
			return false;
		}
	})(),
	// dirname, file_object, callback
	saveFiles: function(options) {

		var files_amount = Object.keys(options.file_object).length,
			processed = 0;

		for (var filename in options.file_object) {
			self.fs.writeFile(options.dirname + '\\' + filename + '.xml', options.file_object[ filename ], function(err) {
				if (err) { 
					utils.throwErr(err); 
					return; 
				} 
				processed++;
				if (files_amount === processed && typeof options.callback === 'function') { 
					options.callback(); 
				} 
			});
		}
	},
	// dirname, files, onFile, callback
	readFiles: function(options) {
		var processed = 0;

		options.files.forEach(function(filename, i) { 
			self.fs.readFile(options.dirname + '\\' + filename, 'utf-8', function(err, content) { 
				if (err) {
					utils.throwErr(err); 
					return; 
				} 
				options.onFile(i, filename, content); 
				processed++;
				if (options.files.length === processed && typeof options.callback === 'function') {
					options.callback(); 
				} 
			}); 
		}); 
	},
	// dirname, onFile, callback
	readDir: function(options) {
		self.fs.readdir(options.dirname, function(err, filenames) { 
			if (err) { 
				utils.throwErr(err); 
				return; 
			} 

			if (!filenames.length) {
				if (important) {
					utils.throwErr( new Error(`Directory ${ options.dirname } is empty!`) );	
				} else {
					self.log(`Directory ${ options.dirname } is empty!`);
				}
				if (typeof options.callback() === 'function') {
					options.callback()
				}
			} else {
				options.files = filenames;
				utils.readFiles(options);
			}
		}); 
	}
});
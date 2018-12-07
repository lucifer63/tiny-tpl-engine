'use strict';

global.utils = {};
var self = utils;

(function() {
	global.ignite = async function( fuse, system ) {
		for (let procedure of fuse) {
			if (system) {
				if (procedure instanceof Array) {
					await Promise.all(procedure.map(f => system_function_wrapper(f)));
				} else {
					await system_function_wrapper(procedure);
				}	
			} else {
				if (procedure instanceof Array) {
					await Promise.all(procedure.map(f => f()));
				} else {
					await procedure();
				}
			}
		}
	}

	async function system_function_wrapper(f) {
		utils.step = f.name;
		console.log(`Starting procedure "${ f.name }"`);
		try {
			if (utils.script_steps.indexOf(f.name) !== -1) {
				await element_processor.executeScriptsForCurrentStep();
			}
			await f();
		} catch (e) {
			console.log(`Procedure "${ f.name }" has failed!`);
			throw e;
		}
		console.log(`Finished procedure "${ f.name }"`);
	}
})();

Object.assign(RegExp, {
	empty_lines:		/^\s*[\r\n]/gm,
	spaces:				/\s+/g
});

Object.assign(Array.prototype, {
	last: function() {
		return this[this.length - 1];
	}
});

Object.assign(String.prototype, {
	startsWith: function( str ) {
		return str.length > 0 && this.substring( 0, str.length ) === str;
	},
	endsWith: function( str ) {
		return str.length > 0 && this.substring( this.length - str.length, this.length ) === str;
	},
	trim_empty_lines: function() {
		return this.replace(RegExp.empty_lines, '');
	},
	truncate: function(n) {
		return (this.length > n) ? this.substr(0, n-1) + '...' : this;
	},
	normalizeSpaces: function() {
		return this.replace(RegExp.spaces, ' ');
	}
});

Object.assign(self, {
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
	readFile: function(path) {
		return new Promise((res, rej) => {
			self.fs.readFile(path, 'utf-8', function(err, content) {
				if (err) {
					return rej( err );
				}

				res( content );
			});
		});
	},
	saveFile: function(path, content) {
		return new Promise((res, rej) => {
			self.fs.writeFile(path, content, 'utf-8', function(err) {
				if (err) {
					return rej( err );
				}

				res( content )
			});
		});
	},
	readFiles: async function(dirname, filenames) {
		var files = new Map();

		for (let filename of filenames) {
			files.set(filename, await self.readFile(dirname + '\\' + filename));
		}

		return files;
	},
	readDir: function(dirname) {
		return new Promise((res, rej) => {
			self.fs.readdir(dirname, async (err, filenames) => {
				if (err) {
					return rej( err );
				}

				res( self.readFiles(dirname, filenames) );
			});
		});
	},
	saveFiles: async function(dirname, file_object, ext) {
		file_object = Object.entries(file_object);

		for (let [filename, content] of file_object) {
			await self.saveFile(dirname + '\\' + filename + (ext && '.' + ext), content);
		}
	}
});
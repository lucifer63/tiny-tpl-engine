module.exports = {};

self = module.exports;

Object.assign(RegExp, {
	empty_lines:		/^\s*[\r\n]/gm,
	spaces:				/\s+/g
})

String.prototype.trim_empty_lines = function() {
	return this.replace(RegExp.empty_lines, '');
}

Object.assign(self, {
	throwErr: function(err) {
		throw err;
	},
	log: function() {
		if (this.debug) {
			console.log.apply(null, Array.prototype.slice.call(arguments));
			return true;
		}
		return false;
	},
	ignite: function( fuse ) {
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
	},
	saveFiles: function(dirname, file_object, onError, callback) {
		var files_amount = Object.keys(file_object).length,
			processed = 0;

		for (var filename in file_object) {
			self.fs.writeFile(dirname + filename + '.xml', file_object[ filename ], function(err) {
				if (err) { 
					onError(err); 
					return; 
				} 
				processed++;
				if (files_amount === processed) { 
					callback(); 
				} 
			});
		}
	},
	readDir: function(dirname, onFileContent, onError, callback) { 
		var processed = 0;

		self.fs.readdir(dirname, function(err, filenames) { 
			if (err) { 
				onError(err); 
				return; 
			} 
			filenames.forEach(function(filename, i) { 
				self.fs.readFile(dirname + filename, 'utf-8', function(err, content) { 
					if (err) { 
						onError(err); 
						return; 
					} 
					onFileContent(filename, content); 
					processed++;
					if (filenames.length === processed) {
						callback(); 
					} 
				}); 
			}); 
		}); 
	},
	applyTemplates: function( $ ) {
		// $ is actually an XML tree, named as $ 'cuz of identical (to jQuery) functionality
		var elements, transfer, attributes; 

		for (var tag_name in self.templates) { 
			elements = $( tag_name ); 

			$( tag_name ).each(function(i, elem) {
				transfer = $( self.templates[ tag_name ].replace('{content}', $(this).html()).trim_empty_lines() )
				$( this ).replaceWith( transfer )

				attributes = $( this ).attr();

				for (var key in attributes) {
					transfer.attr(key, attributes[key]);
				}
			});
		} 
	},
	styleToAttributes: function( $ ) {
		$( '[style]' ).each(function(i, elem) {
			var $elem = $( elem ),
				styles = $elem.attr('style').split(';');

			for (var i = 0; i < styles.length - 1; i++) {
				styles[i] = styles[i].trim().split(':');
				$elem.attr(styles[i][0].trim(), styles[i][1].trim());
			}

			$elem.removeAttr('style');
		});
	},
	checkBrackets: function(input) {
		if (input.split('(').length !== input.split(')').length) {
			throw new Error(`CSS value "${input}" has some extra/forgotten brackets!`);
		}
		return true;
	},
	parseSpaceSeparatedString: function(input) {
		var str = '', arr = [], inside_quoted_region = false;

		for (i = 0, l = input.length; i < l; i++) {
			if (input[i] === '\'') {
				if (inside_quoted_region) {
					arr.push( str );
				} else {
					arr.push( str.trim() )
				}
				inside_quoted_region = !inside_quoted_region;
				str = '';
			} else {
				str += input[i];
			}
		}
		if (inside_quoted_region) {
			arr.push( str );
		} else {
			arr.push( str.trim() )
		}

		return arr;
	},
	parseValue: function(input, node, counters, $) {
		var input = self.parseSpaceSeparatedString(input),
			current,
			output = '';

		for (var i = 0; i < input.length; i++) {
			current = input[i];

			if (current.indexOf('attr') !== -1) {
				current = self.parseCSSFunctionStringAs( 'attr', current )
				current = node.attr( current );
				if (typeof current !== typeof undefined && current !== false) {
					output += current;
				} else {
					console.log(`Warning: element ${ node.prop('tagName') } doesn't have ${ current } attribute!`);
				}
			} else if (current.indexOf('counter') !== -1) {
				current = self.parseCSSFunctionStringAs( 'counter', current )
				output += counters[current][ counters[current].length - 1 ];
			} else {
				output += current
			}
		}

		return output;
	},
	parseCSSFunctionStringAs(type, input) {
		var beginning = type + '(', result;

		if (input.substr(0, beginning.length) === beginning && input[input.length - 1] === ')') {
			return input.substring(beginning.length, input.length - 1);
		} else {
			throw new Error(`CSS value "${input}" is not a valid ${type}!`);
		}
	},
	test: function( node, counters, $ ) {
		var counter_reset = node.attr('counter-reset'),
			index_of_first_space = -1,
			name,
			value;

		if (counter_reset) {
			counter_reset = counter_reset.split(',');
			for (var i = 0; i < counter_reset.length; i++) {
				counter_reset[i] = counter_reset[i].trim();
				index_of_first_space = counter_reset[i].indexOf(' ');

				if (index_of_first_space !== -1) {
					counter_reset[i] = [ counter_reset[i].substr(0, index_of_first_space), counter_reset[i].substr(index_of_first_space + 1).trim() ];
				}
				
				if (typeof counter_reset[i] === 'string') {
					name = counter_reset[i];
					value = 0;
				} else {
					name = counter_reset[i][0];
					value = self.parseCSSFunctionStringAs( 'value', counter_reset[i][1] );
					value = self.parseValue( value, node, counters, $ );	
				}

				if (!(counters[ name ] instanceof Array)) {
					counters[ name ] = []
				}
				counters[ name ].push( value );
			}
			console.log(node.prop('tagName'), counter_reset, counters)
		}

		node.children().each(function(i, elem) {
			self.test( $(elem), counters, $ );
		})
	}
});

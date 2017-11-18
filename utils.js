'use strict';

module.exports = {};

var self = module.exports;

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
	evalCondition: function(condition) {
		return condition ? eval( condition ) : true;
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
	readDir: function(dirname, onFileContent, onError, callback, important) { 
		var processed = 0;

		self.fs.readdir(dirname, function(err, filenames) { 
			if (err) { 
				onError(err); 
				return; 
			} 
			if (!filenames.length) {
				if (important) {
					onError( new Error(`Directory ${ dirname } is empty!`) );	
				} else {
					self.log(`Directory ${ dirname } is empty!`);
				}
				callback()
			} else {
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
			}
		}); 
	},
	applyTemplates: function( $ ) {
		// $ is actually an XML tree, named as $ 'cuz of identical (to jQuery) functionality
		var $elements, $transfer, attributes, unprocessed_elements_exist = true;

		while (unprocessed_elements_exist) {
			unprocessed_elements_exist = false;

			for (var tag_name in self.templates) { 
				$elements = $( tag_name ); 

				if ($elements.length) {
					unprocessed_elements_exist = true;
				}

				$elements.each(function(i, elem) {
					var $initial_element = $( elem );

					$transfer = $( self.templates[ tag_name ].replace(RegExp.content_marker, $(this).html()).trim_empty_lines() )
					$initial_element.replaceWith( $transfer )

					attributes = $( this ).attr();

					for (var key in attributes) {
						$transfer.attr(key, attributes[key]);
					}

					$transfer.data( $initial_element.data() );

					$transfer.find('if').each(function(i, elem) {
						var $if = $( elem ), 
							condition = $if.attr('condition');

						try {
							if (self.evalCondition.call($initial_element, condition)) {
								$if.replaceWith( $if.html() );
							} else {
								$if.remove();
							}
						} catch (e) {
							self.throwErr( new Error(`An error occured during processing of condition "${ condition }" of "IF" element inside "${ $initial_element.prop('tagName') }" element: ${ e.message }`) );
						}
					})

					$transfer.find('[condition]').each(function(i, elem) {
						var $this = $( elem ), 
							condition = $this.attr('condition');

						try {
							if (self.evalCondition.call($initial_element, condition)) {
								$this.removeAttr('condition');
							} else {
								$this.remove();
							}
						} catch (e) {
							self.throwErr( new Error(`An error occured during processing of condition "${ condition }" of "${ $this.prop('tagName') }" element inside "${ $initial_element.prop('tagName') }" element: ${ e.message }`) );
						}
					})
				});
			} 
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
	parseSpaceSeparatedString: (function() {
		var str, arr;

		function push() {
			if (str.length) {
				arr.push( str );
				str = '';
			}
		}

		return function(input) {
			var inside_quoted_region = false;

			str = '';
			arr = [];

			for (var i = 0, l = input.length; i < l; i++) {
				switch (input[i]) {
					case '\'': {
						inside_quoted_region = !inside_quoted_region;
						push()
						break;
					}
					case ' ': {
						if (!inside_quoted_region) {
							push()
							break;
						}
					}
					default: {
						str += input[i];
					}
				}
			}

			push();

			return arr;
		}
	})(),
	parseValue: function(input, node, counters, $) {
		var input = self.parseSpaceSeparatedString(input),
			current,
			attr,
			initial = '',
			output = '',
			counter,
			lvl = node.data('lvl'),
			index;

		for (var i = 0; i < input.length; i++) {
			current = input[i];

			if (current.indexOf('attr') !== -1) {
				attr = self.parseCSSFunctionStringAs( 'attr', current )
				current = node.attr( attr );
				if (typeof current !== typeof undefined && current !== false) {
					output += current;
				} else {
					console.log(`Warning: element "${ node.prop('tagName') }" doesn't have "${ attr }" attribute!`);
				}
			} else if (current === 'content') {
				output += node.html();
			} else if (current.indexOf('counter') !== -1) {
				current = self.parseCSSFunctionStringAs( 'counter', current )

				/* processing counter s */
				index = lvl;

				if (!(current in counters)) {
					throw new Error(`Element "${node.prop('tagName')}" cannot find counter "${current}"!`);
				}

				counter = counters[current];

				while (true) {
					if (counter[ index ]) {
						break;
					} else {
						index--;
					}	
				}

				output += counter[index].last();
				/* processing counter f */
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
	replace(node, tag_name, $) {
		var transfer = $("<" + tag_name + ">" + node.html() + "</" + tag_name + ">"),
			attributes = node.attr();

		for (var key in attributes) {
			transfer.attr(key, attributes[key]);
		}

		transfer.data( node.data() );

		node.replaceWith( transfer );

		return transfer;
	},
	resetCounters: function(node, counters, $) {
		var counter_reset = node.attr('counter-reset'),
			index_of_first_space = -1,
			name,
			value,
			lvl = node.data('lvl');

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

				/* processing counter s */
				if (!(name in counters)) {
					counters[ name ] = [];
				}

				if (!counters[ name ][ lvl ]) {
					counters[ name ][ lvl ] = [];
				}

				counters[ name ][ lvl ].push( value );
				/* processing counter f */
			}
			node.removeAttr('counter-reset');
		}
	},
	incrementCounters: function(node, counters, $) {
		var counter_increment = node.attr('counter-increment'),
			index_of_first_space = -1,
			name,
			value,
			counter,
			lvl = node.data('lvl'),
			index;

		if (counter_increment) {
			counter_increment = counter_increment.split(',');
			for (var i = 0; i < counter_increment.length; i++) {
				counter_increment[i] = counter_increment[i].trim();
				index_of_first_space = counter_increment[i].indexOf(' ');

				if (index_of_first_space !== -1) {
					counter_increment[i] = [ counter_increment[i].substr(0, index_of_first_space), counter_increment[i].substr(index_of_first_space + 1).trim() ];
				}
				
				if (typeof counter_increment[i] === 'string') {
					name = counter_increment[i];
					value = 0;
				} else {
					name = counter_increment[i][0];
					value = self.parseCSSFunctionStringAs( 'value', counter_increment[i][1] );
					value = self.parseValue( value, node, counters, $ );
				}

				/* processing counter s */
				index = lvl;

				if (!(name in counters)) {
					throw new Error(`Element "${node.prop('tagName')}" cannot increment counter "${name}" because the counter doesn't exist!`);
				}

				counter = counters[name];

				while (true) {
					if (counter[ index ]) {
						break;
					} else {
						index--;
					}	
				}

				if (value === 0) {
					counter[index][ counter[index].length - 1 ]++;
				} else {
					counter[index][ counter[index].length - 1 ] = value;
				}
				/* processing counter f */
			}
			node.removeAttr('counter-increment');
		}
	},
	modifyAttributes: function(node, counters, $) {
		var modify_attribute = node.attr('modify-attribute'),
			index_of_first_space = -1,
			name,
			value;

		if (modify_attribute) {
			modify_attribute = modify_attribute.split(',');

			for (var i = 0; i < modify_attribute.length; i++) {
				modify_attribute[i] = modify_attribute[i].trim();
				index_of_first_space = modify_attribute[i].indexOf(' ');

				if (index_of_first_space === -1) {
					throw new Error(`CSS value "${modify_attribute[i]}" is invalid: modify-attribute rule must consist of two parts!`);	
				}

				modify_attribute[i] = [ modify_attribute[i].substr(0, index_of_first_space), modify_attribute[i].substr(index_of_first_space + 1).trim() ];
				
				name = modify_attribute[i][0];

				value = self.parseCSSFunctionStringAs( 'value', modify_attribute[i][1] );
				value = value.replace(RegExp.single_attr, '\'' + node.attr(name) + '\'');
				value = self.parseValue( value, node, counters, $ );

				node.attr(name, value);
			}
			node.removeAttr('modify-attribute');
		}
	},
	modifyContent: function(node, counters, $) {
		var modify_content = node.attr('modify-content'),
			name,
			value;

		if (modify_content) {
			modify_content = modify_content.trim();

			value = self.parseValue( modify_content, node, counters, $ );			

			node.html(value);
			node.removeAttr('modify-content');
		}
	},
	modifyTag: function(node, counters, $) {
		var modify_tag = node.attr('modify-tag'),
			name,
			value;

		if (modify_tag) {
			value = modify_tag.trim();
			value = value.replace('tag', '\'' + node.prop('tagName').toLowerCase() + '\'');
			value = self.parseValue( value, node, counters, $ );
			node = self.replace(node, value, $);
			node.removeAttr('modify-tag');
		}

		return node;
	},
	removeAttributes: function(node, counters, $) {
		var modify_attribute = node.attr('remove-attribute'),
			name,
			value;

		if (modify_attribute) {
			modify_attribute = modify_attribute.split(',');

			for (var i = 0; i < modify_attribute.length; i++) {
				node.removeAttr( modify_attribute[i].trim() )
			}
			
			node.removeAttr('remove-attribute');
		}
	},
	applyCounters: function($node, counters, $, lvl) {
		if (!lvl) {
			lvl = 0;
		}

		$node.data('lvl', lvl);

		self.log('green', `applying to "${ $node.prop('tagName') }", lvl=${ lvl }`);

		try {
			self.resetCounters( $node, counters, $ );
			self.incrementCounters( $node, counters, $ );
			self.modifyAttributes( $node, counters, $ );
			self.modifyContent( $node, counters, $ );
			$node = self.modifyTag( $node, counters, $ );
			self.removeAttributes( $node, counters, $ );
		} catch (e) {
			self.log('red', $node.html());
			throw e;
		}

		$node.children().each(function(i, elem) {
			self.applyCounters( $(elem), counters, $, lvl + 1 );
		})
	}
});




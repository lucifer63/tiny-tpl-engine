module.exports = {};

self = module.exports;

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
				transfer = $( self.templates[ tag_name ].replace(RegExp.content_marker, $(this).html()).trim_empty_lines() )
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
		var str = '',
			arr = [],
			inside_quoted_region = false,
			bracket_opened = false;

		for (i = 0, l = input.length; i < l; i++) {
			switch (input[i]) {
				case '(': {
					if (!inside_quoted_region) {
						bracket_opened = true;
					}
					str += input[i];
					break;
				}
				case ')': {
					if (!inside_quoted_region) {
						bracket_opened = false;
					}
					str += input[i];
					break;
				}
				case '\'': {
					if (bracket_opened) {
						str += input[i];
						break;
					}
					if (inside_quoted_region) {
						if (str.length) {
							arr.push( str );
						}
					} else {
						if (str.length) {
							arr.push( str.trim() );
						}
					}
					inside_quoted_region = !inside_quoted_region;
					str = '';
					break;
				}
				case ' ': {
					if (bracket_opened || inside_quoted_region) {
						str += input[i];
						break;
					}
					if (!inside_quoted_region && str.length) {
						arr.push( str.trim() );
						str = '';
					}
					break;
				}
				default: {
					str += input[i];
				}
			}
		}
		if (inside_quoted_region) {
			if (str.length) {
				arr.push( str );
			}
		} else {
			if (str.length) {
				arr.push( str.trim() );
			}
		}

		return arr;
	},
	parseValue: function(input, node, counters, $) {
		var input = self.parseSpaceSeparatedString(input),
			current,
			attr,
			initial = '',
			output = '';

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

				if (!(counters[current] instanceof Array)) {
					throw new Error(`Element "${node.prop('tagName')}" cannot find counter "${current}"!`);
				}

				output += counters[current].last();
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
		var transfer = $("<" + tag_name + ">" + node.html() + "</" + tag_name + ">");

		attributes = node.attr();

		for (var key in attributes) {
			transfer.attr(key, attributes[key]);
		}

		node.after( transfer ).remove();

		return transfer;
	},
	resetCounters: function(node, counters, $) {
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
			node.removeAttr('counter-reset');
		}
	},
	incrementCounters: function(node, counters, $) {
		var counter_increment = node.attr('counter-increment'),
			name;

		if (counter_increment) {
			counter_increment = counter_increment.split(',');

			for (var i = 0; i < counter_increment.length; i++) {
				name = counter_increment[i].trim();

				if (typeof counters[ name ].last() === 'number') {
					counters[ name ][ counters[ name ].length - 1 ]++;
				}
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
	modifyTags: function(node, counters, $) {
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
	applyCounters: function(node, counters, $) {
		self.log(node.prop('tagName'))

		self.resetCounters( node, counters, $ );
		self.incrementCounters( node, counters, $ );
		self.modifyAttributes( node, counters, $ );
		self.modifyContent( node, counters, $ );
		self.modifyTags( node, counters, $ );
		self.removeAttributes( node, counters, $ );

		//console.log(counters)

		node.children().each(function(i, elem) {
			self.applyCounters( $(elem), counters, $ );
		})
	}
});




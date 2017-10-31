module.exports = {};

self = module.exports;

RegExp.empty_lines = /^\s*[\r\n]/gm;

String.prototype.trim_empty_lines = function() {
	return this.replace(RegExp.empty_lines, '');
}

Object.assign(self, {
	throwErr: function(err) {
		throw err;
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

		for (tag_name in self.templates) { 
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
	}
});
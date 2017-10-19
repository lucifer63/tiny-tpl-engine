module.exports = {};

self = module.exports;

Object.assign(self, {
	throwErr: function(err) {
		throw err;
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
		// $ is actually an XML tree, named as $ 'cuz of identical functionality
		var elements, transfer, attributes; 

		for (tag_name in self.templates) { 
			elements = $( tag_name ); 

			$( tag_name ).each(function(i, elem) {
				transfer = $(self.templates[ tag_name ].replace('{content}', $(this).html()))
				$( this ).replaceWith( transfer )

				attributes = $( this ).attr();

				for (var key in attributes) {
					transfer.attr(key, attributes[key]);
				}
			});
		} 
	}
});
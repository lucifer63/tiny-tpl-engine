const fs = require('fs');

module.exports = {
	throwErr: function(err) { 
		throw err; 
	},
	readFiles: function(dirname, onFileContent, onError, callback) { 
		fs.readdir(dirname, function(err, filenames) { 
			if (err) { 
				onError(err); 
				return; 
			} 
			filenames.forEach(function(filename, i) { 
				fs.readFile(dirname + filename, 'utf-8', function(err, content) { 
					if (err) { 
						onError(err); 
						return; 
					} 
					onFileContent(filename, content); 
					if (i === filenames.length - 1) { 
						callback(); 
					} 
				}); 
			}); 
		}); 
	},
	createElementFromString: function( html ) { 
		var temp = this.document.createElement('div'); 
		temp.innerHTML = html; 
		return temp.children[0]; 
	},
	replaceElement: function(a, b) {
		a.parentNode.replaceChild(b, a);
		return b;
	}
}
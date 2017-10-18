const	jsdom	= require("jsdom"), 
		fs		= require('fs'),
		utils	= require('.//utils.js');

const { JSDOM } = jsdom; 

var xml			= fs.readFileSync('test.xml', 'utf8'), 
	dom			= new JSDOM( xml, { contentType: "text/xml" }),
	document	= dom.window.document,
	root		= dom.window.document.documentElement;

utils.document = document;

var templates = {}; 

utils.readFiles(__dirname + '\\templates\\', function(filename, content) { 
	templates[ filename.split('.')[0] ] = content; 
}, utils.throwErr, function() { 
	var elements, transfer, attributes; 

	for (tag_name in templates) { 
		elements = root.getElementsByTagName( tag_name ); 

		for (var i = elements.length; i--;) { 
			transfer = utils.createElementFromString( templates[ tag_name ].replace('{content}', elements[i].innerHTML) ); 
			attributes = elements[i].attributes; 

			for (var j = attributes.length - 1; j >= 0; j--) { 
				transfer.setAttribute( attributes[j].name, attributes[j].value ); 
			} 

			utils.replaceElement(elements[i], transfer)
		} 
	} 

	fs.writeFile("dirty/test.xml", root.outerHTML , function(err) {
	    console.log("The file was saved!");
	});  
});

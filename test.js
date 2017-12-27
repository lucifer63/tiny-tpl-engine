var fs = require('fs');

fake_json = fs.readFileSync('tiny-tpl-engine.cfg', 'utf-8');

//reg = new RegExp('\\{1}', 'g');

//fake_json = fake_json.replace(reg, 'asd');

eval('s = ' + fake_json);

fs.writeFileSync('temp.txt', JSON.stringify(s), 'utf-8');



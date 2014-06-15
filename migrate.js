var fs = require('fs');
var path = require('path');
var basedir = path.join('json', 'mly', '8');

var mly = {};

fs.readdirSync(basedir).forEach(function(file) {
  var arr = file.substr(0, file.indexOf('.')).split('-');
  var country = arr[0];
  var num = arr[1];
  if (!mly[country]) {
    mly[country] = {};
  }

  mly[country][num] = JSON.parse(fs.readFileSync(path.join(basedir, file)));
});

fs.writeFileSync(path.join('json', 'mly-8.json'), JSON.stringify(mly));

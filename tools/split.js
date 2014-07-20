var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var mlyFiles = fs.readdirSync(path.join('json', 'mly', '8'));

// normalize

function normalize(filePath) {
  fs.writeFileSync(filePath, fs.readFileSync(filePath, {encoding: 'utf-8'}).replace('臺', '台', 'g'));
}

normalize(path.join('json', 'twVote1982.geo.json'));
normalize(path.join('json', 'twVillage1982.geo.json'));
normalize(path.join('json', 'twVote1982.geo.json'));
mlyFiles.forEach(function(mlyFile) {
  normalize(path.join('json', 'mly', '8', mlyFile));
});

var voteInfo = JSON.parse(fs.readFileSync(path.join('json', 'twVote1982.geo.json')));
var counties = [];

voteInfo.features.forEach(function(f) {
  var area = {
    'type': 'FeatureCollection',
    'features': [f]
  };
  counties.push([f.properties.county, '-', f.properties.number].join(''));
  fs.writeFileSync(path.join('json', 'twVote1982',
    [f.properties.county, '-', f.properties.number, '.json'].join('')),
    JSON.stringify(area));
});

fs.writeFileSync(path.join('json', 'counties.json'), JSON.stringify(counties));

var villagesGeojson = JSON.parse(fs.readFileSync(path.join('json', 'twVillage1982.geo.json')));
var villages = {};
villagesGeojson.features.forEach(function(f) {
  villages[f.properties.name] = f;
});


mlyFiles.forEach(function(file) {
  var mly = JSON.parse(fs.readFileSync(path.join('json', 'mly', '8', file)));
  Object.keys(mly['投票狀況']).forEach(function(town) {
    Object.keys(mly['投票狀況'][town]).forEach(function(village) {
      var name = [mly['選區'][0], town, village].join('/');
      if (villages[name]) {
        var area = {
          'type': 'FeatureCollection',
          'features': [villages[name]]
        };

        var dirPath = path.join('json', 'twVillage1982',
          file.substring(0, file.indexOf('.')), mly['選區'][0], town);
        mkdirp.sync(dirPath);
        fs.writeFileSync(
          path.join(dirPath, village + '.json'), JSON.stringify(area)
        );
      } else {
        console.log("name not found: " + name);
      }
    })
  })

})

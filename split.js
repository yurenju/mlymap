var fs = require('fs');
var path = require('path');

var voteInfo = JSON.parse(fs.readFileSync(path.join('json', 'twVote1982.geo.json')));
var counties = [];

voteInfo.features.forEach(function(f) {
  var area = {
    'type': 'FeatureCollection',
    'features': f
  };
  counties.push([f.properties.county, '-', f.properties.number].join(''));
  fs.writeFileSync(path.join('json', 'twVote1982',
    [f.properties.county, '-', f.properties.number, '.json'].join('')),
    JSON.stringify(area));
});

fs.writeFileSync(path.join('json', 'counties.json'), JSON.stringify(counties));
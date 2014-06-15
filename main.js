var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

function getWinner(voteInfo) {
  var winner = {};

  var arr = voteInfo['小記']['總計']['得票數'];
  var index = arr.indexOf(Math.max.apply(this,arr));
  winner.name = voteInfo['候選人'][index][1];
  winner.party = voteInfo['候選人'][index][2];
  winner.ratio = (voteInfo['小記']['總計']['得票率'][index] * 100).toFixed(2);
  winner.count = voteInfo['小記']['總計']['得票數'][index];
  return winner;
}

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
  if (props) {
    var winner = getWinner(props.vote);
      this._div.innerHTML = '<h4>立委選區資訊</h4>' +
      '<b>' + props.name + '</b><br />' +
      '當選人與政黨：' + winner.name + '（' + winner.party + '）<br />' +
      '得票狀況：' + winner.count  + ' 票（' + winner.ratio + '%）';
  }
};

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function style(feature) {
  return {
    fillColor: '#729fcf',
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

var map = L.map('map').setView([23.599, 121.108], 7);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

$.when(
  $.getJSON('json/twVote1982.geo.json'),
  $.getJSON('json/mly-8.json')
).then(function(json1, json2) {
  var vote = json1[0];
  var mly = json2[0];
  vote.features.forEach(function(f) {
    f.properties.vote = mly[f.properties.county][f.properties.number];
  });
  geojson = L.geoJson(vote, {
      style: style,
      onEachFeature: onEachFeature
  }).addTo(map);
});

info.addTo(map);


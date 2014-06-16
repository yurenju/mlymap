var info = L.control();
var geojson;

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
  if (props) {
    var winner = getWinner(props.vote);
    this._div.innerHTML = '<h4>立委選區資訊</h4>' +
    '<b>' + props.name + '</b><br />' +
    '當選人與政黨：' + winner.name + '（' + winner.party + '）<br />' +
    '得票狀況：' + winner.count  + ' 票（' + winner.ratio.toFixed(2) + '%）';
  }
};

function getWinner(voteInfo) {
  var winner = {};

  var arr = voteInfo['小記']['總計']['得票數'];
  var index = arr.indexOf(Math.max.apply(this,arr));
  winner.name = voteInfo['候選人'][index][1];
  winner.party = voteInfo['候選人'][index][2];
  winner.ratio = (voteInfo['小記']['總計']['得票率'][index] * 100);
  winner.count = voteInfo['小記']['總計']['得票數'][index];
  return winner;
}

function getColor(winner) {
  if (winner.party === '中國國民黨') {
    if (winner.ratio > 40) {
      return '#045a8d';
    } else if(winner.ratio > 30)  {
      return '#2b8cbe';
    }
    else if(winner.ratio > 20)  {
      return '#74a9cf';
    }
    else if(winner.ratio > 10)  {
      return '#bdc9e1';
    } else {
      return '#f1eef6';
    }
  } else if(winner.party === '民主進步黨') {
    if (winner.ratio > 40) {
      return '#006d2c';
    } else if (winner.ratio > 30) {
      return '#2ca25f';
    } else if (winner.ratio > 20) {
      return '#66c2a4';
    } else if (winner.ratio > 10) {
      return '#b2e2e2'
    } else {
      return '#edf8fb';
    }
  } else {
    return '#dd1c77';
  }
}

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
  highlightFeature(e);
}

function style(feature) {
  return {
    fillColor: getColor(getWinner(feature.properties.vote)),
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

var map = L.map('map').setView([23.599, 121.108], 8);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);


$.getJSON('json/counties.json').then(function(data) {
  var votePromises = $.map(data, function(value) {
    return $.getJSON('json/twVote1982');
  });

  $.when.apply($, votePromises).then(function() {
    $.each()
  })
});

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
  $('#notification').hide();
});

info.addTo(map);


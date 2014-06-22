var info = L.control();
var districtsLayer;
var villageLayer;
var zoomLevel = 0;
var levels = [];

const DEFAULT_LATITUDE = [23.599, 121.108];
const DEFAULT_ZOOM = 8;

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
  if (props) {
    var winner = getWinner(props.vote, ['小記', '總計']);
    this._div.innerHTML = '<h4>立委選區資訊</h4>' +
    '<b>' + props.name + '</b><br />' +
    '當選人與政黨：' + winner.name + '（' + winner.party + '）<br />' +
    '得票狀況：' + winner.count  + ' 票（' + winner.ratio.toFixed(2) + '%）';
  }
};

var nav = L.control({position: 'topleft'});

nav.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'nav');
  this.update();

  return this._div;
};

nav.update = function (props) {
  this._div.innerHTML =
    '<ol class="breadcrumb">' +
    '<li id="nav-taiwan">台灣</li>' +
    (props ? '<li id="nav-town" class="active">' + props.vote['選區'][0] + '</li>' : '') +
    '</ol>';

  var home = $(this._div).find('#nav-taiwan');
  if (!props) {
    home.addClass('active');
  } else {
    home.removeClass('active');
    home.html('<a href="#">台灣</a>');
    home.find('a').click(function() {
      home.html('台灣');
      home.parent().find('#nav-town').remove();
      map.setView(DEFAULT_LATITUDE, DEFAULT_ZOOM);
      if (map.hasLayer(villageLayer)) {
        map.removeLayer(villageLayer);
        villageLayer = null;
        map.addLayer(districtsLayer);
      }
    });
  }
}


function getWinner(voteInfo, path) {
  var winner = {};
  var statistic = voteInfo;

  $.each(path, function(i, value) {
    statistic = statistic[value];
  });

  var arr = statistic['得票數'];
  var index = arr.indexOf(Math.max.apply(this, arr));
  winner.name = voteInfo['候選人'][index][1];
  winner.party = voteInfo['候選人'][index][2];
  winner.ratio = (statistic['得票率'][index] * 100);
  winner.count = statistic['得票數'][index];
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
      return '#b2e2e2';
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
  districtsLayer.resetStyle(e.target);
}

function click(e) {
  zoomToFeature(e);

  nav.update(e.target.feature.properties);
  if (villageLayer && map.hasLayer(villageLayer)) {
    map.removeLayer(villageLayer);
    villageLayer = null;
  }
  map.removeLayer(districtsLayer);
  var props = e.target.feature.properties;
  var name = props.county + '-' + props.number;
  $.each(props.vote['投票狀況'], function(townName, town) {
    $.each(town, function(villageName, village) {
      var query = 'json/twVillage1982/' + name + '/' + props.vote['選區'][0] +
        '/' + townName + '/' + villageName + '.json';
      $.getJSON(query).then(function(villageGeo) {
        villageGeo.features[0].properties.vote = props.vote;
        if (villageLayer) {
          villageLayer.addData(villageGeo);
        } else {
          villageLayer = L.geoJson(villageGeo, {
            style: style
          }).addTo(map);
        }
        setTimeout(function() {
          $('.county').each(function(i, el) {
            if (el.classList) {
              el.classList.remove('transparent');
            }
          });
        }, 100);
      });
    });
  })
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
  highlightFeature(e);
}

function style(feature) {
  var path;
  var props = feature.properties;
  if (!props.VILLAGENAM) {
    path = ['小記', '總計'];
  } else {
    path = ['投票狀況', props.TOWNNAME, props.VILLAGENAM, 0];
  }
  return {
    fillColor: getColor(getWinner(feature.properties.vote, path)),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7,
    className: 'county transparent'
  };
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: click
  });
}

var map = L.map('map', {zoomControl: false})
  .setView(DEFAULT_LATITUDE, DEFAULT_ZOOM);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

$.getJSON('json/counties.json').then(function(data) {
  var count = 0;
  $.each(data, function(i, area) {
    $.when(
      $.getJSON('json/twVote1982/' + area + '.json'),
      $.getJSON('json/mly/8/' + area + '.json')
    ).then(function(voteResult, mlyResult) {
      var voteInfo = voteResult[0];
      var mly = mlyResult[0];

      voteInfo.features[0].properties.vote = mly;
      if (districtsLayer) {
        districtsLayer.addData(voteInfo);
      } else {
        districtsLayer = L.geoJson(voteInfo, {
          style: style,
          onEachFeature: onEachFeature
        }).addTo(map);
      }
      setTimeout(function() {
        $('.county').each(function(i, el) {
          if (el.classList) {
            el.classList.remove('transparent');
          } else if (el.getAttribute && el.getAttribute('class')) {
          	// workaround for IE 10
          	el.setAttribute('class', el.getAttribute('class').replace('transparent', ''));
          }
        });
      }, 100);
      count++;
      if (count >= data.length) {
        $('#notification').fadeOut();
      }
    });
  });
});

new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

info.addTo(map);
nav.addTo(map);

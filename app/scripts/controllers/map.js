'use strict';

var MAP_DEFAULT_VIEW = {
  lat: 23.599,
  lng: 121.108,
  zoom: 8
};

/**
 * @ngdoc function
 * @name mlymapApp.controller:MapCtrl
 * @description
 * # MapCtrl
 * Controller of the mlymapApp
 */
angular.module('mlymapApp')
  .controller('MapCtrl',
  ['$scope', '$http', '$q', '$filter', 'leafletData', 'voteInfoService',
  function ($scope, $http, $q, $filter, leafletData, voteInfoService) {
    function getColor(feature) {
      var area = [];
      if (!$scope.selectedDistrictName) {
        area.push(feature.properties.county + '-' +
          feature.properties.number);
      } else {
        area.push($scope.selectedDistrictName)
      }

      if (feature.properties.TOWNNAME) {
        area.push(feature.properties.TOWNNAME);
      }
      if (feature.properties.VILLAGENAM) {
        area.push(feature.properties.VILLAGENAM);
      }

      var winner = voteInfoService.getWinner(area);
      var defaultColor = '#dd1c77';

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
        return defaultColor;
      }
    }

    function animate() {
      setTimeout(function() {
        $('.county').each(function(i, el) {
          if (el.classList) {
            el.classList.remove('transparent');
          } else if (el.getAttribute && el.getAttribute('class')) {
            // workaround for IE 10
            el.setAttribute('class',
              el.getAttribute('class').replace('transparent', ''));
          }
        });
      }, 100);
    }

    function style(feature) {
      return {
        fillColor: getColor(feature),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        className: 'county transparent'
      };
    }

    function applyGeojson(json) {
      if (!$scope.geojson) {
        $scope.geojson = {
          data: json,
          style: style,
          resetStyleOnMouseout: true
        }
      } else {
        $scope.leafletData.getGeoJSON().then(function(localGeojson) {
          localGeojson.addData(json);
        });
      }
      animate();
    };

    function zoomToVillage(voteInfo, name) {
      angular.forEach(voteInfo['投票狀況'], function(town, townName) {
        angular.forEach(town, function(village, villageName) {
          var query = 'json/twVillage1982/' + name + '/' + voteInfo['選區'][0] +
            '/' + townName + '/' + villageName + '.json';
          $http.get(query).then(function(res) {
            applyGeojson(res.data);
          });
        })
      })
    }

    // Mouse over function, called from the Leaflet Map Events
    function areaMouseover(ev, leafletEvent) {
      var layer = leafletEvent.target;
      layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });
      layer.bringToFront();
    }

    function areaClick(ev, featureSelected, leafletEvent) {
      if ($scope.selectedDistrictName) {
        return;
      }
      var props = leafletEvent.target.feature.properties;
      var name = props.county + '-' + props.number;
      $scope.selectedDistrictName = name;
      leafletData.getMap().then(function(map) {
        map.fitBounds(leafletEvent.target.getBounds());
        $scope.geojson = null;
        zoomToVillage($scope.voteInfos[name], name);
      });
    }

    function getWinnerByProperty(property) {
      var path = [];
      if (!property) {
        return '--'
      }

      if ($scope.selectedDistrictName) {
        path.push($scope.selectedDistrictName, property.TOWNNAME,
          property.VILLAGENAM);
      } else {
        path.push(property.county + '-' + property.number);
      }

      return voteInfoService.getWinner(path);
    }

    $scope.getWinnerName = function (property, showParty) {
      var winner = getWinnerByProperty(property);
      if (typeof winner === 'string') {
        return winner;
      }

      var res = winner.name;
      if (showParty) {
        res += '（' + winner.party + '）';
      }
      return res;
    };

    $scope.getWinnerRatio = function (property, showPercent) {
      var winner = getWinnerByProperty(property);
      if (typeof winner === 'string') {
        return winner;
      }
      return $filter('number')(winner.count) + ' 票（' +
        $filter('number')(winner.ratio, 2) +  '%）';
    };

    $scope.debug = function() {
      debugger;
    };

    $scope.back = function() {
      delete $scope.selectedDistrictName;
      delete $scope.geojson;
      applyGeojson($scope.districts);
      $scope.taiwan = MAP_DEFAULT_VIEW;
    };

    $scope.leafletData = leafletData;
    $scope.taiwan = MAP_DEFAULT_VIEW;
    $scope.defaults = {
      zoomControlPosition: 'bottomright'
    };

    $scope.$on("leafletDirectiveMap.geojsonMouseover", areaMouseover);
    $scope.$on("leafletDirectiveMap.geojsonClick", areaClick);

    voteInfoService.getAllVoteInfo().then(
      function(res) {},
      function (error) {},
      function (voteInfo) {
        if (!$scope.voteInfos) {
          $scope.voteInfos = {};
        }
        $scope.voteInfos[voteInfo.id] = voteInfo.content;
        var jsonPath = 'json/twVote1982/' + voteInfo.id + '.json';
        $http.get(jsonPath).then(function(res) {
          if (!$scope.districts) {
            $scope.districts = res.data;
          } else {
           $scope.districts.features.push(res.data.features[0]);
          }
          applyGeojson(res.data);
        });
      }
    );
  }]);

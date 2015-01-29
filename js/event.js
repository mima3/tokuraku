var width = 800;
var height = 600;
var vbox_x = 0;
var vbox_y = 0;
var vbox_default_width = vbox_width = 500;
var vbox_default_height = vbox_height = 500;
var projection = d3.geo.mercator()
   .center([139.700, 35.550])
   .scale(500000)
   .translate([width / 2, height / 2]);

var chartBubble;
var pieChartCategory = dc.pieChart('#category');

var ndx;
var dimId;
var dimCategory;
var dimDate;

var swlat = 35.45;
var swlng = 139.4;
var nelat = 35.7;
var nelng = 139.81;

// dc.bubbleOverlay
var plotter = function (root, chartGroup) {
    var BUBBLE_OVERLAY_CLASS = 'bubble-overlay';
    var BUBBLE_NODE_CLASS = 'node';
    var BUBBLE_CLASS = 'bubble';

    var _chart = dc.bubbleMixin(dc.baseMixin({}));
    _chart.MIN_RADIUS = 1; // 強制的に書き換え
    var _g;
    var _points = [];

    _chart.transitionDuration(750);

    _chart.radiusValueAccessor(function (d) {
        return d.value;
    });

    /**
    #### .point(name, x, y) - **mandatory**
    Set up a data point on the overlay. The name of a data point should match a specific 'key' among
    data groups generated using keyAccessor.  If a match is found (point name <-> data group key)
    then a bubble will be generated at the position specified by the function. x and y
    value specified here are relative to the underlying svg.

    **/
    _chart.point = function (name, x, y) {
        _points.push({name: name, x: x, y: y});
        return _chart;
    };

    _chart._doRender = function () {
        _g = initOverlayG();

        _chart.r().range([_chart.MIN_RADIUS, _chart.width() * _chart.maxBubbleRelativeSize()]);

        initializeBubbles();

        _chart.fadeDeselectedArea();

        return _chart;
    };

    function initOverlayG() {
        _g = _chart.select('g.' + BUBBLE_OVERLAY_CLASS);
        if (_g.empty()) {
            _g = _chart.svg().append('g').attr('class', BUBBLE_OVERLAY_CLASS);
        }
        return _g;
    }

    function initializeBubbles() {
        var data = mapData();

        _points.forEach(function (point) {
            var nodeG = getNodeG(point, data);

            var circle = nodeG.select('circle.' + BUBBLE_CLASS);

            if (circle.empty()) {
                circle = nodeG.append('circle')
                    .attr('class', BUBBLE_CLASS)
                    .attr('r', 0)
                    .attr('fill', _chart.getColor)
                    .on('click', _chart.onClick);
            }

            dc.transition(circle, _chart.transitionDuration())
                .attr('r', function (d) {
                    return _chart.bubbleR(d);
                });

            _chart._doRenderLabel(nodeG);

            _chart._doRenderTitles(nodeG);
        });
    }

    function mapData() {
        var data = {};
        _chart.data().forEach(function (datum) {
            data[_chart.keyAccessor()(datum)] = datum;
        });
        return data;
    }

    function getNodeG(point, data) {
        var bubbleNodeClass = BUBBLE_NODE_CLASS + ' ' + dc.utils.nameToId(point.name);

        var nodeG = _g.select('g.' + dc.utils.nameToId(point.name));

        if (nodeG.empty()) {
            nodeG = _g.append('g')
                .attr('class', bubbleNodeClass)
                .attr('transform', 'translate(' + point.x + ',' + point.y + ')');
        }

        nodeG.datum(data[point.name]);

        return nodeG;
    }

    _chart._doRedraw = function () {
        updateBubbles();

        _chart.fadeDeselectedArea();

        return _chart;
    };

    function updateBubbles() {
        var data = mapData();

        _points.forEach(function (point) {
            var nodeG = getNodeG(point, data);

            var circle = nodeG.select('circle.' + BUBBLE_CLASS);

            dc.transition(circle, _chart.transitionDuration())
                .attr('r', function (d) {
                    return _chart.bubbleR(d);
                })
                .attr('fill', _chart.getColor);

            _chart.doUpdateLabels(nodeG);

            _chart.doUpdateTitles(nodeG);
        });
    }

    _chart.debug = function (flag) {
        if (flag) {
            var debugG = _chart.select('g.' + dc.constants.DEBUG_GROUP_CLASS);

            if (debugG.empty()) {
                debugG = _chart.svg()
                    .append('g')
                    .attr('class', dc.constants.DEBUG_GROUP_CLASS);
            }

            var debugText = debugG.append('text')
                .attr('x', 10)
                .attr('y', 20);

            debugG
                .append('rect')
                .attr('width', _chart.width())
                .attr('height', _chart.height())
                .on('mousemove', function () {
                    var position = d3.mouse(debugG.node());
                    var msg = position[0] + ', ' + position[1];
                    debugText.text(msg);
                });
        } else {
            _chart.selectAll('.debug').remove();
        }

        return _chart;
    };

    _chart.anchor(root, chartGroup);

    return _chart;
};

//geoJSONのデータをパスに変換する関数を作成
var path = d3.geo.path().projection(projection);

//ステージとなるsvgを追加
var svg = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', '' + vbox_x + ' ' + vbox_y + ' ' + vbox_width + ' ' + vbox_height); //viewBox属性を付加


var svgMapGrp = svg.append('svg:g');
var svgRailroadGrp = svg.append('svg:g');
var svgStationroadGrp = svg.append('svg:g');
var svgEventGrp = svg.append('svg:g');

var line_color = {
  '東横線': '#da0042',
  '目黒線': '#009ec8',
  '田園都市線': '#00a98c',
  '大井町線': '#f08b42',
  '池上線': '#ed85a7',
  '東急多摩川線': '#ad0079',
  '世田谷線': '#ad0079',
  'こどもの国線': '#0068b6',
  'みなとみらい21線': 'blue'
};


$('#resetBtn').button().click(function() {
  // リセットボタン
  dc.renderAll();
});

$('#start_date').datepicker({ dateFormat: 'yy/mm/dd' });
$('#end_date').datepicker({ dateFormat: 'yy/mm/dd' });
$('#dateFilterBtn').button().click(function() {
  if (!ndx) {
    return;
  }
  var startDate = $('#start_date').val();
  var endDate = $('#end_date').val();
  console.log('click:' , startDate, endDate);
  dimDate.filter(function(d) {
    if (startDate <= d[1] && endDate >= d[0]) {
      return true;
    } else {
      return false;
    }
  });
  dc.renderAll();
});
$('#dateFilterResetBtn').button().click(function() {
  $('#start_date').val('');
  $('#end_date').val('');
  dimDate.filterAll();
  dc.renderAll();
});

var load_map = function(callback) {
  // 行政区域の表示を行う
  var api = util.format('/kokudo/json/get_administrative_district_by_geometry?swlat=%d&swlng=%d&nelat=%d&nelng=%d',
    swlat, swlng, nelat, nelng
  );
  d3.json(api, function(json) {
    svgMapGrp
       .attr('class', 'tracts')
       .selectAll('path')
       .data(json.features)
       .enter()
       .append('svg:path')
       .attr({
         'd' : path,
         'fill' : '#ccc',
         'stroke': '#eee'
       });
       //.on('click', function(d){
       //  console.log(d);
       //});
    console.log('load_map....');
    callback(null, json);
  });
};


var load_railroad = function(callback) {
  async.parallel([
    function(cb) {
      d3.json('/kokudo/json/get_railroad_section?operationCompany=東京急行電鉄', function(error, json) {
        console.log(json);
        cb(error, json);
      });
    },
    function(cb) {
      d3.json('/kokudo/json/get_railroad_section?operationCompany=横浜高速鉄道', function(error, json) {
        console.log(json);
        cb(error, json);
      });
    }
  ], function(err, ret) {
    if (err) {
      callback(err, null);
      return;
    }
    var features = [];
    features = ret[0].features.concat(ret[1].features)
    svgRailroadGrp
      .attr('class', 'tracts')
      .selectAll('path')
      .data(features)
      .enter()
      .append('svg:path')
      .attr({
        'd': path,
        'fill': 'none',
        'stroke-width': 3
      })
      .attr('stroke', function(d) {
        return line_color[d.properties.railwayLineName];
      });
      //.on('click', function(d){
      // console.log(d);
      //});

    callback(null, features);
  });
};


var load_station = function(callback) {
  async.parallel([
    function(cb) {
      d3.json('/kokudo/json/get_station?operationCompany=東京急行電鉄', function(error, json) {
        console.log(json);
        cb(error, json);
      });
    },
    function(cb) {
      d3.json('/kokudo/json/get_station?operationCompany=横浜高速鉄道', function(error, json) {
        console.log(json);
        cb(error, json);
      });
    }
  ], function(err, ret) {
    if (err) {
      callback(err, null);
      return;
    }
    var features = [];
    features = ret[0].features.concat(ret[1].features)

    svgStationroadGrp
       .attr('class', 'tracts')
       .selectAll('path')
       .data(features)
       .enter()
       .append('svg:path')
       .attr({
         'd': path,
         'fill': 'none',
         'stroke': 'black',
         'stroke-width': 5
       })
       .on('click', function(d) {
         console.log(d);
       });
    console.log('load_station....');
    callback(null, features);
  });
};



// イベント情報を読み込む
var load_event = function(callback) {
  d3.json('data/event.json', function(error, csvdata) {
    console.log('load_passenger....');
    callback(error, csvdata);
  });
};


$.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
async.parallel([
  load_map,
  load_railroad,
  load_station,
  load_event
], function(err, ret) {
  $.unblockUI();
  console.log('parallel....');
  console.log(err);
  console.log(ret);
  var event_list = ret[3];
  ndx = crossfilter(event_list);

  dimId = ndx.dimension(function(d) {
    return d.id;
  });

  dimDate = ndx.dimension(function(d) {
    return [d.start_date, d.end_date];
  });

  dimCategory = ndx.dimension(function(d) {
    return d.category;
  });

  var gpCategory = dimCategory.groupAll().reduce(
    function(p, v) {
      v.category.forEach (function(val, idx) {
         p[val] = (p[val] || 0) + 1; //increment counts
      });
      return p;
    },
    function (p, v) {
      v.category.forEach (function(val, idx) {
         p[val] = (p[val] || 0) - 1; //decrement counts
      });
      return p;
    },
    function (p, v) {
      return {};
    }
  ).value();
  // hack to make dc.js charts work
  gpCategory.all = function() {
    var newObject = [];
    for (var key in this) {
      if (this.hasOwnProperty(key) && key != 'all' && key != 'top') {
        newObject.push({
          key: key,
          value: this[key]
        });
      }
    }
    return newObject;
  };
  gpCategory.top = function(top) {
    var ret = gpCategory.all();
    return ret;
  };

  // カテゴリ―グラフ
  pieChartCategory
    .width(370)
    .height(220)
    .cx(160)
    .dimension(dimCategory)
    .group(gpCategory)
    .slicesCap(20)
    .innerRadius(35)
    .legend(dc.legend())
    .keyAccessor(function(d) {
      return d.key;
    })
    .valueAccessor(function(d) {
      return d.value;
    })
    .filterHandler(function(dimension, filter){
      dimension.filter(function(d) {
        return pieChartCategory.filter() != null ? d.indexOf(pieChartCategory.filter()) >= 0 : true;
      }); // perform filtering
      return filter; // return the actual filter value
    })
    .title(function(d) {
      return d.key;
    })
    .on('postRedraw', function(chart, filter) {
      $.unblockUI();
      console.log('postRedraw');
    })
    .render();

    var baseClickHandler = pieChartCategory.onClick
    pieChartCategory.onClick = function(d) {
      // 待機用の画面表示
      $.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
      console.log('click');
      setTimeout(function() {
        baseClickHandler(d);
        console.log('end');
      }, 0)
    }

    /*
  var baseClickHandler = pieChartCategory.onClick
  pieChartCategory.onClick = function (d) {
    setInterval(function() {
      baseClickHandler(d);
      console.log('end');
    }, 0)
    return true;
  };
  */

  // 地図へのプロット
  chartBubble = plotter('#map').svg(d3.select('#map svg'));
  chartBubble
    .width(width)
    .height(height)
    .dimension(dimId)
    .group(dimId.group())
    .radiusValueAccessor(function(d, i) {
      return d.value;
    })
    .title(function(d) {
      return "TEST"; // d.key + ' 一日平均の乗降人数:' + util.numberSeparator(x);
    })
    .label(function(d) {
      return '';
    })
    .colors(function(d) {
      return 'blue';
    });

  for (var i = 0; i < event_list.length; ++i) {
    var pt = projection([event_list[i].place_longitude, event_list[i].place_latitude]);
    chartBubble.point(event_list[i].id, pt[0], pt[1]);
  }
  chartBubble.onClick = function(d) {
    // クリックを無効にしておく。
    // 場所による検索はあまり意味がないので。
    console.log('click' ,d);
  };

  chartBubble.render();
  /*
  svgEventGrp
    .selectAll('circle')
    .data(event_list)
    .enter()
    .append('circle')
    .attr('cx', function(d, i) {
      var pt = projection([d.place_longitude, d.place_latitude]);
      return pt[0];
    })
    .attr('cy', function(d) {
      var pt = projection([d.place_longitude, d.place_latitude]);
      return pt[1];
    })
    .attr('r', function(d) {
      return 10;
    })
    .attr('fill' , '#00f');
    */
});


// ドラッグによる移動
var drag = d3.behavior.drag().on('drag', function(d) {
  vbox_x -= d3.event.dx;
  vbox_y -= d3.event.dy;
  return svg.attr('translate', '' + vbox_x + ' ' + vbox_y);
});
svg.call(drag);

// ズーム処理
zoom = d3.behavior.zoom().on('zoom', function(d) {
  var befere_vbox_width, before_vbox_height, d_x, d_y;
  befere_vbox_width = vbox_width;
  before_vbox_height = vbox_height;
  vbox_width = vbox_default_width * d3.event.scale;
  vbox_height = vbox_default_height * d3.event.scale;
  d_x = (befere_vbox_width - vbox_width) / 2;
  d_y = (before_vbox_height - vbox_height) / 2;
  vbox_x += d_x;
  vbox_y += d_y;
  return svg.attr('viewBox', '' + vbox_x + ' ' + vbox_y + ' ' + vbox_width + ' ' + vbox_height);  //svgタグのviewBox属性を更新
});
svg.call(zoom);

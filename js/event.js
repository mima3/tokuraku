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
var monthlyChart = dc.rowChart('#monthly');

var event_list;
var ndx;
var dimId;
var dimCategory;
var dimMonthly;
var dimDate;

// 範囲
var swlat = 35.45;
var swlng = 139.4;
var nelat = 35.7;
var nelng = 139.81;

// ツールチップ
var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function (d) {
    var n;
    for (var i = 0 ; i < event_list.length; ++i) {
      if (event_list[i].id == d.key) {
        n = event_list[i];
        break;
      }
    }
    if (!n) {
      return;
    }
    return $('#tooltipTmpl').render(n);
  }
);

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
    .attr("overflow", "hidden") // IE系は指定しないとはみ出る
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', '' + vbox_x + ' ' + vbox_y + ' ' + vbox_width + ' ' + vbox_height); //viewBox属性を付加


var svgMapGrp = svg.append('svg:g');
var svgRailroadGrp = svg.append('svg:g');
var svgStationroadGrp = svg.append('svg:g');


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
  dimDate.filterAll();
  pieChartCategory.filterAll();
  monthlyChart.filterAll();
  dc.renderAll();
});


// 日付フィルター処理
$('#start_date').datepicker({ dateFormat: 'yy/mm/dd' });
$('#end_date').datepicker({ dateFormat: 'yy/mm/dd' });
$('#dateFilterBtn').button().click(function() {
  if (!ndx) {
    return;
  }
  var startDate = $('#start_date').val();
  var endDate = $('#end_date').val();
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
  // 路線情報の取得
  async.parallel([
    function(cb) {
      d3.json(encodeURI('/kokudo/json/get_railroad_section?operationCompany=東京急行電鉄'), function(error, json) {
        console.log(json);
        cb(error, json);
      });
    },
    function(cb) {
      d3.json(encodeURI('/kokudo/json/get_railroad_section?operationCompany=横浜高速鉄道'), function(error, json) {
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
    callback(null, features);
  });
};


var load_station = function(callback) {
  // 駅情報の取得
  async.parallel([
    function(cb) {
      d3.json(encodeURI('/kokudo/json/get_station?operationCompany=東京急行電鉄'), function(error, json) {
        console.log(json);
        cb(error, json);
      });
    },
    function(cb) {
      d3.json(encodeURI('/kokudo/json/get_station?operationCompany=横浜高速鉄道'), function(error, json) {
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
  event_list = ret[3];
  ndx = crossfilter(event_list);

  dimId = ndx.dimension(function(d) {
    return d.id;
  });

  dimDate = ndx.dimension(function(d) {
    return [d.start_date, d.end_date];
  });

  // カテゴリーによる分類
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
  gpCategory.top = gpCategory.all;


  // カテゴリ―グラフ
  pieChartCategory
    .width(370)
    .height(220)
    .cx(160)
    .dimension(dimCategory)
    .group(gpCategory)
    .ordering(function(t){
      return -t.value;
    })
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
        if (pieChartCategory.filters().length == 0) {
          return true;
        }
        for (var i = 0; i < pieChartCategory.filters().length; ++i) {
          if (d.indexOf(pieChartCategory.filters()[i]) >= 0) {
            return true;
          }
        }
        return false;
      }); // perform filtering
      return filter; // return the actual filter value
    })
    .title(function(d) {
      return d.key + ':' + d.value;
    })
    .on('postRedraw', function(chart, filter) {
      $.unblockUI();
    })
    .render();

  var basePieChartCategoryClickHandler = pieChartCategory.onClick;
  pieChartCategory.onClick = function(d) {
    // 待機用の画面表示
    $.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
    setTimeout(function() {
      basePieChartCategoryClickHandler(d);
    }, 0)
  }


  // 月別のグラフ
  dimMonthly= ndx.dimension(function(d) {
    return [d.start_date, d.end_date];
  });
  var gpMonthly = dimMonthly.groupAll().reduce(
    function(p, v) {
      for (var i = 0; i < p.list.length; ++i) {
        if (v.end_date < p.list[i].start) {
          // 当月より前に終わっている
          continue;
        }
        if (v.start_date > p.list[i].last) {
          // 当月にはまだ始まっていない
          continue;
        }
        p.list[i].count += 1;
      }
      return p;
    },
    function (p, v) {
      for (var i = 0; i < p.list.length; ++i) {
        if (v.end_date < p.list[i].start) {
          // 当月より前に終わっている
          continue;
        }
        if (v.start_date > p.list[i].last) {
          // 当月にはまだ始まっていない
          continue;
        }
        p.list[i].count -= 1;
      }
      return p;
    },
    function (p, v) {
      var extStartDate = d3.extent(event_list, function(d) { return d.start_date;});
      var extEndDate = d3.extent(event_list, function(d) { return d.end_date;});
      var start = new Date(extStartDate[0]);
      var dateFormat = new DateFormat("yyyy/MM/dd");
      start.setDate(1);
      var end = new Date(extEndDate[1]);
      var values = [];
      while (start < end) {
        var last = new Date(start);
        last.setMonth(last.getMonth() + 1);
        last.setDate(0);
        values.push({start: dateFormat.format(start), last: dateFormat.format(last), count:0});
        start.setMonth(start.getMonth() + 1);
      }
      return {list:values};
    }
  ).value();
  gpMonthly.all = function() {
    return this.list;
  };
  gpMonthly.top = gpCategory.all;
  monthlyChart
    .width(300)
    .height(600)
    .margins({
      top: 5, left: 10, right: 10, bottom: 20
    })
    .dimension(dimMonthly)
    .group(gpMonthly)
    .colors(d3.scale.category10())
    .valueAccessor(function(d, i) {
      return d.count;
    })
    .keyAccessor(function(d, i) {
      return d.start;
    })
    .label(function(d, i) {
      return d.start;
    })
    .title(function(d, i) {
      return d.start + ':' + d.count;
    })
    .filterHandler(function(dimension, filter){
      dimension.filter(function(d) {
        if (monthlyChart.filters().length == 0) {
          return true;
        }
        for (var i = 0; i < monthlyChart.filters().length; ++i) {
          var chkMonth = monthlyChart.filters()[i].substr(0,7);
          if (chkMonth <= d[1].substr(0,7) && chkMonth >= d[0].substr(0,7)) {
            return true;
          }
        }
        return false;
      }); // perform filtering
      return filter; // return the actual filter value
    })
    .elasticX(true)
    .xAxis().ticks(4);
  monthlyChart.render();

  var baseMonthlyChartClickHandler = monthlyChart.onClick;
  monthlyChart.onClick = function(d) {
    // 待機用の画面表示
    $.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
    setTimeout(function() {
      baseMonthlyChartClickHandler(d);
    }, 0)
  }


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
      return '';
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
    tip.show(d)
  };
  chartBubble.render();
  d3.selectAll(".node").call(tip);

});


// ドラッグによる移動
var drag = d3.behavior.drag().on('drag', function(d) {
  tip.hide();
  vbox_x -= d3.event.dx;
  vbox_y -= d3.event.dy;
  return svg.attr('translate', '' + vbox_x + ' ' + vbox_y);
});
svg.call(drag);

// ズーム処理
zoom = d3.behavior.zoom().on('zoom', function(d) {
  tip.hide();
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

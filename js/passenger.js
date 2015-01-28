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
var rowChartYear = dc.rowChart("#year");
var pieChartCommuterPass = dc.pieChart("#commuterPass");
var dimYear;
var dimStation;
var dimType;

var swlat = 35.45;
var swlng = 139.4;
var nelat = 35.7;
var nelng = 139.81;


//geoJSONのデータをパスに変換する関数を作成
var path = d3.geo.path().projection(projection); 

//ステージとなるsvgを追加
var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", "" + vbox_x + " " + vbox_y + " " + vbox_width + " " + vbox_height); //viewBox属性を付加


var svgMapGrp = svg.append("svg:g");
var svgMeshGrp = svg.append("svg:g");
var svgBusGrp = svg.append("svg:g");
var svgTrainGrp = svg.append("svg:g");
var svgRailroadGrp = svg.append("svg:g");
var svgStationroadGrp = svg.append("svg:g");
var line_color = {
  '東横線': '#da0042',
  '目黒線': '#009ec8',
  '田園都市線': '#00a98c',
  '大井町線': '#f08b42',
  '池上線': '#ed85a7',
  '東急多摩川線': '#ad0079',
  '世田谷線': '#ad0079',
  'こどもの国線': '#0068b6',
  'みなとみらい線': 'blue',
};

var stat_dict = {
  'T000608' : {id:'T000608', attrval: '人口総数'},
  'T000616_people' : {id:'T000616', attrval: '全産業従業者数'},
  'T000616_business' : {id:'T000616', attrval: '全産業事業所数'}
};

var transportation_dict = {
  'bus' : {
    api: util.format('/kokudo/json/get_bus_route_by_geometry?swlat=%d&swlng=%d&nelat=%d&nelng=%d',
      swlat, swlng, nelat, nelng
    ),
    graph: svgBusGrp,
    color: '#040'
  },
  'train' : {
    api: util.format('/kokudo/json/get_railroad_section_by_geometry?swlat=%d&swlng=%d&nelat=%d&nelng=%d',
      swlat, swlng, nelat, nelng
    ),
    graph: svgTrainGrp,
    color: '#00F'
  }
};

$('#resetBtn').button().click(function() {
  // リセットボタン
  if (chartBubble) {
    chartBubble.filterAll();
  }
  rowChartYear.filterAll();
  pieChartCommuterPass.filterAll();
  dc.renderAll();
});


// メッシュの選択
$('#selMesh').select2({
  width: 'resolve' ,
  dropdownAutoWidth: true
});

$('#selMesh').change(function() {
  svgMeshGrp
     .attr("class", "tracts")
     .selectAll("rect")
     .data([])
     .exit()
     .remove();

  var sel = $('#selMesh').val();
  if (!sel) {
    return;
  }

  function drawMesh(json) {
    console.log(json);
    var max = 0;
    for (var i=0 ; i < json.features.length; ++i) {
      var v = parseInt(json.features[i].properties.value)
      if (max < v) {
        max = v;
      }
    }
    console.log(max);
    var colorScale = d3.scale.linear().domain([0, max]).range([0.0, 0.8]);
    svgMeshGrp
       .attr("class", "tracts")
       .selectAll("rect")
       .data(json.features)
       .enter()
       .append("rect")
       .attr("x", function(d, i) {
         var extX = d3.extent(d.geometry.coordinates[0], function (d) { return d[0];});
         var extY = d3.extent(d.geometry.coordinates[0], function (d) { return d[1];});
         var pt = projection([extX[0], extY[0]]);
         return pt[0];
       })
       .attr("y", function(d) {
         var extX = d3.extent(d.geometry.coordinates[0], function (d) { return d[0];});
         var extY = d3.extent(d.geometry.coordinates[0], function (d) { return d[1];});
         var pt = projection([extX[0], extY[0]]);
         return pt[1];
       })
       .attr("width", function(d) {
         var extX = d3.extent(d.geometry.coordinates[0], function (d) { return d[0];});
         var extY = d3.extent(d.geometry.coordinates[0], function (d) { return d[1];});
         var ptMin = projection([extX[0], extY[0]]);
         var ptMax = projection([extX[1], extY[1]]);
         return Math.abs(ptMax[0] - ptMin[0]);
       })
       .attr("height", function(d) {
         var extX = d3.extent(d.geometry.coordinates[0], function (d) { return d[0];});
         var extY = d3.extent(d.geometry.coordinates[0], function (d) { return d[1];});
         var ptMin = projection([extX[0], extY[0]]);
         var ptMax = projection([extX[1], extY[1]]);
         return Math.abs(ptMax[1] - ptMin[1]);
       })
       .attr("fill-opacity", function(d) {
         console.log('color' , d.properties.value, colorScale(d.properties.value));
         return colorScale(d.properties.value);
       })
       .attr("fill" , "#00f");
  }

  if (stat_dict[sel].json) {
    drawMesh(stat_dict[sel].json);
  } else {
    $.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
    var api = util.format('/estat/json/get_population?swlat=%d&swlng=%d&nelat=%d&nelng=%d&stat_id=%s&attr_value=%s',
      swlat, swlng, nelat, nelng, stat_dict[sel].id, stat_dict[sel].attrval
    );
    d3.json(api, function(json) {
      drawMesh(json);
      stat_dict[sel].json = json;
      $.unblockUI();
    });
  }
}).keyup(function() {
  $(this).blur().focus();
});


// 交通機関の選択
$('#selTransportationFacilities').select2({
  width: '300px'
});
$('#selTransportationFacilities').change(function() {
  svgBusGrp
     .selectAll("path")
     .data([])
     .exit()
     .remove();

  svgTrainGrp
     .selectAll("path")
     .data([])
     .exit()
     .remove();

  function drawTransportation(graph, json, color) {
    graph
      .selectAll("path")
      .data(json.features)
      .enter()
      .append("svg:path")
      .attr({
        "d": path,
        "fill": "none",
        "stroke": color,
        "stroke-width": 1
      })

  }

  var lt = $('#selTransportationFacilities').val();
  if (!lt) {
    return;
  }
  var blocklist = [];
  lt.forEach(function(item){
    var info = transportation_dict[item];
    if (transportation_dict[item].json) {
      drawTransportation(
        transportation_dict[item].graph,
        transportation_dict[item].json,
        transportation_dict[item].color
      );
    } else {
      $.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
      blocklist.push(true);
      d3.json(info.api, function(json) {
        console.log('transportation:' , json);
        transportation_dict[item].json = json;
        drawTransportation(
          transportation_dict[item].graph,
          transportation_dict[item].json,
          transportation_dict[item].color
        );
        var x = blocklist.pop();
        if (blocklist.length == 0) {
          $.unblockUI();
        }
      });
    }
  });
}).keyup(function() {
  $(this).blur().focus();
});


var load_map = function(callback) {
  // 行政区域の表示を行う
  var api = util.format('/kokudo/json/get_administrative_district_by_geometry?swlat=%d&swlng=%d&nelat=%d&nelng=%d',
    swlat, swlng, nelat, nelng
  );
  d3.json(api, function(json) {
    svgMapGrp
       .attr("class", "tracts")
       .selectAll("path")
       .data(json.features)
       .enter()
       .append("svg:path")
       .attr({
         "d" : path,
         "fill" : "#ccc",
         "stroke": "#eee"
       })
       //.on("click", function(d){
       //  console.log(d);
       //});
    console.log('load_map....');
    callback(null, json);
  });
};


var load_railroad = function(callback) {
  // 東京急行電鉄管理下の路線情報を取得
  d3.json("/kokudo/json/get_railroad_section?operationCompany=東京急行電鉄", function(error, json) { 
    svgRailroadGrp
      .attr("class", "tracts")
      .selectAll("path")
      .data(json.features)
      .enter()
      .append("svg:path")
      .attr({
        "d": path,
        "fill": "none",
        "stroke-width": 3
      })
      .attr('stroke', function(d) {
        return line_color[d.properties.railwayLineName];
      })
      //.on("click", function(d){
      // console.log(d);
      //});
    console.log('load_railroad....');
    callback(null, json);
  });
};


var load_station = function(callback) {
  // 東京急行電鉄管理下の駅情報を取得
  d3.json("/kokudo/json/get_station?operationCompany=東京急行電鉄", function(error, json) { 
    svgStationroadGrp
       .attr("class", "tracts")
       .selectAll("path")
       .data(json.features)
       .enter()
       .append("svg:path")
       .attr({
         "d": path,
         "fill": "none",
         "stroke": "red",
         "stroke-width": 5
       })
       .on("click", function(d){
         console.log(d);
       });
    console.log('load_station....');
    callback(null, json);
  });
};


var load_passenger = function(callback) {
  d3.csv("data/passanger.csv", function(error, csvdata) { 
    console.log('load_passenger....');
    callback(null, csvdata);
  });
};


$.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
async.parallel([
  load_map,
  load_railroad,
  load_station,
  load_passenger
], function(err, ret) {
  $.unblockUI();
  console.log('parallel....');
  console.log(err);
  console.log(ret);
  var csvdata = ret[3];
  var stations = ret[2];

  var ndx = crossfilter(csvdata);

  dimStation = ndx.dimension(function(d) {
    return d.station;
  });

  dimYear = ndx.dimension(function(fact) {
    return fact.year;
  });

  dimType = ndx.dimension(function(fact) {
    return fact.type;
  });

  var gpYear = dimYear.group().reduceSum(
    function(d) {
        ret = parseInt(d.count, 10);
        if (isNaN(ret)) {
          return 0;
        }
        return ret;
    }
  );

  // 期間
  rowChartYear.width(300)
    .height(220)
    .margins({
      top: 5, left: 10, right: 10, bottom: 20
    })
    .dimension(dimYear)
    .group(gpYear)
    .colors(d3.scale.category10())
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    .on('filtered', function(chart, filter){
      // フィルターかかった時のイベント
      //updatePerRadiusValue();
    })
    .elasticX(true)
    .xAxis().ticks(4)
  rowChartYear.render();

  // 定期券タイプのチャート
  var gpType = dimType.group().reduceSum(
    function(d) {
        ret = parseInt(d.count, 10);
        if (isNaN(ret)) {
          return 0;
        }
        return ret;
    }
  );

  pieChartCommuterPass
    .width(220)
    .height(220)
    .dimension(dimType)
    .group(gpType)
    .slicesCap(2)
    .innerRadius(35)
    .legend(dc.legend())
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    .on('filtered', function(chart, filter){
      // フィルターかかった時のイベント
      //updatePerRadiusValue();
    })
    .render();
  
  //
  chartBubble = dc.bubbleOverlay("#map").svg(d3.select("#map svg"));
  var gp = dimStation.group().reduce(
    function add(p, d) {

      var v = parseInt(d.count, 10);
      if (isNaN(v)) {
        v = 0;
      }
      if (d.type == '定期') {
        p.commuterPass += v;
        ++p.countCommuterPass;
      } else {
        p.other += v;
        ++p.countOther;
      }
      return p;
    }, 
    function remove(p, d) {
      var v = parseInt(d.count, 10);
      if (isNaN(v)) {
        v = 0;
      }
      if (d.type == '定期') {
        p.commuterPass -= v;
        --p.countCommuterPass;
      } else {
        p.other -= v;
        --p.countOther;
      }
      return p;
    }, 
    function init() {
      return {commuterPass: 0, other: 0, countCommuterPass:0, countOther:0};
    }
  /*
    function(d) {
        ret = parseInt(d.count, 10);
        if (isNaN(ret)) {
          return 0;
        }
        return ret;
    }
  */
  );
  var ext = d3.extent(csvdata, function (d) { return parseInt(d.count);});
  var radiusScale = d3.scale.linear().domain(ext).range([1, 30]);
  chartBubble
    .width(width)
    .height(height)
    .dimension(dimStation)
    .group(gp)
    .radiusValueAccessor(function (d, i) {
      var n = d.value.countCommuterPass;
      if (n < d.value.countOther) {
        n = d.value.countOther;
      }
      return radiusScale(((d.value.commuterPass + d.value.other)/ n));
    })
    .title(function(d) {
      var n = d.value.countCommuterPass;
      if (n < d.value.countOther) {
        n = d.value.countOther;
      }
      var x = parseInt(((d.value.commuterPass + d.value.other)/ n), 10);
      return d.key + ' 一日平均の乗降人数:' + util.numberSeparator(x);
    });
  for(var i=0; i < stations.features.length; ++i) {
    for(var j=0; j < csvdata.length; ++j) {
      if (stations.features[i].properties.stationName == '下高井戸' && csvdata[j].line == '世田谷線') {
        var pt = projection(stations.features[i].geometry.coordinates[0]);
        chartBubble.point(csvdata[j].station, pt[0], pt[1]);
        break;
      } else if (csvdata[j].station == stations.features[i].properties.stationName) {
        var pt = projection(stations.features[i].geometry.coordinates[0]);
        chartBubble.point(csvdata[j].station, pt[0], pt[1]);
        break;
      }
    }
  }
  chartBubble.render();
});




// ドラッグによる移動
var drag = d3.behavior.drag().on("drag", function(d) {
  vbox_x -= d3.event.dx;
  vbox_y -= d3.event.dy;
  return svg.attr("translate", "" + vbox_x + " " + vbox_y);
});
svg.call(drag);

// ズーム処理
zoom = d3.behavior.zoom().on("zoom", function(d) {
  var befere_vbox_width, before_vbox_height, d_x, d_y;
  befere_vbox_width = vbox_width;
  before_vbox_height = vbox_height;
  vbox_width = vbox_default_width * d3.event.scale;
  vbox_height = vbox_default_height * d3.event.scale;
  d_x = (befere_vbox_width - vbox_width) / 2;
  d_y = (before_vbox_height - vbox_height) / 2;
  vbox_x += d_x;
  vbox_y += d_y;
  return svg.attr("viewBox", "" + vbox_x + " " + vbox_y + " " + vbox_width + " " + vbox_height);  //svgタグのviewBox属性を更新
});
svg.call(zoom); 

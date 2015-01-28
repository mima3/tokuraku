var w = 800;
var h = 600;
var ndx;
var dimYear;
var dimSex;
var dimAge;
var dimHappiness;
var m;
var perRadiusValue; // バブルチャートを描画する際の半径を求める際に使用する係数
var svg = d3.select('#terms').append('svg')
    .attr('width', w)
    .attr('height', h);
var pieChartSex = dc.pieChart('#sex');
var pieChartAge = dc.pieChart('#age');
var rowChartYear = dc.rowChart('#year');
var pltChartHappiness = dc.bubbleChart('#happiness');


$('#resetBtn').button().click(function() {
  rowChartYear.filterAll();
  pieChartSex.filterAll();
  pieChartAge.filterAll();
  pltChartHappiness.filterAll();
  dc.renderAll();
});

$.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
d3.csv('./data/koufukudo_mine.csv', function(error, data) {
  if (error) {
    console.log(error.response);
    $.unblockUI();
    return;
  }
  ndx = crossfilter(data);

  dimYear = ndx.dimension(function(fact) {
    return fact.year;
  });

  dimSex = ndx.dimension(function(fact) {
    return fact.sex;
  });

  dimAge = ndx.dimension(function(fact) {
    if (isNaN(fact.age_range_start) || isNaN(fact.age_range_end)) {
      return '';
    } else {
      return fact.age_range_start.toString(10) + '-' + fact.age_range_end.toString(10);
    }
  });

  dimHappiness = ndx.dimension(function(fact) {
    return [fact.current, fact.after5y];
  });

  // 期間
  rowChartYear.width(300)
    .height(220)
    .margins({
      top: 5, left: 10, right: 10, bottom: 20
    })
    .dimension(dimYear)
    .group(dimYear.group().reduceCount())
    .colors(d3.scale.category10())
    .on('filtered', function(chart, filter) {
      // フィルターかかった時のイベント
      updatePerRadiusValue();
    })
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    .elasticX(true)
    .xAxis().ticks(4);
  rowChartYear.render();


  // 性別のチャート
  pieChartSex
    .width(220)
    .height(220)
    .dimension(dimSex)
    .group(dimSex.group())
    // 円グラフの分割数の最大値　超えた場合はotherとなる
    .slicesCap(3)
    .innerRadius(35)
    // 汎用ラベルの描画
    .legend(dc.legend())
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    .on('filtered', function(chart, filter) {
      // フィルターかかった時のイベント
      updatePerRadiusValue();
    })
    .render();

  // 年代のチャート
  pieChartAge
    .width(420)
    .height(220)
    .cx(210)
    .dimension(dimAge)
    .group(dimAge.group())
    // 円グラフの分割数の最大値　超えた場合はotherとなる
    .slicesCap(20)
    .innerRadius(35)
    // 汎用ラベルの描画
    .legend(dc.legend().horizontal(true).itemWidth(50).legendWidth(60))
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    .on('filtered', function(chart, filter) {
      // フィルターかかった時のイベント
      updatePerRadiusValue();
    })
    .render();


  console.log(dimHappiness.group().all());

  var currentExtent = d3.extent(data, function(d) {
    return parseInt(d.current);
  });
  currentExtent[0] -= 2;
  currentExtent[1] += 2;
  var after5yExtent = d3.extent(data, function(d) {
    return parseInt(d.after5y);
  });
  after5yExtent[0] -= 2;
  after5yExtent[1] += 2;

  m = dimHappiness.group().reduceCount();
  updatePerRadiusValue();

  pltChartHappiness
    .width(w)
    .height(h)
    .dimension(dimHappiness)
    .group(m)
    .keyAccessor(function(d) {
      return parseInt(d.key[0]);
    })
    .valueAccessor(function(d) {
      return parseInt(d.key[1]);
    })
    .radiusValueAccessor(function(d) {
      return d.value * perRadiusValue;
    })
    .colors(d3.scale.ordinal().domain(['positive', 'negative', 'equal'])
                                .range(['#00FF00', '#FF0000', '#FFFF00']))
    .colorAccessor(function(d) {
      var cur = parseInt(d.key[0]);
      var aft = parseInt(d.key[1]);
      if (cur == aft) {
        return 'equal';
      } else if (cur < aft) {
        return 'positive';
      } else {
        return 'negative';
      }
    })
    .title(function(d) {
      return d.key[0] + '->' + d.key[1] + '\ncount:' + util.numberSeparator(d.value);
    })
    .renderLabel(false)
    .xAxisLabel('現在')
    .x(d3.scale.linear().domain(currentExtent))
    .yAxisLabel('5年後')
    .y(d3.scale.linear().domain(after5yExtent));
  pltChartHappiness.render();


  $.unblockUI();
});

function updatePerRadiusValue() {
  var list = m.top(Infinity);
  perRadiusValue = 50.0 / (list[0].value - list[list.length - 1].value);
}

var w = 150;
var h = 150;
var ndx;
var dimSex;
var dimAge;

var pieChartSex = dc.pieChart('#sex');
var pieChartAge = dc.pieChart('#age');
var currentChart = [];
var wantToChart = [];

var actOrderKey = {
  '週に1回以上している' : 6,
  '月に1回以上している' : 5,
  '半年に1回以上している' : 4,
  '年に1回以上している' : 3,
  '過去2～3年の間にしたことがある' : 2,
  '全くしたことがない' : 1
};
var actMonthlyOrderKey = {
  '全くしていない': 1,
  '1時間以下': 2,
  '3時間以下': 3,
  '6時間以下': 4,
  '1日以下': 5,
  '4日以下': 6,
  '8日以下': 7,
  '12日以下': 8,
  '13日以上': 9
};

$('#resetBtn').button().click(function() {
  pieChartSex.filterAll();
  pieChartAge.filterAll();
  for (var i = 0; i < currentChart.length; ++i) {
    currentChart[i].chart.filterAll();
  }
  for (var i = 0; i < wantToChart.length; ++i) {
    wantToChart[i].chart.filterAll();
  }
  dc.renderAll();
});

$.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });

d3.csv('./data/chiikikatsudo_mine.csv', function(error, data) {
  if (error) {
    console.log(error.response);
    $.unblockUI();
    return;
  }
  ndx = crossfilter(data);

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


  // 性別のチャート
  pieChartSex
    .width(w)
    .height(h)
    .dimension(dimSex)
    .group(dimSex.group())
    // 円グラフの分割数の最大値　超えた場合はotherとなる
    .slicesCap(3)
    .innerRadius(30)
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    // 汎用ラベルの描画
    .legend(dc.legend())
    .render();

  // 年代のチャート
  pieChartAge
    .width(w + 200)
    .height(h)
    .dimension(dimAge)
    .cx(200)
    .group(dimAge.group())
    // 円グラフの分割数の最大値　超えた場合はotherとなる
    .slicesCap(20)
    .innerRadius(30)
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    // 汎用ラベルの描画
    .legend(dc.legend().horizontal(true).itemWidth(50).legendWidth(60))
    .render();

  currentChart.push(createChart('#educationalActivities', 'educationalActivities', actOrderKey, 200));
  currentChart.push(createChart('#childRearingActivities', 'childRearingActivities', actOrderKey, 200));
  currentChart.push(createChart('#environmentalBeautificationActivities', 'environmentalBeautificationActivities', actOrderKey, 200));
  currentChart.push(createChart('#communityEventsActivities', 'communityEventsActivities', actOrderKey, 200));
  currentChart.push(createChart('#disasterPreventionActivities', 'disasterPreventionActivities', actOrderKey, 200));
  currentChart.push(createChart('#careActivities', 'careActivities', actOrderKey, 200));
  currentChart.push(createChart('#communityActivitiesTime', 'communityActivitiesTime', actMonthlyOrderKey, 150));

  wantToChart.push(createChart('#wantToParticipateEducationalActivities', 'wantToParticipateEducationalActivities', {}, 100));
  wantToChart.push(createChart('#wantToParticipateChildRearingActivities', 'wantToParticipateChildRearingActivities', {}, 100));
  wantToChart.push(createChart('#wantToParticipateEnvironmentalBeautificationActivities', 'wantToParticipateEnvironmentalBeautificationActivities', {}, 100));
  wantToChart.push(createChart('#wantToParticipateCommunityEventsActivities', 'wantToParticipateCommunityEventsActivities', {}, 100));
  wantToChart.push(createChart('#wantToParticipateDisasterPreventionActivities', 'wantToParticipateDisasterPreventionActivities', {}, 100));
  wantToChart.push(createChart('#wantToParticipateCareActivities', 'wantToParticipateCareActivities', {}, 100));
  wantToChart.push(createChart('#wantToParticipateOtherActivites', 'wantToParticipateOtherActivites', {}, 100));
  wantToChart.push(createChart('#notWantToParticipateActivites', 'notWantToParticipateActivites', {}, 100));

  $.unblockUI();
});


function createChart(id, dimName, orderKeys, lblwidth) {
  var chart = dc.pieChart(id);
  var dim = ndx.dimension(function(fact) {
    return fact[dimName];
  });

  chart
    .width(w + lblwidth)
    .height(h)
    .cx(lblwidth)
    .renderLabel(false)
    .dimension(dim)
    .group(dim.group())
    .slicesCap(10)
    .innerRadius(30)
    .title(function(d) {
      return d.key + ':' + util.numberSeparator(d.value);
    })
    .legend(dc.legend())
    .ordering(function(d) {
      console.log(orderKeys[d.key]);
      return orderKeys[d.key];
    })
    .render();

  return {chart: chart, dim: dim};
}

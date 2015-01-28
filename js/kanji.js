var w = 800;
var h = 600;
var ndx;
var dimTerm;
var dimPeriod;
var dimSex;
var dimAge;

var svg = d3.select("#terms").append("svg")
    .attr("width", w)
    .attr("height", h);
var pieChartSex = dc.pieChart("#sex");
var pieChartAge = dc.pieChart("#age");
var periodChart = dc.rowChart("#period");
$('#resetBtn').button().click(function() {
  dimTerm.filterAll();
  periodChart.filterAll();
  pieChartSex.filterAll();
  pieChartAge.filterAll();
  dc.renderAll();
  drawTerm();
});

$.blockUI({ message: '<img src="/railway_location/img/loading.gif" />' });
d3.csv("./data/kanji_mine.csv", function(error, data) {
  if (error) {
    console.log(error.response);
    $.unblockUI();
    return;
  }
  ndx = crossfilter(data);

  dimTerm = ndx.dimension(function(fact) {
    return fact.term;
  });

  dimPeriod = ndx.dimension(function(fact) {
    return fact.period;
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

  // 期間
  periodChart.width(300)
    .height(220)
    .margins({
      top: 5, left: 10, right: 10, bottom: 20
    })
    .dimension(dimPeriod)
    .group(dimPeriod.group().reduceCount())
    .colors(d3.scale.category10())
    .on('filtered', function(chart, filter){
      // フィルターかかった時のイベント
      drawTerm();
    })
    .elasticX(true)
    .xAxis().ticks(4)
  periodChart.render();


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
    .on('filtered', function(chart, filter){
      // フィルターかかった時のイベント
      drawTerm();
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
    .on('filtered', function(chart, filter){
      // フィルターかかった時のイベント
      drawTerm();
    })
    .render();

  drawTerm();
  $.unblockUI();
});

function drawTerm() {
  var items = dimTerm.group().reduceCount().top(200);
  var per = 200/(items[0].value - items[items.length-1].value)
  var terms = [];
  dimTerm.filterAll();
  for (var i = 0; i < items.length; ++i) {
    terms.push({
      text : items[i].key,
      size : 10 + items[i].value * per,
      value : items[i].value
    });
  }
  d3.layout.cloud()
      .size([w, h])
      .words(terms)
      .padding(5)
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Impact")
      .fontSize(function(d) { return d.size; })
      .on("end", draw)
      .start();

}

var fill = d3.scale.category20();
var selNode;
var preTransform;
var preFont;
function draw(words) {
  var s = svg.select('g');
  if (s) {
    s.remove();
  }
  var words = svg.append("g")
      .attr("transform", "translate(" + w/2 + "," + h/2 + ")")
    .selectAll("text")
      .data(words)
  words.enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("font-family", "Impact")
      .style("fill", function(d, i) { return fill(i); })
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
      .text(function(d) {
         return d.text; 
       })
      .on("click",
        function(d,i){
          console.log('---------------------');
          this.parentNode.appendChild(this);
          if (selNode) {
            d3.select(selNode)
              .style("pointer-events", "none")
              .style("text-shadow", "")
              .transition()
                .duration(500)
                .attr("transform", preTransform)
                .style("font-size", preFont)
                .each("end", function() {
                  d3.select(selNode)
                    .style("pointer-events", "")
                    selNode = null;                    dimTerm.filterAll();
                    dc.renderAll();
                });
          } else {
            selNode = this;
            var selObj = d3.select(this);
            preTransform = selObj.attr('transform');
            preFont = selObj.style("font-size");
            selObj
                .style("pointer-events", "none")
                .style("text-shadow", "2px 2px 0 black")
              .transition()
                .duration(750)
                .attr("transform", "translate(0,0)rotate(0)")
                .style("font-size", "250px")
                .each("end", function() {
                  d3.select(selNode)
                    .style("pointer-events", "")
                });
            dimTerm.filter(d.text);
            dc.renderAll();
          }
        }
      )
  words.exit().remove();
}
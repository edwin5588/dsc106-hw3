'use strict';

const JSONFileName = 'assets/springfield_converted.json';



var area_chart = {
  chart: {
    type: 'area'
  },
  title: {
    text: "<strong>Generation</strong> MW"
  },

  xAxis: {
    type: "datetime"

  },

  tooltip: {
    crosshairs: [true],
    shared: false,
    positioner: function () {
    return { x: 80, y: 50 };}
  },

  legend:{
    enabled: false
  },


  yAxis: {
    title: {
      text: 'MW'
    },
    labels: {
      formatter: function () {
        return this.value;
      }
    }
  },


  plotOptions: {
    area: {
      stacking: 'normal',
      lineColor: '#666666',
      lineWidth: 1,
      marker: {
        lineWidth: 1,
        lineColor: '#666666'
      }
    }
  },
  series: []
};

var price_chart = {
  title: {
        text: 'Price'
    },


    legend:{
      enabled: false
    },

    xAxis: {
      type: "datetime",
      crosshair: true

    },
    yAxis: {
        title: {
            text: 'Number of Employees'
        }
    },
    tooltip: {
      crosshairs: [true],
      shared: false,
      positioner: function () {
      return { x: 80, y: 50 };}
    },
    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 2010
        }
    }
};

var temp_chart = {
  title: {
        text: 'temperature'
    },

    legend:{
      enabled: false
    },


    xAxis: {
      type: "datetime",
      crosshair: true

    },
    yAxis: {
        title: {
            text: 'Number of Employees'
        }
    },


    tooltip: {
      crosshairs: [true],
      shared: false,
      positioner: function () {
      return { x: 80, y: 50 };}
    },


    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 2010
        }
    }
};


var pie_chart = {
  chart: {
    type: 'pie'
  },


  plotOptions: {
    pie: {
        shadow: false,
        animation: false
    }
  },

  series: []
};

// global data-structure to hold the energy breakup
var globalEnergyData = {
  name: [],
  data: []
};

// function to do deep-copy on the global data structure
function updateGlobalEnergyData(data) {
  globalEnergyData['data'] = [];
  for (var idx = 0; idx < data[0]['data'].length; idx ++) {
    var energyBreakup = data.map(elm => {return elm['data'][idx]});
    globalEnergyData['data'].push(energyBreakup);
  }
  globalEnergyData['name'] = data.map(elm => elm['name']);
}

// this method reacts only onmouseover on any of the nodes in the shared graphs
function onMouseoverChart(e) {
  if (e['target'] === 'node') {
    var nodeSplit = e['targetid'].split('-');
    var nodeId = nodeSplit[nodeSplit.length - 1];
    if (Number.isInteger(parseInt(nodeId)) && parseInt(nodeId) < globalEnergyData['values'].length) {
      renderPieChart(parseInt(nodeId));
    }
  }
}


// the nodeId is basically the x-axis value
// the actual breakup is retrieved from the global data-structure
function renderPieChart(nodeId) {
  var pieDataSet = globalEnergyData['name'].map(function(elm, idx) {
    return {
      name: elm.split('.')[elm.split('.').length-2],
      y: globalEnergyData['data'][nodeId][idx]
    }
  });



  var pieChartData = [{
    name: 'Powers',
    data: pieDataSet
  }]


  pie_chart.series = pieChartData;
  Highcharts.chart('pie_graph', pie_chart);
}


console.log('test');

// this function is responsible for plotting the energy on
// successfully loading the JSON data
// It also plots the pie chart for nodeId=0
function onSuccessCb(jsonData) {
    var energyData = jsonData.filter(function(elm) {
        return elm['type'] === 'power' && !(elm['id'] === "Springfield.fuel_tech.rooftop_solar.power");
    }).map(function(elm) {
        return {
          name: elm['id'],
          data: elm['history']['data'].filter(function(value, index, array) {
                return index % 6 == 0;
            }),
          pointStart: elm['history']['start']*1000,
          pointInterval: 1800000
        };
    });


    updateGlobalEnergyData(energyData);

    area_chart.series = energyData;
    Highcharts.chart('energy_graph', area_chart);



    var priceData = jsonData.filter(function(elm) {
        return elm['type'] === 'price';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id'],
          pointStart: elm['history']['start'] * 1000,
          pointInterval: 1800000
        };
    });


    price_chart.series = priceData;
    Highcharts.chart('price_graph', price_chart);


    var tempData = jsonData.filter(function(elm) {
        return elm['type'] === 'temperature';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id'],
          pointStart: elm['history']['start'] * 1000,
          pointInterval: 1800000
        };
    });


    temp_chart.series = tempData;
    Highcharts.chart('temp_graph', temp_chart);



    //pushing data onto the charts
}

// Utility function to fetch any file from the server
function fetchJSONFile(filePath, callbackFunc) {
    console.debug("Fetching file:", filePath);
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200 || httpRequest.status === 0) {
                console.info("Loaded file:", filePath);
                var data = JSON.parse(httpRequest.responseText);
                console.debug("Data parsed into valid JSON!");
                console.debug(data);
                if (callbackFunc) callbackFunc(data);
            } else {
                console.error("Error while fetching file", filePath,
                    "with error:", httpRequest.statusText);
            }
        }
    };
    httpRequest.open('GET', filePath);
    httpRequest.send();
}


// The entrypoint of the script execution
function doMain() {
    fetchJSONFile('assets/springfield_converted.json', onSuccessCb);
}

document.onload = doMain();

/*
The purpose of this demo is to demonstrate how multiple charts on the same page
can be linked through DOM and Highcharts events and API methods. It takes a
standard Highcharts config with a small variation for each data set, and a
mouse/touch event handler to bind the charts together.
*/


/**
 * In order to synchronize tooltips and crosshairs, override the
 * built-in events with handlers defined on the parent element.
 */
['mousemove', 'touchmove', 'touchstart'].forEach(function (eventType) {
  document.getElementById('shared_container').addEventListener(
    eventType,
    function (e) {
      var chart,
        point,
        i,
        event;

      for (i = 0; i < Highcharts.charts.length; i = i + 1) {
        chart = Highcharts.charts[i];
                var points = [];
                // Find coordinates within the chart
                event = chart.pointer.normalize(e);
                // Get the hovered point
                for(var j=0; j<chart.series.length; j++) {
                   point = chart.series[j].searchPoint(event, true);
                   points.push(point);
                }

                if (points) {
                  if (points.length == 1) {
                    points[0].highlight(event);
                    renderPieChart(chart.series[0].data.indexOf(points[0]));
                  } else {
                    points.map(function(elm) {
                      elm.series.chart.xAxis[0].drawCrosshair(event, elm);
                      renderPieChart(chart.series[0].data.indexOf(points[0]));
                    });
                  }
                }
      }
    }
  );
});

/**
 * Override the reset function, we don't need to hide the tooltips and
 * crosshairs.
 */
Highcharts.Pointer.prototype.reset = function () {
  return undefined;
};

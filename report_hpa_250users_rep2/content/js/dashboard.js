/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9999757525373237, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.999889049151226, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [0.999889049151226, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [0.9999442026559536, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [0.9999442026559536, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [0.9999447940819256, 500, 1500, "Look at Product"], "isController": false}, {"data": [1.0, 500, 1500, "Logout"], "isController": false}, {"data": [1.0, 500, 1500, "List Products with different page"], "isController": false}, {"data": [1.0, 500, 1500, "List Products"], "isController": false}, {"data": [1.0, 500, 1500, "Home"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 144345, 0, 0.0, 18.362028473448895, 2, 1618, 13.0, 30.0, 36.0, 52.0, 241.2202642067531, 7380.025957457031, 194.01147255105323], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 9013, 0, 0.0, 27.49184511261509, 10, 1601, 24.0, 41.0, 51.0, 85.0, 15.25001015200942, 375.38657774546294, 12.255040142208502], "isController": false}, {"data": ["Add Product to Cart-0", 9013, 0, 0.0, 7.903250859869107, 2, 233, 7.0, 12.0, 15.0, 28.0, 15.250164971827887, 12.632501261082723, 8.08233402882354], "isController": false}, {"data": ["Add Product to Cart", 9013, 0, 0.0, 35.504826361921566, 13, 1618, 30.0, 53.0, 65.0, 122.0, 15.249777928175627, 388.01304209318556, 20.33698242724504], "isController": false}, {"data": ["Add Product 2 to Cart-1", 8961, 0, 0.0, 28.242272067849456, 10, 712, 25.0, 42.0, 52.0, 89.0, 15.24511096555772, 383.7777965479036, 13.983141576782723], "isController": false}, {"data": ["Add Product 2 to Cart-0", 8961, 0, 0.0, 8.01261019975449, 3, 228, 7.0, 12.0, 15.0, 25.3799999999992, 15.245292520432535, 14.369146220661191, 13.945437704580563], "isController": false}, {"data": ["Add Product 2 to Cart", 8961, 0, 0.0, 36.37819439794676, 14, 723, 32.0, 54.0, 65.0, 116.3799999999992, 15.244903479567133, 398.14135286928615, 27.928033100588124], "isController": false}, {"data": ["Login", 9118, 0, 0.0, 20.005373985523168, 6, 314, 17.0, 31.0, 37.0, 64.80999999999949, 15.269936913958812, 158.14004726690655, 10.510558488668963], "isController": false}, {"data": ["Login-0", 9118, 0, 0.0, 10.861702127659548, 2, 223, 9.0, 18.0, 22.0, 35.0, 15.270141497505497, 7.144314209580096, 4.1241588563429366], "isController": false}, {"data": ["Login-1", 9118, 0, 0.0, 9.04672077209919, 3, 273, 8.0, 13.0, 17.0, 29.0, 15.271573735840967, 151.01201438629394, 6.387139465955512], "isController": false}, {"data": ["Logout-1", 8927, 0, 0.0, 9.24991598521336, 3, 240, 8.0, 13.0, 17.0, 29.0, 15.237090632270133, 143.15729042119622, 10.233406493386791], "isController": false}, {"data": ["Logout-0", 8927, 0, 0.0, 6.443149994399033, 2, 217, 5.0, 10.0, 13.0, 22.0, 15.237168655162408, 18.39745938732142, 15.427090534162868], "isController": false}, {"data": ["Look at Product", 9057, 0, 0.0, 31.3163299105664, 10, 733, 27.0, 47.0, 58.0, 109.0, 15.254280108129048, 1581.2070137166622, 6.527138580343082], "isController": false}, {"data": ["Logout", 8927, 0, 0.0, 15.828385795900113, 5, 251, 14.0, 24.0, 29.0, 48.0, 15.236908581962176, 161.5527253741167, 25.660111445603196], "isController": false}, {"data": ["List Products with different page", 8987, 0, 0.0, 19.12840770001107, 7, 369, 16.0, 28.0, 35.0, 60.0, 15.232125938342685, 1762.6425916345975, 12.560085764394417], "isController": false}, {"data": ["List Products", 9094, 0, 0.0, 18.946338244996547, 7, 356, 16.0, 28.0, 35.0, 64.04999999999927, 15.282954816634792, 1766.3413097310777, 6.730205401992632], "isController": false}, {"data": ["Home", 9150, 0, 0.0, 9.553879781420775, 3, 235, 8.0, 14.0, 18.0, 33.48999999999978, 15.295913232887385, 136.1993523998703, 2.195800044174263], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 144345, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

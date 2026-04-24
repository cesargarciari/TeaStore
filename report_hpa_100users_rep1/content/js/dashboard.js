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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [1.0, 500, 1500, "Look at Product"], "isController": false}, {"data": [1.0, 500, 1500, "Logout"], "isController": false}, {"data": [1.0, 500, 1500, "List Products with different page"], "isController": false}, {"data": [1.0, 500, 1500, "List Products"], "isController": false}, {"data": [1.0, 500, 1500, "Home"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 57651, 0, 0.0, 15.436020190456402, 2, 249, 13.0, 28.0, 34.0, 48.0, 96.37057814657435, 2999.020939864298, 91.85421124755943], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 3603, 0, 0.0, 20.953094643352763, 9, 186, 19.0, 31.0, 36.0, 47.0, 6.09920217763355, 156.590415596492, 5.204091384136319], "isController": false}, {"data": ["Add Product to Cart-0", 3603, 0, 0.0, 6.844851512628384, 2, 187, 6.0, 9.0, 11.0, 19.0, 6.09943965736148, 5.546622390851686, 5.106627842448071], "isController": false}, {"data": ["Add Product to Cart", 3603, 0, 0.0, 27.904246461282302, 12, 223, 25.0, 41.0, 47.0, 64.0, 6.099129904865085, 162.13490078386855, 10.310398226694485], "isController": false}, {"data": ["Add Product 2 to Cart-1", 3579, 0, 0.0, 22.153394803017594, 9, 171, 20.0, 33.0, 38.0, 49.19999999999982, 6.095089527481548, 159.90087596422563, 5.896375654809144], "isController": false}, {"data": ["Add Product 2 to Cart-0", 3579, 0, 0.0, 7.010617490919247, 2, 206, 6.0, 10.0, 11.0, 19.0, 6.095214090350181, 6.238566284601708, 5.879916371223062], "isController": false}, {"data": ["Add Product 2 to Cart", 3579, 0, 0.0, 29.27158424140821, 13, 249, 27.0, 42.0, 49.0, 65.0, 6.095037627788876, 166.13790007997716, 11.776071588911938], "isController": false}, {"data": ["Login", 3638, 0, 0.0, 21.53298515667951, 8, 222, 20.0, 30.0, 33.0, 43.0, 6.102869757915026, 62.28417636683397, 6.052394651370629], "isController": false}, {"data": ["Login-0", 3638, 0, 0.0, 13.629191863661358, 3, 208, 13.0, 19.0, 21.0, 28.0, 6.1029618992659005, 4.752978559529881, 1.6444556680755371], "isController": false}, {"data": ["Login-1", 3638, 0, 0.0, 7.793293018141829, 3, 173, 7.0, 11.0, 13.0, 17.610000000000127, 6.1030335666846165, 57.53281377915423, 4.408082126315013], "isController": false}, {"data": ["Logout-1", 3566, 0, 0.0, 7.538418395961866, 3, 162, 7.0, 11.0, 13.0, 16.0, 6.094747168830991, 56.15133730114306, 4.363740257441539], "isController": false}, {"data": ["Logout-0", 3566, 0, 0.0, 5.270050476724614, 2, 115, 5.0, 8.0, 9.0, 15.0, 6.094788835905587, 8.269480977285545, 6.476762989988719], "isController": false}, {"data": ["Look at Product", 3618, 0, 0.0, 24.85461580983967, 10, 235, 22.0, 36.09999999999991, 42.0, 62.809999999999945, 6.108287889787442, 659.3519885991922, 4.488575120608297], "isController": false}, {"data": ["Logout", 3566, 0, 0.0, 12.929332585530014, 5, 167, 12.0, 19.0, 21.0, 29.329999999999927, 6.094684669287301, 64.42010113121688, 10.840347803794224], "isController": false}, {"data": ["List Products with different page", 3592, 0, 0.0, 15.4660356347439, 7, 199, 14.0, 22.0, 26.0, 37.0, 6.0983270346715015, 704.6666272602391, 5.3321532096435735], "isController": false}, {"data": ["List Products", 3631, 0, 0.0, 15.70696777747179, 7, 211, 14.0, 22.0, 26.0, 37.0, 6.107766501987421, 705.9006144615375, 4.563727735080043], "isController": false}, {"data": ["Home", 3652, 0, 0.0, 8.078587075575044, 3, 195, 7.0, 11.0, 14.0, 22.4699999999998, 6.104991817104342, 54.360659558942764, 0.876400192494471], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 57651, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

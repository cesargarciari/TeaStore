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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9999306037473976, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [0.9997203579418344, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [0.9991610738255033, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [1.0, 500, 1500, "Look at Product"], "isController": false}, {"data": [1.0, 500, 1500, "Logout"], "isController": false}, {"data": [1.0, 500, 1500, "List Products with different page"], "isController": false}, {"data": [1.0, 500, 1500, "List Products"], "isController": false}, {"data": [1.0, 500, 1500, "Home"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 28820, 0, 0.0, 12.980742539902911, 1, 680, 11.0, 21.0, 25.0, 42.0, 48.199541418658676, 1497.792279622356, 46.120964286640096], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 1802, 0, 0.0, 16.45893451720313, 9, 178, 14.0, 22.0, 30.0, 54.0, 3.0516253037654213, 78.0293902967587, 2.6094306329963337], "isController": false}, {"data": ["Add Product to Cart-0", 1802, 0, 0.0, 6.5571587125416215, 3, 298, 5.0, 9.0, 13.0, 23.970000000000027, 3.051501281054783, 2.7791835397795874, 2.5747620856681044], "isController": false}, {"data": ["Add Product to Cart", 1802, 0, 0.0, 23.164816870144296, 13, 451, 19.0, 32.0, 40.0, 69.97000000000003, 3.051418604848064, 80.80321329238247, 5.1839462117620165], "isController": false}, {"data": ["Add Product 2 to Cart-1", 1788, 0, 0.0, 17.615771812080546, 10, 508, 14.0, 24.0, 32.0, 64.0, 3.053403828025739, 79.7824709265962, 2.96020299350554], "isController": false}, {"data": ["Add Product 2 to Cart-0", 1788, 0, 0.0, 6.601230425055931, 3, 323, 5.0, 8.0, 12.0, 24.1099999999999, 3.0534194711846347, 3.1301838914618676, 2.950752270639186], "isController": false}, {"data": ["Add Product 2 to Cart", 1788, 0, 0.0, 24.352908277404925, 13, 680, 20.0, 33.0, 41.549999999999955, 78.0, 3.0532786885245904, 82.90924072265625, 5.910697895321038], "isController": false}, {"data": ["Login", 1821, 0, 0.0, 18.309170785282838, 10, 265, 16.0, 24.0, 30.0, 58.559999999999945, 3.054323687865227, 31.16362836011248, 3.0507758512606427], "isController": false}, {"data": ["Login-0", 1821, 0, 0.0, 12.054914881933005, 7, 228, 10.0, 16.0, 20.0, 33.0, 3.0543493028334496, 2.395140664023254, 0.8256782629415682], "isController": false}, {"data": ["Login-1", 1821, 0, 0.0, 6.106534870950036, 3, 70, 5.0, 8.0, 11.0, 30.0, 3.0547489519745152, 28.77251332206465, 2.225414321819731], "isController": false}, {"data": ["Logout-1", 1781, 0, 0.0, 6.167321729365517, 3, 79, 5.0, 8.0, 11.0, 29.0, 3.057132852248306, 28.156074149954854, 2.193713556006811], "isController": false}, {"data": ["Logout-0", 1781, 0, 0.0, 4.311061201572152, 1, 138, 3.0, 6.0, 8.0, 23.180000000000064, 3.057127604609208, 4.155782837515642, 3.2550507618787687], "isController": false}, {"data": ["Look at Product", 1810, 0, 0.0, 20.08674033149169, 11, 490, 17.0, 29.0, 37.44999999999982, 60.779999999999745, 3.0530488319136375, 328.5483687115206, 2.263575841275196], "isController": false}, {"data": ["Logout", 1781, 0, 0.0, 10.64177428411005, 5, 217, 9.0, 14.0, 20.0, 39.720000000000255, 3.057101366683946, 32.311531339473, 5.448713788110777], "isController": false}, {"data": ["List Products with different page", 1794, 0, 0.0, 13.93255295429208, 7, 431, 11.0, 19.0, 26.25, 51.149999999999864, 3.0515393774451436, 352.5832943527811, 2.673683276811533], "isController": false}, {"data": ["List Products", 1815, 0, 0.0, 13.868319559228627, 7, 428, 11.0, 19.0, 27.0, 49.0, 3.056255304244743, 353.47414612183934, 2.303352164279195], "isController": false}, {"data": ["Home", 1825, 0, 0.0, 7.393424657534254, 3, 376, 5.0, 9.0, 13.0, 36.0, 3.05327930562573, 27.187305379585357, 0.4412942746412188], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 28820, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

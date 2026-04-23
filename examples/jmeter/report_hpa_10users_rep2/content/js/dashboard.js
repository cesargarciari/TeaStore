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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 5767, 0, 0.0, 20.60655453441995, 3, 269, 17.0, 38.0, 46.0, 73.0, 9.656925457309926, 303.88165458626514, 9.233019807518739], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 361, 0, 0.0, 24.72853185595564, 11, 176, 21.0, 36.80000000000001, 47.89999999999998, 114.79999999999995, 0.6131020415788482, 16.13810874472877, 0.5242375392529666], "isController": false}, {"data": ["Add Product to Cart-0", 361, 0, 0.0, 11.556786703601105, 4, 94, 9.0, 18.80000000000001, 22.0, 43.319999999999936, 0.6130832995090238, 0.5583482208059413, 0.5166156878420997], "isController": false}, {"data": ["Add Product to Cart", 361, 0, 0.0, 36.57063711911358, 16, 214, 32.0, 54.0, 64.79999999999995, 139.0, 0.6130676819927927, 16.695538327238037, 1.0408106875443668], "isController": false}, {"data": ["Add Product 2 to Cart-1", 358, 0, 0.0, 25.18435754189943, 13, 167, 21.0, 40.0, 52.150000000000034, 73.41000000000003, 0.6108381108381109, 16.4156143892472, 0.5922343019510988], "isController": false}, {"data": ["Add Product 2 to Cart-0", 358, 0, 0.0, 11.391061452513968, 4, 206, 9.0, 18.0, 21.0, 42.690000000000225, 0.6108589564208442, 0.6262574037854487, 0.5886802599136608], "isController": false}, {"data": ["Add Product 2 to Cart", 358, 0, 0.0, 36.86033519553068, 18, 269, 32.0, 55.0, 66.15000000000003, 146.0800000000022, 0.6108172666780413, 17.041268888095033, 1.1808541764417335], "isController": false}, {"data": ["Login", 363, 0, 0.0, 28.388429752066113, 13, 95, 25.0, 41.60000000000002, 49.80000000000001, 75.68000000000018, 0.6141539648460301, 6.266266541340344, 0.6129907944580641], "isController": false}, {"data": ["Login-0", 363, 0, 0.0, 18.64462809917356, 8, 67, 16.0, 28.0, 31.0, 43.440000000000055, 0.6141601993736581, 0.4815888217556522, 0.1655948471451702], "isController": false}, {"data": ["Login-1", 363, 0, 0.0, 9.399449035812664, 4, 65, 8.0, 14.0, 22.0, 43.72000000000003, 0.6142287875326785, 5.78538735913348, 0.447452134994966], "isController": false}, {"data": ["Logout-1", 357, 0, 0.0, 10.60224089635854, 4, 58, 9.0, 16.0, 24.099999999999966, 40.84000000000003, 0.6127188066915072, 5.643116275300395, 0.43859153946029256], "isController": false}, {"data": ["Logout-0", 357, 0, 0.0, 8.263305322128847, 3, 49, 7.0, 14.0, 18.0, 29.0, 0.6127177550845276, 0.8329131983180297, 0.6524272183128809], "isController": false}, {"data": ["Look at Product", 363, 0, 0.0, 31.807162534435275, 13, 267, 29.0, 49.0, 57.80000000000001, 80.08000000000004, 0.615748923711592, 68.15375098490144, 0.4558631240394826], "isController": false}, {"data": ["Logout", 357, 0, 0.0, 19.170868347338935, 7, 79, 17.0, 31.0, 39.099999999999966, 64.20000000000016, 0.6126967237029536, 6.475797500622137, 1.0909805561037982], "isController": false}, {"data": ["List Products with different page", 358, 0, 0.0, 21.092178770949722, 9, 83, 18.0, 34.0, 39.05000000000001, 62.050000000000125, 0.6110549744654122, 70.67924599731256, 0.5342997275855478], "isController": false}, {"data": ["List Products", 363, 0, 0.0, 22.917355371900815, 10, 106, 20.0, 38.0, 43.0, 64.36000000000001, 0.6156674649425716, 71.295843401885, 0.4634367145151661], "isController": false}, {"data": ["Home", 366, 0, 0.0, 13.024590163934429, 4, 190, 11.0, 20.0, 24.0, 44.60999999999973, 0.6131536536251453, 5.459702161869214, 0.0886198640005093], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 5767, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

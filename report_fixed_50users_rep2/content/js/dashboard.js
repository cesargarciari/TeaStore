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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9998096951662572, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [0.9991689750692521, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [0.9991689750692521, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [0.9994422755158952, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [0.9994422755158952, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [0.9997242140099283, 500, 1500, "Look at Product"], "isController": false}, {"data": [1.0, 500, 1500, "Logout"], "isController": false}, {"data": [1.0, 500, 1500, "List Products with different page"], "isController": false}, {"data": [1.0, 500, 1500, "List Products"], "isController": false}, {"data": [1.0, 500, 1500, "Home"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 28901, 0, 0.0, 15.533926161724487, 2, 2126, 13.0, 27.0, 32.0, 44.0, 48.29228352772115, 1496.60863436205, 46.14018102191458], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 1805, 0, 0.0, 20.350138504155144, 9, 205, 18.0, 29.0, 33.69999999999982, 43.940000000000055, 3.053349888523126, 77.53998495421666, 2.607908905716615], "isController": false}, {"data": ["Add Product to Cart-0", 1805, 0, 0.0, 8.608310249307491, 3, 1957, 6.0, 9.0, 11.0, 18.0, 3.053360218691639, 2.78086195999506, 2.5709781362280766], "isController": false}, {"data": ["Add Product to Cart", 1805, 0, 0.0, 29.091966759002773, 13, 1983, 25.0, 38.40000000000009, 44.0, 62.940000000000055, 3.053298238729016, 80.31947881636907, 5.1787907390123555], "isController": false}, {"data": ["Add Product 2 to Cart-1", 1793, 0, 0.0, 21.48745119910767, 9, 232, 19.0, 30.0, 34.0, 48.0, 3.0538277593454284, 79.26338593791516, 2.956892040461089], "isController": false}, {"data": ["Add Product 2 to Cart-0", 1793, 0, 0.0, 8.302844394868943, 3, 2111, 6.0, 9.0, 11.0, 18.059999999999945, 3.053853765880295, 3.1298894074450674, 2.947990343762934], "isController": false}, {"data": ["Add Product 2 to Cart", 1793, 0, 0.0, 29.944227551589442, 14, 2126, 26.0, 40.0, 44.299999999999955, 68.11999999999989, 3.053760144427697, 82.39142441922354, 5.904726539547301], "isController": false}, {"data": ["Login", 1825, 0, 0.0, 20.895890410958888, 11, 133, 20.0, 28.0, 31.0, 40.74000000000001, 3.0595548641054697, 31.217040368940406, 3.050065790907506], "isController": false}, {"data": ["Login-0", 1825, 0, 0.0, 13.1676712328767, 7, 118, 12.0, 17.0, 19.0, 26.74000000000001, 3.0595805105559717, 2.399280534927836, 0.8241073752445569], "isController": false}, {"data": ["Login-1", 1825, 0, 0.0, 7.610410958904107, 3, 71, 7.0, 11.0, 12.0, 16.0, 3.059821608208705, 28.82029239372359, 2.2261593920805107], "isController": false}, {"data": ["Logout-1", 1789, 0, 0.0, 7.906651760760211, 3, 377, 7.0, 10.0, 12.0, 17.0, 3.052874975469493, 28.116859271145298, 2.187692977768961], "isController": false}, {"data": ["Logout-0", 1789, 0, 0.0, 5.186696478479599, 2, 67, 5.0, 7.0, 9.0, 14.0, 3.0528958141709652, 4.150030247388656, 3.2468314633848747], "isController": false}, {"data": ["Look at Product", 1813, 0, 0.0, 24.010479867622735, 12, 761, 22.0, 33.0, 37.0, 48.0, 3.0598846256409216, 327.27773636205796, 2.2638450865898405], "isController": false}, {"data": ["Logout", 1789, 0, 0.0, 13.239239798770269, 6, 381, 12.0, 18.0, 20.0, 27.09999999999991, 3.052848927492705, 32.26658588110698, 5.4344559099887375], "isController": false}, {"data": ["List Products with different page", 1801, 0, 0.0, 15.72570794003334, 7, 499, 14.0, 21.0, 25.0, 32.98000000000002, 3.056121661131936, 353.47092056385105, 2.674711306483526], "isController": false}, {"data": ["List Products", 1818, 0, 0.0, 15.332233223322318, 7, 218, 14.0, 22.0, 25.0, 34.0, 3.059740679403805, 354.01990978614214, 2.3015080278220976], "isController": false}, {"data": ["Home", 1833, 0, 0.0, 7.7304964539007095, 3, 100, 7.0, 11.0, 12.0, 21.0, 3.0641464772345453, 27.28406990178182, 0.43987258999363105], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 28901, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

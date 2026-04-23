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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9986045700331415, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.994413407821229, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [0.994413407821229, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [0.9986111111111111, 500, 1500, "Look at Product"], "isController": false}, {"data": [1.0, 500, 1500, "Logout"], "isController": false}, {"data": [1.0, 500, 1500, "List Products with different page"], "isController": false}, {"data": [0.994475138121547, 500, 1500, "List Products"], "isController": false}, {"data": [0.9958677685950413, 500, 1500, "Home"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 5733, 0, 0.0, 27.222222222222218, 3, 3686, 19.0, 44.0, 56.0, 116.65999999999985, 9.592169657422511, 300.1494855063371, 9.164426540866693], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 358, 0, 0.0, 36.40502793296093, 12, 1502, 23.0, 43.0, 52.10000000000002, 185.01000000000153, 0.6157550739594083, 16.18915716643017, 0.5264938349243207], "isController": false}, {"data": ["Add Product to Cart-0", 358, 0, 0.0, 14.888268156424587, 4, 288, 11.0, 23.0, 29.05000000000001, 50.050000000000125, 0.6154798335797546, 0.5605186019324004, 0.5186815133626174], "isController": false}, {"data": ["Add Product to Cart", 358, 0, 0.0, 51.57262569832402, 17, 1791, 37.0, 63.0, 75.10000000000002, 216.53000000000083, 0.6154480909075281, 16.74157579907253, 1.044886115779023], "isController": false}, {"data": ["Add Product 2 to Cart-1", 355, 0, 0.0, 29.60281690140845, 13, 146, 24.0, 48.0, 59.39999999999998, 121.32, 0.6156855875808412, 16.54430096272414, 0.5959406971208461], "isController": false}, {"data": ["Add Product 2 to Cart-0", 355, 0, 0.0, 13.991549295774638, 4, 221, 11.0, 21.400000000000034, 28.19999999999999, 56.27999999999997, 0.6156653000631274, 0.6301914919607986, 0.59488625746169], "isController": false}, {"data": ["Add Product 2 to Cart", 355, 0, 0.0, 43.85352112676055, 17, 244, 37.0, 68.0, 88.39999999999992, 153.88, 0.6156300670256397, 17.17296447825352, 1.190739170655256], "isController": false}, {"data": ["Login", 362, 0, 0.0, 32.51657458563536, 14, 432, 27.0, 46.0, 58.0, 147.4900000000008, 0.6131758273215565, 6.256278184173796, 0.6120063389380201], "isController": false}, {"data": ["Login-0", 362, 0, 0.0, 20.31767955801105, 8, 417, 16.0, 28.69999999999999, 33.0, 48.0, 0.6131841364859806, 0.4808151151371788, 0.16533183721485667], "isController": false}, {"data": ["Login-1", 362, 0, 0.0, 11.917127071823213, 5, 313, 9.0, 18.69999999999999, 28.0, 53.700000000000045, 0.6133701129482092, 5.77729955018113, 0.44681827226601284], "isController": false}, {"data": ["Logout-1", 355, 0, 0.0, 11.828169014084516, 5, 64, 9.0, 19.0, 28.0, 60.879999999999995, 0.6154934436944863, 5.668670573713575, 0.43874902908076485], "isController": false}, {"data": ["Logout-0", 355, 0, 0.0, 10.69577464788732, 3, 408, 8.0, 16.0, 21.0, 38.879999999999995, 0.6154646324549238, 0.836647234743412, 0.6538278947425451], "isController": false}, {"data": ["Look at Product", 360, 0, 0.0, 45.08055555555558, 15, 1483, 34.0, 61.900000000000034, 82.89999999999998, 364.4999999999993, 0.6138662146792464, 67.14761867867003, 0.45493940895340923], "isController": false}, {"data": ["Logout", 355, 0, 0.0, 22.8450704225352, 9, 423, 18.0, 36.0, 50.19999999999999, 86.67999999999995, 0.6154571633145922, 6.504973514212726, 1.0925431269688128], "isController": false}, {"data": ["List Products with different page", 358, 0, 0.0, 25.14525139664806, 10, 126, 21.0, 42.0, 52.10000000000002, 80.87000000000018, 0.6172477646320479, 70.86951175626386, 0.5405851315918785], "isController": false}, {"data": ["List Products", 362, 0, 0.0, 36.54696132596683, 10, 1841, 22.0, 44.0, 67.39999999999986, 160.0500000000003, 0.6142266428441747, 70.42175700899197, 0.4626898540405763], "isController": false}, {"data": ["Home", 363, 0, 0.0, 28.066115702479365, 4, 3686, 12.0, 26.0, 35.80000000000001, 174.12000000000057, 0.6078151973892412, 5.412166962690528, 0.08784829024766376], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 5733, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

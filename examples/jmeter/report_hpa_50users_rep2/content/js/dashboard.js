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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9998786239422943, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [0.9997226844148641, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [0.9997252747252747, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [1.0, 500, 1500, "Look at Product"], "isController": false}, {"data": [0.9997197309417041, 500, 1500, "Logout"], "isController": false}, {"data": [1.0, 500, 1500, "List Products with different page"], "isController": false}, {"data": [0.9997242140099283, 500, 1500, "List Products"], "isController": false}, {"data": [0.9991803278688525, 500, 1500, "Home"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 28836, 0, 0.0, 13.249167707032889, 1, 728, 11.0, 21.0, 27.0, 45.0, 48.21154495631268, 1495.1904042984488, 46.12366369015773], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 1803, 0, 0.0, 17.20909595119243, 10, 289, 14.0, 24.0, 33.0, 51.960000000000036, 3.0582336538004875, 78.18475762904626, 2.615058845660972], "isController": false}, {"data": ["Add Product to Cart-0", 1803, 0, 0.0, 6.682750970604542, 3, 405, 5.0, 9.0, 12.0, 26.960000000000036, 3.058192155559023, 2.7852547602974402, 2.5798858351256184], "isController": false}, {"data": ["Add Product to Cart", 1803, 0, 0.0, 24.03438713255684, 13, 586, 20.0, 34.0, 42.0, 69.0, 3.0581247233185826, 80.9671661313959, 5.194794649914261], "isController": false}, {"data": ["Add Product 2 to Cart-1", 1789, 0, 0.0, 17.108440469536056, 10, 281, 15.0, 24.0, 31.0, 48.09999999999991, 3.0559517607167566, 79.81139047726826, 2.959535783375896], "isController": false}, {"data": ["Add Product 2 to Cart-0", 1789, 0, 0.0, 6.264952487423147, 2, 129, 5.0, 8.0, 12.0, 25.09999999999991, 3.0559361003590597, 3.1296264351924608, 2.953240048670352], "isController": false}, {"data": ["Add Product 2 to Cart", 1789, 0, 0.0, 23.519843487982087, 13, 296, 20.0, 34.0, 42.0, 60.0, 3.055701214252651, 82.93423291427042, 5.912306197722999], "isController": false}, {"data": ["Login", 1820, 0, 0.0, 18.41758241758239, 11, 728, 16.0, 25.0, 31.0, 48.0, 3.0534709744095645, 31.154890329850364, 3.0498861344735193], "isController": false}, {"data": ["Login-0", 1820, 0, 0.0, 11.903296703296691, 7, 450, 11.0, 15.0, 19.0, 31.789999999999964, 3.0534914661624493, 2.3944302774231216, 0.8254460645612116], "isController": false}, {"data": ["Login-1", 1820, 0, 0.0, 6.365384615384626, 3, 278, 5.0, 8.0, 11.0, 29.0, 3.053757883980691, 28.76317850682985, 2.2246546222904193], "isController": false}, {"data": ["Logout-1", 1784, 0, 0.0, 6.982062780269062, 3, 279, 5.0, 8.0, 12.0, 35.30000000000018, 3.0592944073560253, 28.17598198806121, 2.1970692711968463], "isController": false}, {"data": ["Logout-0", 1784, 0, 0.0, 5.019618834080728, 1, 260, 4.0, 6.0, 8.0, 26.600000000000364, 3.0592996535994783, 4.158735466611791, 3.2542152586643], "isController": false}, {"data": ["Look at Product", 1809, 0, 0.0, 20.066887783305667, 11, 466, 17.0, 28.0, 37.0, 59.90000000000009, 3.0553819649703584, 327.9160403330687, 2.2649167460139847], "isController": false}, {"data": ["Logout", 1784, 0, 0.0, 12.144058295964147, 5, 538, 9.0, 15.0, 22.75, 49.30000000000018, 3.0592681764086525, 32.334433079366065, 5.451232209108011], "isController": false}, {"data": ["List Products with different page", 1796, 0, 0.0, 13.838530066815132, 7, 252, 12.0, 19.0, 28.0, 44.0, 3.0560329425377324, 352.6502532691555, 2.67779256761643], "isController": false}, {"data": ["List Products", 1813, 0, 0.0, 14.414230557087679, 7, 553, 11.0, 20.0, 29.0, 54.5799999999997, 3.0488009955268556, 351.7436286465165, 2.2974886647411967], "isController": false}, {"data": ["Home", 1830, 0, 0.0, 7.987431693989079, 3, 712, 6.0, 9.0, 13.0, 26.690000000000055, 3.0604053782861733, 27.25075804610676, 0.4423242148304234], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 28836, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9999481022731205, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [0.9997214484679666, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [1.0, 500, 1500, "Look at Product"], "isController": false}, {"data": [1.0, 500, 1500, "Logout"], "isController": false}, {"data": [0.9997219132369299, 500, 1500, "List Products with different page"], "isController": false}, {"data": [0.9997249724972497, 500, 1500, "List Products"], "isController": false}, {"data": [1.0, 500, 1500, "Home"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 28903, 0, 0.0, 12.072864408538925, 2, 612, 10.0, 20.0, 24.0, 34.0, 48.36876940197973, 1502.4687156150899, 46.221977605617894], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 1806, 0, 0.0, 15.625692137320048, 8, 153, 14.0, 23.0, 27.0, 36.0, 3.0601404004615627, 77.73794852618488, 2.613605170722285], "isController": false}, {"data": ["Add Product to Cart-0", 1806, 0, 0.0, 5.791251384274638, 2, 409, 5.0, 7.0, 9.0, 13.0, 3.0601611413757173, 2.7869523247735803, 2.5789083481949966], "isController": false}, {"data": ["Add Product to Cart", 1806, 0, 0.0, 21.502214839424123, 12, 454, 19.0, 30.0, 35.0, 47.86000000000013, 3.060088549406197, 80.52351754721873, 5.19240805808492], "isController": false}, {"data": ["Add Product 2 to Cart-1", 1795, 0, 0.0, 16.35431754874651, 8, 178, 14.0, 24.0, 27.199999999999818, 37.039999999999964, 3.0566718888359103, 79.3558871532508, 2.958541692387269], "isController": false}, {"data": ["Add Product 2 to Cart-0", 1795, 0, 0.0, 5.8935933147632396, 2, 488, 5.0, 7.0, 9.0, 12.0, 3.056770789872978, 3.13177482636435, 2.9516161318524032], "isController": false}, {"data": ["Add Product 2 to Cart", 1795, 0, 0.0, 22.36211699164344, 12, 532, 20.0, 31.0, 36.0, 48.0, 3.0566458633108837, 82.48685832520924, 5.910012005210772], "isController": false}, {"data": ["Login", 1825, 0, 0.0, 16.848219178082207, 10, 121, 15.0, 23.0, 26.0, 33.48000000000002, 3.064198741411848, 31.264294565832422, 3.054565732204981], "isController": false}, {"data": ["Login-0", 1825, 0, 0.0, 10.80493150684932, 6, 114, 10.0, 14.400000000000091, 16.0, 21.74000000000001, 3.06423475564197, 2.4028024341987066, 0.8253593707237135], "isController": false}, {"data": ["Login-1", 1825, 0, 0.0, 5.95287671232877, 3, 91, 5.0, 8.0, 10.0, 13.0, 3.0643119318429863, 28.862586506470315, 2.229298408467743], "isController": false}, {"data": ["Logout-1", 1788, 0, 0.0, 5.944071588366892, 3, 120, 5.0, 8.0, 10.0, 14.0, 3.05224667888931, 28.111072684184652, 2.186345525142626], "isController": false}, {"data": ["Logout-0", 1788, 0, 0.0, 4.59451901565995, 2, 181, 4.0, 6.0, 7.0, 12.0, 3.052251889306364, 4.149154912025838, 3.245561575725038], "isController": false}, {"data": ["Look at Product", 1813, 0, 0.0, 18.842250413678958, 10, 331, 16.0, 26.0, 30.0, 42.0, 3.0609488434914742, 328.70996143212903, 2.2665433611556645], "isController": false}, {"data": ["Logout", 1788, 0, 0.0, 10.63087248322148, 5, 215, 9.0, 14.0, 17.0, 25.1099999999999, 3.052215416760555, 32.25989009335887, 5.43184592510891], "isController": false}, {"data": ["List Products with different page", 1798, 0, 0.0, 13.283092324805313, 6, 612, 11.0, 17.0, 19.0, 36.00999999999999, 3.05427539099991, 354.45137208024096, 2.6734398543018907], "isController": false}, {"data": ["List Products", 1818, 0, 0.0, 12.338283828382846, 7, 503, 11.0, 17.0, 19.0, 25.0, 3.0616317587878767, 355.6356813851568, 2.3041885954848507], "isController": false}, {"data": ["Home", 1832, 0, 0.0, 6.385371179039285, 3, 124, 6.0, 9.0, 10.0, 16.0, 3.0683426427608382, 27.321433805364574, 0.4404749692244563], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 28903, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 144457, 0, 0.0, 14.082522826861933, 2, 313, 11.0, 24.0, 28.0, 37.0, 241.17447697976368, 7404.816503036761, 194.03653830963583], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 9025, 0, 0.0, 20.07257617728536, 9, 305, 18.0, 29.0, 34.0, 48.0, 15.278069326038231, 376.1983107417524, 12.279404358439589], "isController": false}, {"data": ["Add Product to Cart-0", 9025, 0, 0.0, 6.276232686980624, 2, 151, 5.0, 9.0, 11.0, 18.0, 15.278431425659639, 12.656898195917739, 8.104702315528812], "isController": false}, {"data": ["Add Product to Cart", 9025, 0, 0.0, 26.451634349030613, 12, 313, 24.0, 37.0, 43.0, 64.0, 15.27786241967484, 388.8496428217746, 20.38363853878884], "isController": false}, {"data": ["Add Product 2 to Cart-1", 8961, 0, 0.0, 20.796674478294808, 9, 235, 19.0, 30.0, 35.0, 50.3799999999992, 15.26791692862875, 384.48093091740395, 14.003936565988035], "isController": false}, {"data": ["Add Product 2 to Cart-0", 8961, 0, 0.0, 6.480526726927779, 2, 180, 6.0, 9.0, 11.0, 18.0, 15.268359175327994, 14.387968696754132, 13.970479492353894], "isController": false}, {"data": ["Add Product 2 to Cart", 8961, 0, 0.0, 27.38600602611319, 12, 239, 25.0, 39.0, 46.0, 66.0, 15.267786860945748, 398.8650848994841, 27.973773093464718], "isController": false}, {"data": ["Login", 9130, 0, 0.0, 16.184556407447992, 6, 203, 15.0, 24.0, 28.0, 39.0, 15.28673084972792, 158.31001465048138, 10.530022041125994], "isController": false}, {"data": ["Login-0", 9130, 0, 0.0, 8.983023001095276, 3, 151, 8.0, 15.0, 17.0, 25.0, 15.286910018200297, 7.160263062417642, 4.128668497370417], "isController": false}, {"data": ["Login-1", 9130, 0, 0.0, 7.1161007667031635, 3, 191, 6.0, 10.0, 12.0, 17.0, 15.28719157714255, 151.154391020261, 6.401594865458482], "isController": false}, {"data": ["Logout-1", 8938, 0, 0.0, 7.260013425822329, 3, 158, 6.0, 10.0, 12.0, 18.0, 15.275707898658718, 143.5355805811537, 10.26474652235384], "isController": false}, {"data": ["Logout-0", 8938, 0, 0.0, 5.192436786753184, 2, 200, 4.0, 7.0, 9.0, 15.0, 15.275838436388558, 18.445270747487214, 15.46610311500717], "isController": false}, {"data": ["Look at Product", 9062, 0, 0.0, 23.044912822776382, 10, 216, 21.0, 33.0, 38.0, 53.0, 15.279402987087876, 1594.1712243513166, 6.546772016410773], "isController": false}, {"data": ["Logout", 8938, 0, 0.0, 12.570709330946542, 5, 242, 11.0, 17.0, 20.0, 31.0, 15.275603470081146, 161.97958636620774, 25.730541572098524], "isController": false}, {"data": ["List Products with different page", 8985, 0, 0.0, 14.997106288258186, 7, 150, 13.0, 21.0, 25.0, 39.0, 15.25751838204079, 1774.8799184164275, 12.58475127729712], "isController": false}, {"data": ["List Products", 9091, 0, 0.0, 14.907160928390718, 7, 198, 13.0, 21.0, 25.0, 37.0, 15.265932168951267, 1774.604265466076, 6.727715347815902], "isController": false}, {"data": ["Home", 9157, 0, 0.0, 7.693349350223887, 3, 191, 7.0, 11.0, 14.0, 21.0, 15.294703225634036, 136.1885781360656, 2.195626341961136], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 144457, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

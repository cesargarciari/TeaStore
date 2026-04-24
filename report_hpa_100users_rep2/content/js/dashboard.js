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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 57995, 0, 0.0, 13.45469437020425, 2, 276, 12.0, 24.0, 28.0, 40.0, 96.98241624093846, 3033.1900311143904, 92.43814061729195], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 3626, 0, 0.0, 18.35576392719247, 9, 267, 16.0, 26.0, 29.649999999999636, 42.460000000000036, 6.131556207904736, 157.46488247780144, 5.231991882790213], "isController": false}, {"data": ["Add Product to Cart-0", 3626, 0, 0.0, 6.028405956977379, 3, 125, 5.0, 8.0, 10.0, 15.0, 6.131722107513135, 5.576108774653294, 5.134637545002883], "isController": false}, {"data": ["Add Product to Cart", 3626, 0, 0.0, 24.48648648648644, 12, 276, 22.0, 34.0, 39.0, 57.0, 6.131462893319986, 163.03835910867198, 10.366332740295515], "isController": false}, {"data": ["Add Product 2 to Cart-1", 3604, 0, 0.0, 18.665094339622627, 9, 189, 17.0, 27.0, 31.0, 39.0, 6.125511804867437, 160.74429811082604, 5.925144860004691], "isController": false}, {"data": ["Add Product 2 to Cart-0", 3604, 0, 0.0, 6.050221975582685, 3, 166, 5.0, 8.0, 10.0, 15.0, 6.125709623686984, 6.269046902620083, 5.909839747743652], "isController": false}, {"data": ["Add Product 2 to Cart", 3604, 0, 0.0, 24.819922308546033, 12, 200, 23.0, 35.0, 40.0, 51.0, 6.125428516555143, 167.01087169551488, 11.834632842893976], "isController": false}, {"data": ["Login", 3665, 0, 0.0, 19.049931787175947, 7, 180, 18.0, 26.0, 29.0, 38.0, 6.146028977730078, 62.72402211428008, 6.096214988387107], "isController": false}, {"data": ["Login-0", 3665, 0, 0.0, 12.065484311050476, 3, 122, 11.0, 16.0, 18.0, 24.0, 6.146111431599565, 4.787634372819933, 1.6560745203433773], "isController": false}, {"data": ["Login-1", 3665, 0, 0.0, 6.883765347885397, 3, 156, 6.0, 10.0, 11.0, 15.0, 6.1465958927658, 57.94179607902946, 4.440572249754723], "isController": false}, {"data": ["Logout-1", 3584, 0, 0.0, 6.625837053571419, 3, 158, 6.0, 9.0, 10.0, 15.0, 6.1041867499633815, 56.23876501882862, 4.365504055796934], "isController": false}, {"data": ["Logout-0", 3584, 0, 0.0, 4.671595982142864, 2, 164, 4.0, 6.0, 8.0, 12.0, 6.104249129667605, 8.282827850040537, 6.486002548724137], "isController": false}, {"data": ["Look at Product", 3630, 0, 0.0, 21.436363636363655, 11, 204, 19.0, 30.0, 35.0, 52.0, 6.11838312876921, 666.5490461806246, 4.498145365114092], "isController": false}, {"data": ["Logout", 3584, 0, 0.0, 11.404017857142827, 5, 171, 10.0, 16.0, 18.0, 24.0, 6.104134767850421, 64.52095877303314, 10.851347914818025], "isController": false}, {"data": ["List Products with different page", 3610, 0, 0.0, 14.028254847645412, 6, 196, 13.0, 19.0, 22.0, 33.0, 6.119795419138177, 712.9806760387336, 5.3516622936688085], "isController": false}, {"data": ["List Products", 3645, 0, 0.0, 13.692181069958846, 7, 137, 12.0, 19.0, 22.0, 32.0, 6.126266641343644, 714.568799381995, 4.5791006909487555], "isController": false}, {"data": ["Home", 3673, 0, 0.0, 6.964878845630278, 3, 153, 6.0, 10.0, 12.0, 19.0, 6.142458890009348, 54.6942774991262, 0.8817787664368888], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 57995, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

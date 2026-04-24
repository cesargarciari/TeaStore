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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9998749452885638, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.9997776542523624, 500, 1500, "Add Product to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product to Cart-0"], "isController": false}, {"data": [0.9996108949416342, 500, 1500, "Add Product to Cart"], "isController": false}, {"data": [0.9998320456835741, 500, 1500, "Add Product 2 to Cart-1"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 2 to Cart-0"], "isController": false}, {"data": [0.9996640913671482, 500, 1500, "Add Product 2 to Cart"], "isController": false}, {"data": [0.9998350379412735, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "Login-0"], "isController": false}, {"data": [1.0, 500, 1500, "Login-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-1"], "isController": false}, {"data": [1.0, 500, 1500, "Logout-0"], "isController": false}, {"data": [0.9997785405824383, 500, 1500, "Look at Product"], "isController": false}, {"data": [1.0, 500, 1500, "Logout"], "isController": false}, {"data": [0.9997769599643136, 500, 1500, "List Products with different page"], "isController": false}, {"data": [0.9997242748428367, 500, 1500, "List Products"], "isController": false}, {"data": [1.0, 500, 1500, "Home"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 143937, 0, 0.0, 19.81414090886999, 2, 6538, 14.0, 36.0, 44.0, 72.0, 240.3741457972893, 7366.196778416853, 193.3959289840666], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 8995, 0, 0.0, 29.5346303501945, 10, 6133, 25.0, 44.0, 55.0, 87.03999999999905, 15.201831993983488, 374.3075195568315, 12.216923049703821], "isController": false}, {"data": ["Add Product to Cart-0", 8995, 0, 0.0, 8.402668148971635, 2, 353, 7.0, 13.0, 17.0, 32.0, 15.202474310438076, 12.59678479076528, 8.069199210827644], "isController": false}, {"data": ["Add Product to Cart", 8995, 0, 0.0, 38.0622568093385, 13, 6163, 32.0, 57.0, 71.0, 121.03999999999905, 15.201600773346584, 386.8978872975373, 20.28547278277597], "isController": false}, {"data": ["Add Product 2 to Cart-1", 8931, 0, 0.0, 30.821744485500034, 10, 6521, 26.0, 46.0, 58.0, 97.68000000000029, 15.185030902243494, 382.37487540274935, 13.926530593539859], "isController": false}, {"data": ["Add Product 2 to Cart-0", 8931, 0, 0.0, 8.5911991938193, 3, 235, 7.0, 13.0, 17.0, 32.0, 15.185573110432493, 14.313010853684766, 13.892905197819678], "isController": false}, {"data": ["Add Product 2 to Cart", 8931, 0, 0.0, 39.53543836076592, 14, 6538, 33.0, 58.80000000000018, 74.0, 123.0, 15.184746903882644, 396.67995614949524, 27.818419454192426], "isController": false}, {"data": ["Login", 9093, 0, 0.0, 21.44044869679983, 6, 604, 18.0, 33.0, 40.0, 69.0, 15.233043961898126, 157.75208206031817, 10.497406386532836], "isController": false}, {"data": ["Login-0", 9093, 0, 0.0, 11.715605410755531, 3, 321, 10.0, 19.0, 24.0, 40.0, 15.23342675876303, 7.139680632874918, 4.114216841476368], "isController": false}, {"data": ["Login-1", 9093, 0, 0.0, 9.622236885516331, 3, 428, 8.0, 14.0, 18.0, 31.0, 15.233503320444692, 150.61712262138806, 6.38348542091076], "isController": false}, {"data": ["Logout-1", 8899, 0, 0.0, 9.974379143724034, 3, 347, 8.0, 15.0, 19.0, 32.0, 15.17585505941418, 142.5707890237034, 10.188252176551691], "isController": false}, {"data": ["Logout-0", 8899, 0, 0.0, 6.926733340824803, 2, 216, 6.0, 11.0, 14.0, 25.0, 15.176062102649459, 18.33071150901116, 15.364590105950196], "isController": false}, {"data": ["Look at Product", 9031, 0, 0.0, 34.090023253238904, 11, 6124, 28.0, 51.0, 65.0, 126.36000000000058, 15.212872404580539, 1580.8545326718374, 6.5239893108978135], "isController": false}, {"data": ["Logout", 8899, 0, 0.0, 17.04483649848302, 6, 356, 14.0, 25.0, 32.0, 57.0, 15.175725660260882, 160.89987850327933, 25.552414788956966], "isController": false}, {"data": ["List Products with different page", 8967, 0, 0.0, 20.614586818333805, 7, 532, 17.0, 31.0, 39.0, 67.31999999999971, 15.197042957449296, 1761.8233907401122, 12.534790542819326], "isController": false}, {"data": ["List Products", 9067, 0, 0.0, 20.539208117348753, 7, 656, 17.0, 31.0, 39.0, 70.31999999999971, 15.231155078255583, 1764.130779467527, 6.717136036372005], "isController": false}, {"data": ["Home", 9118, 0, 0.0, 10.229107260364094, 3, 327, 8.0, 16.0, 20.0, 37.0, 15.230605532661949, 135.6178332488395, 2.186424817677057], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 143937, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

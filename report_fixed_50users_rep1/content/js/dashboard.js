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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 28921, 0, 0.0, 14.4027523253, 2, 271, 13.0, 29.0, 35.0, 50.0, 48.35729656611528, 1503.2958692501409, 46.21022380987813], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 1809, 0, 0.0, 19.686567164179156, 8, 261, 17.0, 30.0, 35.0, 47.90000000000009, 3.0719122951209408, 78.03304242643712, 2.6236431697499], "isController": false}, {"data": ["Add Product to Cart-0", 1809, 0, 0.0, 6.5135433941404015, 2, 131, 6.0, 9.0, 11.0, 16.0, 3.071943594428727, 2.7976667068560888, 2.5882012328954382], "isController": false}, {"data": ["Add Product to Cart", 1809, 0, 0.0, 26.31122166943062, 12, 271, 23.0, 39.0, 45.0, 64.80000000000018, 3.0718601310252778, 80.82930804397735, 5.2117295302720015], "isController": false}, {"data": ["Add Product 2 to Cart-1", 1794, 0, 0.0, 20.154960981047896, 9, 169, 18.0, 31.5, 36.0, 51.0, 3.0625570815230843, 79.49346116482583, 2.9661769969997525], "isController": false}, {"data": ["Add Product 2 to Cart-0", 1794, 0, 0.0, 6.866220735785947, 2, 201, 6.0, 9.0, 11.0, 18.0, 3.062593678833961, 3.1396796626665733, 2.956559815002441], "isController": false}, {"data": ["Add Product 2 to Cart", 1794, 0, 0.0, 27.144370122631003, 12, 246, 24.0, 41.0, 46.0, 70.14999999999986, 3.0625257130956265, 82.63225693442712, 5.922640818141623], "isController": false}, {"data": ["Login", 1826, 0, 0.0, 19.75465498357069, 10, 233, 19.0, 28.0, 31.0, 41.0, 3.0673455366426845, 31.29642626580498, 3.0577243201151347], "isController": false}, {"data": ["Login-0", 1826, 0, 0.0, 12.469331872946336, 6, 213, 12.0, 17.0, 19.0, 26.0, 3.067376452426268, 2.4052906443128386, 0.8262026139893196], "isController": false}, {"data": ["Login-1", 1826, 0, 0.0, 7.168674698795186, 3, 45, 7.0, 11.0, 12.0, 16.0, 3.067438285863074, 28.892033464013036, 2.231597509491252], "isController": false}, {"data": ["Logout-1", 1787, 0, 0.0, 6.993284834918865, 3, 40, 6.0, 10.0, 12.0, 15.0, 3.05720933415452, 28.156778545323515, 2.1898978007595975], "isController": false}, {"data": ["Logout-0", 1787, 0, 0.0, 4.980973698936751, 2, 32, 4.0, 7.0, 8.0, 14.0, 3.0571518020430055, 4.155815730902211, 3.252901685282731], "isController": false}, {"data": ["Look at Product", 1817, 0, 0.0, 22.943863511282338, 10, 223, 20.0, 35.0, 40.0, 57.819999999999936, 3.0698582830419476, 329.8020880807092, 2.2724393763178257], "isController": false}, {"data": ["Logout", 1787, 0, 0.0, 12.099048684946851, 6, 50, 11.0, 18.0, 20.0, 26.0, 3.057125651799034, 32.311788017012645, 5.4427117192097665], "isController": false}, {"data": ["List Products with different page", 1801, 0, 0.0, 15.373126041088284, 7, 225, 13.0, 22.0, 26.0, 46.98000000000002, 3.0675734829478003, 355.7901158073926, 2.6846124931656643], "isController": false}, {"data": ["List Products", 1823, 0, 0.0, 14.50575973669772, 6, 106, 13.0, 21.600000000000136, 25.0, 36.0, 3.0713865718237767, 356.54207649814333, 2.311695732764939], "isController": false}, {"data": ["Home", 1832, 0, 0.0, 7.426855895196519, 3, 156, 7.0, 11.0, 12.0, 18.670000000000073, 3.0636015043754985, 27.27921730165605, 0.43979435658515453], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 28921, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 28797, 0, 0.0, 11.38115081432088, 2, 196, 10.0, 19.0, 23.0, 32.0, 48.085962612608846, 1501.2901570183806, 45.96155331335109], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Add Product to Cart-1", 1801, 0, 0.0, 14.712937257079401, 8, 143, 13.0, 20.0, 24.0, 32.0, 3.045650942359238, 77.34797111620317, 2.6013503872593366], "isController": false}, {"data": ["Add Product to Cart-0", 1801, 0, 0.0, 5.455857856746255, 3, 90, 5.0, 7.0, 8.0, 13.0, 3.0456715443634783, 2.7738767236539266, 2.5662000348578036], "isController": false}, {"data": ["Add Product to Cart", 1801, 0, 0.0, 20.27096057745699, 11, 149, 18.0, 28.0, 32.0, 43.98000000000002, 3.0455788375392534, 80.11993221748071, 5.16741072372237], "isController": false}, {"data": ["Add Product 2 to Cart-1", 1788, 0, 0.0, 15.46476510067115, 9, 145, 14.0, 22.0, 25.0, 35.0, 3.04853097634831, 79.12288659215413, 2.950979956505579], "isController": false}, {"data": ["Add Product 2 to Cart-0", 1788, 0, 0.0, 5.315436241610737, 3, 40, 5.0, 7.0, 8.0, 12.0, 3.0485569652195115, 3.1236772856078447, 2.943432473951718], "isController": false}, {"data": ["Add Product 2 to Cart", 1788, 0, 0.0, 20.887024608501157, 12, 155, 19.0, 29.0, 33.0, 47.2199999999998, 3.0484997902877664, 82.24569587751355, 5.894327038982605], "isController": false}, {"data": ["Login", 1815, 0, 0.0, 16.49696969696969, 10, 192, 15.0, 22.0, 24.0, 31.0, 3.04676405120578, 31.086434133556537, 3.0372134058877243], "isController": false}, {"data": ["Login-0", 1815, 0, 0.0, 10.66446280991736, 6, 182, 10.0, 14.0, 15.0, 20.0, 3.046789623792825, 2.3891502079874574, 0.8206607588604504], "isController": false}, {"data": ["Login-1", 1815, 0, 0.0, 5.736639118457301, 3, 19, 5.0, 8.0, 9.0, 12.0, 3.0469021482758563, 28.698604707149055, 2.216660002442558], "isController": false}, {"data": ["Logout-1", 1785, 0, 0.0, 5.524369747899151, 3, 34, 5.0, 8.0, 9.0, 12.0, 3.0581668474154635, 28.165597205053942, 2.1896801886683352], "isController": false}, {"data": ["Logout-0", 1785, 0, 0.0, 4.304761904761909, 2, 181, 4.0, 5.400000000000091, 7.0, 10.0, 3.0581668474154635, 4.157195558205395, 3.2519240297173293], "isController": false}, {"data": ["Look at Product", 1803, 0, 0.0, 17.59456461453135, 10, 135, 15.0, 24.0, 29.0, 43.0, 3.0399800369586036, 329.2833219137374, 2.250663256875784], "isController": false}, {"data": ["Logout", 1785, 0, 0.0, 9.926050420168076, 5, 189, 9.0, 13.0, 15.0, 21.0, 3.0581458898347917, 32.32257125554878, 5.441566927137318], "isController": false}, {"data": ["List Products with different page", 1795, 0, 0.0, 11.810584958217285, 7, 196, 10.0, 16.0, 18.0, 28.0, 3.0519425316670916, 356.9617872911885, 2.671514029690555], "isController": false}, {"data": ["List Products", 1807, 0, 0.0, 11.629773104593252, 7, 172, 10.0, 16.0, 18.0, 25.0, 3.0402500845448626, 355.96578625039746, 2.2881103581757825], "isController": false}, {"data": ["Home", 1825, 0, 0.0, 6.300821917808235, 3, 104, 6.0, 8.0, 10.0, 16.0, 3.0485105729028334, 27.144843167703158, 0.4376279826335122], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 28797, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});

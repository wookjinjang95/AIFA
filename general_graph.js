function alert_no_data(){
    var make = document.getElementById('make').value;
    var model = document.getElementById('model').value;
    var file_location = github_url + make + "/" + model + ".csv";

    fetch(file_location).then(response => {
        if(!response.ok){
            alert("No data available for " + make + " " + model);
        }else{
            update_miles_vs_price(file_location);
            update_side_trim_bars(file_location);
            add_raw_data_table(".raw_data_table_container", file_location);
        }
    });
}

function update_model_list(){
    var make = document.getElementById('make').value;
    var data = undefined;
    if(make == "tesla"){
        data = [
            "model_3", "model_s", "model_x"
        ]
    }
    if(make == "bmw"){
        data = [
            "m3", "m4", "m5"
        ]
    }

    var dropdown = d3.select("#model");
    dropdown.selectAll("option").remove().exit();
    var options = dropdown.selectAll("option").data(data);

    options.enter()
        .append("option")
        .merge(options)
            .text(function(d){
                return (d.charAt(0).toUpperCase() + d.slice(1)).replace("_", " ");
            })
            .attr("value", function(d){
                return d;
            })
}

function update_year_selection(){
    var make = document.getElementById('make').value;
    var model = document.getElementById('model').value;
    var file_location = github_url + make + "/" + model + ".csv";
    d3.csv(file_location).then(function(data){
        var unique_years = get_unique_year(data);
        var dropdown = d3.select("#year");
        dropdown.selectAll("option").remove().exit();
        var options = dropdown.selectAll("option").data(unique_years);

        options.enter()
            .append("option")
            .merge(options)
                .text(function(d){
                    return d;
                })
                .attr("value", function(d){
                    return d;
                })
    });
}

function get_certain_points(miles, equation) {
    return equation[0] + (Math.log(miles)*equation[1]);
}

function generate_table_data(equation){
    string_data = d3.selectAll(".tick>text")
          .nodes()
          .map(function(t){
            return t.innerHTML ;
          });

    x_values = []
    keys = {}
    for(var i = 0; i < string_data.length; i++){    
        var int_version = parseInt(string_data[i].split(",").join(""))
        if(int_version >= 10000 && !keys.hasOwnProperty(int_version)){
            x_values.push(int_version)
            keys[int_version] = 1;
        }
    }
    data = []
    for(var i = 0; i < x_values.length; i++){
        content = {
            "MILES": x_values[i],
            "PRICE": get_certain_points(x_values[i], equation).toFixed(2)
        }
        data.push(content);
    }
    data.sort( function( a, b )
    {
        return a.MILES - b.MILES;
    });
    return data;
}

function get_total_for_each_trims(data){
    result = {};
    for(var i = 0; i < data.length; i++){
        if(data[i].Trim in result){
            result[data[i].Trim] += 1;
        }else{
            result[data[i].Trim] = 1;
        }
    }
    list_format = [];
    for(var trim_key in result){
        tmp = {"trim": trim_key, "value": result[trim_key]};
        list_format.push(tmp);
    }
    return list_format;
}

var row_position = 0;

function get_background_row_color(){
    var color = "#3d3d4d"
    if(row_position % 2 == 1){
        color = "#454569"
    }
    row_position += 1;
    return color;
}

function make_x_gridlines(x) {		
    return d3.axisBottom(x)
        .ticks(10)
}

function make_y_gridlines(y) {		
    return d3.axisLeft(y)
        .ticks(5)
}

function update_miles_vs_price(file_location){
    d3.csv(file_location).then(function(data){
        //remove the axis first.
        // svg_depreciation.selectAll("line-hover").remove()

        var dot_tooltip = d3.select("body").append("div")
            .attr("class", "dot_tooltip")
            .style("position", "absolute");

        // var axis_hover_line = svg_depreciation.append("path")
        //     .attr("class", "line-hover")
        //     .style("stroke", "gray")
        //     .style("position", "relative")
        //     .style("stroke-width", "1px")
        //     .style("opacity", "0");

        // var yaxis_hover_line = svg_depreciation.append("path")
        //     .attr("class", "line-hover")
        //     .style("stroke", "gray")
        //     .style("position", "relative")
        //     .style("stroke-width", "1px")
        //     .style("opacity", "0");

        mapping = map_trim_to_color(data);
        var trims = get_unique_trims(data);
        var max_y = get_y_max_value(data);
        var max_x = get_x_max_value(data);
    
        var x = d3.scaleLinear().domain([0, max_x]).range([0, dep_width]);
        var y = d3.scaleLinear().domain([0, max_y]).range([dep_height - margin.top - margin.bottom, 0]);
    
        svg_depreciation.select(".x-axis").remove();
        svg_depreciation.select(".y-axis").remove();

        svg_depreciation.selectAll(".grid").remove();

        svg_depreciation.append("g")		
            .attr("class", "grid")
            .attr("transform", "translate(0," + dep_height + ")")
            .style("stroke", "lightgrey")
            .style("stroke-opacity", "0.2")
            .call(make_x_gridlines(x)
                .tickSize(-dep_height)
                .tickFormat("")
        )

        svg_depreciation.append("g")			
            .attr("class", "grid")
            .style("stroke", "lightgrey")
            .style("stroke-opacity", "0.2")
            .call(make_y_gridlines(y)
                .tickSize(-dep_width)
                .tickFormat("")
        )

        svg_depreciation.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        svg_depreciation.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (dep_height - margin.top - margin.bottom)  + ")")
            .call(d3.axisBottom(x));
        
        var circles = svg_depreciation.selectAll("circle")
            .data(data);
            
        circles.exit().remove();

        circles.enter()
            .append("circle")
                .attr("r", 5)
            .merge(circles)
                .attr("cx", function(d) { return x(parseInt(d.Miles))})
                .attr("cy", function(d) { return y(parseInt(d.Price))})
                .attr("class", "dot")
                .style("position", "absolute");
            
        svg_depreciation.selectAll("circle")
            .attr("fill", function(d) {
                return mapping.get(d.Trim);
            })
            .on("mousemove", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("r", 10);

                var border_color = mapping.get(d.Trim)
                var xPosition = event.clientX + 50;
                var yPosition = window.scrollY + (event.clientY);
                dot_tooltip
                    .html(
                        "Trim: " + d.Trim + "</br>" + 
                        "Price: " + d.Price + "</br>" + 
                        "Miles: " + d.Miles)
                    //don't use attr here, use style here.
                    .style("display", "inline-block")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .style("padding", "10px")
                    .style("border", "3px solid " + border_color)
                    .style("background-color", "#33334d")
                    .style("color", "white")
                    .style("border-radius", "10px")
                    .style("position", "absolute")
                //make the color red when hover
                d3.select(this).attr("fill", "red")
                // axis_hover_line
                //     .style("opacity", "0.2")
                //     .attr("d", d3.line()([[x(d.Miles), 0], [x(d.Miles), dep_height - margin.top - margin.bottom]]))
                // yaxis_hover_line
                //     .style("opacity", "0.2")
                //     .attr("d", d3.line()([[0, y(d.Price)], [dep_width, y(d.Price)]]))
            })
            .on("mouseout", function(event, d) {
                // axis_hover_line.style("opacity", "0")
                // yaxis_hover_line.style("opacity", "0")
                d3.select(this).attr("fill", mapping.get(d.Trim))
                dot_tooltip.style("display", "none");
                d3.select(this)
                    .transition()
                    .duration(500)
                    .attr("r", 5);
            })
    
    
        svg_depreciation.selectAll(".legend_text").remove().exit();
        
         //adding legend text
        svg_depreciation.selectAll("legend")
            .data(trims)
            .enter()
            .append("text")
                .attr("class", "legend_text")
                .attr("x", function(d,i){
                    return dep_width - 150 - (150*i)
                })
                .attr("y", margin.top - 60)
                .style("stroke", "black")
                .text(function(d){ 
                    return d;})
                .attr("font-size", "15px");


        //rectangle legend
        var legend_rect = svg_depreciation.selectAll(".rect_legend")
            .data(trims);

        legend_rect.exit().remove();

        legend_rect
            .enter()
            .append("rect")
            .merge(legend_rect)
                .attr("class", "rect_legend")
                .attr("y", margin.top - 73)
                .attr("x", function(d,i){
                    return dep_width - 180 - (150*i)
                })
                .style("fill", function(d){
                    return mapping.get(d);
                })
                .attr("height", 15)
                .attr("width", 15);
            
        //adding linear regression
        new_data = data.map(d => [parseInt(d.Miles), parseInt(d.Price)])
        var result = regression(new_data);
        var m = result[0];
        var b = result[1];
    
        var log_result = logarithmic(new_data);
        log_data_points = log_result.points;
        log_data_points.sort( function( a, b )
        {
            // Sort by the 2nd value in each array
            if ( a[0] == b[0] ) return 0;
            return a[0] < b[0] ? -1 : 1;
        });
    
        d3.selectAll(".linear-line").remove();

        svg_depreciation.append("line")
                .attr("class", "linear-line")
                .style("stroke", "red")
                .style("stroke-width", "2px")
                .attr("x1", x(0))
                .attr("y1", y(b))
                .attr("x2", x((0 - b)/m))
                .attr("y2", y(0));
    
        d3.selectAll(".log-line").remove();

        svg_depreciation.append("path")
            .datum(log_data_points)
            .attr("class", "log-line")
            .attr("fill", "none")
            .style("stroke", "steelblue")
            .style("stroke-width", "2px")
            .attr("d", d3.line()
                .x(function(d) { return x(d[0]);})
                .y(function(d) { return y(d[1]);})
            )
        add_table(
            log_result.equation, ".mile_display"
        )
    });
}

function add_table(equation, id){
    var data = generate_table_data(equation)
    var columns = ["MILES", "PRICE"]
    var text_columns = ["MILES (mi.)", "PRICE (AVG)"]
    //delete the table before adding new one
    d3.select(id).selectAll("table").remove()

    var table = d3.select(id).append('table')
        .style("width", "100%")
    
    var thead = table.append("thead")
    var tbody = table.append("tbody")
    var row_counter = 0;

    // add header row
    thead.append("tr")
        .style("background-color", "#454569")
        .style("border-bottom", "5px solid black")
        .selectAll("th") 
        .data(text_columns)
        .enter()
        .append("th")
            .style("padding-left", "10px")
            .style("padding-top", "3px")
            .style("padding-bottom", "3px")
            .style("color", "white")
            .text(function(d){ return d;})

    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append('tr')
            .style("background-color", function(){
                if(row_counter % 2 == 1){
                    row_counter += 1;
                    return "#454569"
                }else{
                    row_counter += 1;
                    return "white";
                }
            })
            .style("color", function(){
                var current_node = d3.select(this);
                if(current_node.attr('style') == "background-color: white;"){
                    return "black";
                }else{
                    return "white";
                }
            });

        
    var cells = rows.selectAll("td")
        .data( function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]};
              });
        }).enter()
        .append('td')
            .style("padding-top", "3px")
            .style("padding-bottom", "3px")
            .style("padding-left", "10px")
            .text(function(d) { return d.value})
            .transition()
            .duration(2000)
            .tween("text", function(d){
                var i = d3.interpolate(0, d.value)
                return function(t) {
                    d3.select(this).text(
                        parseFloat(i(t)).toFixed(2)
                    );
                };
            });
        
}

function add_raw_data_table(id, file_location){
    d3.csv(file_location).then(function(data){
        var columns = Object.keys(data[0]);
        columns.push("Carfax Link")

        //remove the current table away
        d3.select(id).selectAll("table").remove()

        var table = d3.select(id).append('table')
            .style("width", "100%")

        var thead = table.append("thead")
        var tbody = table.append("tbody")

        // add header row
        thead.append("tr")
        .style("border-bottom", "5px solid black")
        .selectAll("th") 
        .data(columns)
        .enter()
        .append("th")
            .style("padding-left", "10px")
            .style("padding-top", "3px")
            .style("padding-bottom", "3px")
            .text(function(d){ return d;})

        var row_counter = 0;
        var rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append('tr')
                .style("background-color", function(){
                    if(row_counter % 2 == 1){
                        row_counter += 1;
                        return "#bdbdbd"
                    }else{
                        row_counter += 1;
                        return "white";
                    }
                })

        var cells = rows.selectAll("td")
            .data( function (row) {
                return columns.map(function (column) {
                    if(column == "Carfax Link"){
                        return {column: column, value: "https://www.carfax.com/vehicle/" + row['Vin']}
                    }else{
                        return {column: column, value: row[column]};
                    }
                    });
            }).enter()
            .append('td')
                .style("padding-top", "3px")
                .style("padding-bottom", "3px")
                .style("padding-left", "10px")
                .html(function(d) { 
                    if(d.column == "Carfax Link"){
                        return "<a target='_blank' href=" + d.value + ">" + d.value + "</a>";
                    }
                    return d.value;
                })
    });
}

function update_maintenance_bar_graph(file_location){
    d3.csv(file_location).then(function(data) {
        var max_x = d3.max(data.map(function (d) { return parseInt(d.mileage)}));
        var max_y = d3.max(data.map(function(d){ return parseInt(d.average)}));

        var sorted_x_axis_values = data.map(function(d) { return parseInt(d.mileage); }).sort(
                function(a,b) {
                    if ( a == b ) return 0;
                    return a < b ? -1 : 1;
                }
            )
        var x = d3.scaleBand().domain(sorted_x_axis_values).range([0, g_width]).padding(0.7);
        var y = d3.scaleLinear().domain([0, max_y]).range([g_height - margin.top - margin.bottom, 0]);

        svg_maintenance_bargraph.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        svg_maintenance_bargraph.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (g_height - margin.top - margin.bottom)  + ")")
            .call(d3.axisBottom(x));

        var bars = svg_maintenance_bargraph.selectAll("bar")
            .data(data);
        
        bars.exit().remove();

        bars.enter().append("rect")
            .style("fill", "steelblue")
            .attr("x", function(d) { return x(parseInt(d.mileage)); })
            .attr("y", "0")
            .transition()
            .duration(2000)
            .attr("y", function(d) { return y(d.average); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return g_height - margin.top - margin.bottom - y(d.average); })
    
    });
}

function update_side_trim_bars(file_location){
    trim_svg_container.selectAll("g").remove();
    trim_svg_container.append("g")
        .attr("transform", "translate(" + h_margin.left + "," + h_margin.top + ")");

    d3.csv(file_location).then(function(data) {
        
        //adding the total of trims section
        trim_count_data = get_total_for_each_trims(data);

        var x = d3.scaleLinear()
            .range([0, trim_width])
            .domain([0, d3.max(trim_count_data, function(d) {
                return d.value;
            })]);
        
        var y = d3.scaleBand()
            .rangeRound([trim_height, 0])
            .padding(0.1)
            .domain(d3.map(trim_count_data, function(d){
                return d.trim;
            }));

        trim_svg_container.append("g")
            .attr("transform", "translate(0," + trim_height + ")")
            .call(d3.axisBottom(x));
      
        // add the y Axis
        trim_svg_container.append("g")
            .call(d3.axisLeft(y));
      
        var bars = trim_svg_container.selectAll(".bar")
            .data(trim_count_data)
            .enter()
            .append("g")

        bars.append("rect")
            .attr("class", "bar")
            .style("fill", function(d){
                return mapping.get(d.trim);
            })
            .attr("y", function(d) {
                return y(d.trim);
            })
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", function(d){
                return x(d.value)
            });

        bars.append("text")
            .attr("class", "label")
            //y position of the label is halfway down the bar
            .attr("y", function (d) {
                return y(d.trim) + y.bandwidth() / 2 + 4;
            })
            //x position is 3 pixels to the right of the bar
            .attr("x", function (d) {
                return x(d.value) + 3;
            })
            .text(function (d) {
                return d.value;
            });
        
    });
}

//Things that need first
update_model_list();

function update_search_selection(){
    update_model_list();
    update_year_selection();
}


make = document.getElementById('make').value;
model = document.getElementById('model').value;
var mapping = undefined;

var element = d3.select("#general_depreciation").node();
width = (typeof width !== 'undefined') ? width : element.getBoundingClientRect().width;
height = (typeof height !== 'undefined') ? height : element.getBoundingClientRect().height;

svg_left = (typeof svg_left !== 'undefined') ? svg_left : 60;
var margin = {top: 40, right: 40, bottom: 30, left: svg_left},
dep_width = parseInt(width) - margin.left - margin.right,
dep_height = parseInt(height) - margin.top - margin.bottom

var svgContainer = d3.select("#general_depreciation")
var svg_depreciation = svgContainer
    .attr("class", "graph")
    .append("svg")
        .attr("width", dep_width)
        .attr("height", dep_height)
    .append("g")
        .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")")

svg_depreciation.append("text")
    .attr("text-anchor", "end")
    .attr("x", dep_width - 60)
    .attr("y", dep_height - 40)
    .style("stroke", "black")
    .text("Miles")

svg_depreciation.append("text")
    .attr("text-anchor", "end")
    .attr("x", margin.right - 20)
    .attr("y", margin.top - 60)
    .style("stroke", "black")
    .text("Price($)");

//starting here is the horizontal bar trim graph
var h_margin = {
    top: 15,
    right: 50,
    bottom: 50,
    left: 70
};

var horizontal_graph_element = d3.select(".trim_total_info").node();
var h_width = horizontal_graph_element.getBoundingClientRect().width;
var h_height = horizontal_graph_element.getBoundingClientRect().height;

var trim_width = h_width - h_margin.left - h_margin.right;
var trim_height = h_height - h_margin.top - h_margin.bottom;

var trim_svg_container = d3.select(".trim_total_info").append("svg")
    .attr('width', h_width)
    .attr('height', h_height)
    .append("g")
    .attr("transform", "translate(" + h_margin.left + "," + h_margin.top + ")");

//starting here is the bar graph for maintenance
var svg_maintenance_bargraph_size = d3.select(".maintenance_graph_container").node();
var bargraph_width = svg_maintenance_bargraph_size.getBoundingClientRect().width;
var bargraph_height = svg_maintenance_bargraph_size.getBoundingClientRect().height;

var g_width = bargraph_width - margin.left - margin.right;
var g_height = bargraph_height - margin.top - margin.bottom;

var svgMainContainer = d3.select(".maintenance_graph_container")
var svg_maintenance_bargraph = svgMainContainer
    .append("svg")
        .attr("width", bargraph_width)
        .attr("height", bargraph_height)
    .append("g")
        .attr("transform",
            "translate(" + 50 + "," + 50 + ")")

svg_maintenance_bargraph.append("text")
    .attr("text-anchor", "end")
    .attr("x", g_width)
    .attr("y", g_height - 40)
    .style("stroke", "black")
    .text("Miles")

svg_maintenance_bargraph.append("text")
    .attr("text-anchor", "end")
    .attr("x", margin.left)
    .attr("y", margin.top - 60)
    .style("stroke", "black")
    .text("Avg Price ($)");

//starting here, it's a half dount graph

//var github_url = "https://raw.githubusercontent.com/wookjinjang95/wookjinjang95.github.io/main/data_scraper/";
var github_url = "data_scraper/";
var file_location = github_url + make + "/" + model + ".csv";
var maintenance_file_loation = github_url +"maintenance_data/" + make + "_" + model + "/report.csv";

update_miles_vs_price(file_location);
update_year_selection();
update_side_trim_bars(file_location);
update_maintenance_bar_graph(maintenance_file_loation);
add_raw_data_table(".raw_data_table_container", file_location);

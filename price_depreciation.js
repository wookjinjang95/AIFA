var margin = {top: 40, right: 30, bottom: 60, left: 40},
    width = 1500 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom

function map_trim_to_color(data){
    var trims = get_unique_trims(data);
    var mapping = new Map();
    for(var i = 0; i < trims.length; i++){
        r = Math.floor(Math.random() * Math.floor(256));
        g = Math.floor(Math.random() * Math.floor(256));
        b = Math.floor(Math.random() * Math.floor(256));
        mapping.set(trims[i], 'rgb(' + r + ',' + g + ',' + b + ')');
    }
    return mapping;
}

function get_x_max_value(data){
    var max = d3.max(data.map(function (d) { return parseInt(d.Miles)}));
    return max + 1000;
}

function get_y_max_value(data){
    var max = d3.max(data.map(function (d) { return parseInt(d.Price)}));
    return max + 1000;
}

function get_unique_trims(data){
    var trims = [];
    for(var i = 0; i < data.length; i++){
        if(!trims.includes(data[i].Trim)){
            trims.push(data[i].Trim)
        }
    }
    return trims;
}

var svg = d3.select("#model3_depreciation")
    .attr("class", "graph")
    .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")
    .append("g")
        .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.bottom - 20)
    .text("Miles")

svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", margin.right)
    .attr("y", margin.top - 60)
    .text("Price($)");

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden");


//note that when you are selectall, you have to pass the entire array
const render = data => {
    var mapping = map_trim_to_color(data);
    var trims = get_unique_trims(data);
    var max_y = get_y_max_value(data);
    var max_x = get_x_max_value(data);
    
    var x = d3.scaleLinear().domain([0, max_x]).range([0, width]);
    var y = d3.scaleLinear().domain([0, max_y]).range([height, 0]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))

    svg.append("g").call(d3.axisLeft(y))

    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.Miles)})
            .attr("cy", function(d) { return y(d.Price)})
            .attr("fill", function(d) {
                return mapping.get(d.Trim);
            })
            .attr("class", "dot")
        .on("mouseover", function() {
            tooltip
                .transition()
                .style("visibility", "visible");
        })
        .on("mousemove", function(event, d) {
            var border_color = mapping.get(d.Trim)
            tooltip
                .html(
                    "Trim:" + d.Trim + "<br/>" + 
                    "Price: " + d.Price + "<br/>" + 
                    "Miles: " + d.Miles)
                //don't use attr here, use style here.
                .style("left", (event.clientX + 50) + "px")
                .style("top", (event.clientY) + 5 + "px")
                .style("border", "2px solid " + border_color)
                .style("background-color", border_color);

        })
        .on("mouseout", function(d) {
            tooltip
                .transition()
                .style("visibility", "hidden");
        })
    
    //adding legend text
    svg.selectAll("legend")
        .data(trims)
        .enter()
        .append("text")
            .attr("class", "legend_text")
            .attr("x", width)
            .attr("y", function(d,i){
                return (i+1) * margin.top;
            })
            .text(function(d){ 
                return d;})
    
    //rectangle legend
    svg.selectAll("rect-legend")
        .data(trims)
        .enter()
        .append("rect")
            .attr("x", width - 40)
            .attr("y", function(d,i){
                return (i+1) * margin.top - 15;
            })
            .style("fill", function(d){
                return mapping.get(d);
            })
            .attr("height", 20)
            .attr("width", 20);
};

var draw = d3.csv("cla_data.csv")
    .then(data =>{
        render(data);
});




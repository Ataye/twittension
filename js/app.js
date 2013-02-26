

(function(io) {

    var twitData = {children:[]};       // the main twitter data array
    var twitChange = {children:[]};     // changes prior to ui update
    var iTwitCount = 0;
    var iUpdate = 250;
    var format = d3.format(",d");

    // setup the graph:
    var graph = function () {

        // get window size:
        var win = function(){
            var db = document.body;
            var dde = document.documentElement;

            return {
                width: Math.max(db.scrollWidth, dde.scrollWidth, db.offsetWidth, dde.offsetWidth, db.clientWidth, dde.clientWidth) - 30
                , height: Math.max(db.scrollHeight, dde.scrollHeight, db.offsetHeight, dde.offsetHeight, db.clientHeight, dde.clientHeight) - 80
            };
        }();

        var bubble = d3.layout.pack()
            .sort(null)
            .size([win.width, win.height])//[diameter, diameter])
            .padding(6);

        var svg = d3.select('svg') //.select("body").append("svg")
            .attr("width", win.width)//diameter)
            .attr("height", win.height-50)//diameter)
            .attr("class", "bubble");

        // graph update:
        updateGraph = function () {
            // get and clean the data:
            var dataLocal = bubble.nodes(twitData)
                .filter(function (d) {
                    return !d.children;
                });

            // calc colours:
            var colour = d3.scale.linear().domain([
                _.min(dataLocal,function (dat) {
                    return dat.value;
                }).value
                , _.max(dataLocal,function (dat) {
                    return dat.value;
                }).value
            ]).range(['#506c77', '#ffffff']);

            // calc graph:
            var node = svg.selectAll('.node')
                .data(dataLocal, function (d) {
                    return d.name;
                })
            ;

            // new nodes, add a group to contain the circle and label:
            var g = node.enter().append('g')
                .attr('class', 'node')
            ;
            // add a circle to the group:
            g.append('circle')
                .style('fill', '#ffffff')
                .on('mouseover', function(d){ d3.select(this).attr('stroke', '#dbf5ff'); })
                .on('mouseout', function(d){ d3.select(this).attr('stroke', 'none'); })
                .on('click', function(d){
                    $.jGrowl(d.name);
                    console.log(d.name);
                })
            ;
            // add the text label:
            g.append('text')
                .attr("dy", ".3em")
                .attr('text-anchor', 'middle')
                .attr('pointer-events', 'none')
                .attr('pointer', 'none')
                .text(function (d) {
                    return d.name;
                })
            ;
            // now position the new group:
            g.attr('transform', function (d) {
                return "translate(" + d.x + ',' + d.y + ")";
            })
            ;

            // update all existing nodes (node doesn't yet contain new nodes):
            node
                .transition().duration(iUpdate*1.2)
                .attr('transform', function (d) {
                    return "translate(" + d.x + ',' + d.y + ")";
                })
            ;

            // now select circles within each group and set the radius and style:
            node.select('circle')
                //.style('fill', '#fff')
                .transition().ease('elastic').duration(iUpdate*4)
                .attr('r', function (d) { return d.r; })
                .style('fill', function (d) { return colour(d.value); })
            ;

            // select new nodes to highlight:
            var nodesnew = d3.selectAll('circle')
                .data(
                    bubble.nodes(twitChange)
                    .filter(function (d) { return !d.children; })
                , function (d) { return d.name; });

            nodesnew
                .style('fill', '#ff7000')
                .transition().duration(100)
                .style('fill', '#fff')
                .transition().ease('elastic').duration(iUpdate*4)
                .style('fill', function (d) { return colour(d.value); })
            ;

            return this;
        };
        return this;
    }();

    // call to update (only when retrieving data):
    var fnUpdate = _.throttle(function(){
        graph.updateGraph.call(graph);
        twitChange = {children:[]};
    }, iUpdate);

    // listen for data:
    var con = io.connect();
    con.on('data', function (data) {
        iTwitCount++;
        d3.select("#dvCount .count").text( format(iTwitCount) );

        // find element and update, or insert:
        var iName = data.len;
        var o = _.find(twitData.children, function (itm) {
            return itm.name == iName;
        });
        if (o)
            o.value += 1;
        else{
            o = {name:iName, value:1};
            twitData.children.push(o);
        }

        // is this a new change:
        if (!_.find(twitChange.children, function (itm) { return itm.name == iName; }))
            twitChange.children.push(o);

        // got some data, trigger and update:
        fnUpdate();
    });

})(io);
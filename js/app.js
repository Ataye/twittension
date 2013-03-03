
var iUpdate = 250;
var format = d3.format(",d");

// main app:
var appCtrl = function($scope, $compile){
    $scope.twits = [];          // array of tweet lengths.
    $scope.twitChange = [];     // changes prior to ui update
    $scope.panels = [];         // array of open panels.
    $scope.counter = 0;         // total number of tweets received.


    // update the tweets array:
    var fnUpdate = function(len){
        $scope.counter++;

        // find element and update, or insert:
        $scope.$apply(function(){
            var iName = len;
            var o = _.find($scope.twits, function (itm) {
                return itm.name == iName;
            });
            if (o)
                o.value += 1;
            else{
                o = {name:iName, value:1};
                $scope.twits.push(o);
            }

            // is this a new change:
            if (!_.find($scope.twitChange, function (itm) { return itm.name == iName; }))
                $scope.twitChange.push(o);

            // ok, call update:
            graph.update();
        });
    };

    // click events:
    var fnItem_Click = function(dat){
        // check if panel is already open:
        if (_.contains($scope.panels, dat.name)){
            // already showing, ignore!
            return;
        }
        $.jGrowl("<span>{{dat.value}}</span>", {
            sticky:true
            , beforeOpen:function(e, m, o){
                // create new scope and compile new template:
                var $sc = $scope.$new();
                $sc.item = dat;
                $sc.rank = function(){
                    // calculate the rank by ordering by value (descending) and get item index:
                    var ar = _.sortBy($scope.twits, function(itm){ return itm.value * -1; });
                    return ar.indexOf(dat) + 1; // fix for 0 based.
                };

                // insert hte template string and compile using new child scope:
                e.append(angular.element('#pop-panel-tmpl').html());
                $compile(e)($sc);

                // add to panels array, so we only open 1 panel:
                $scope.panels.push(dat.name);
            }
            , close:function(e, m, o){
                // remove from panels array:
                $scope.panels.splice($scope.panels.indexOf(dat.name), 1);
            }
        });
    };

    // define the d3js graph:
    var graph = function(){
        var win = helpers.win();
        var bubble = d3.layout.pack()
            .sort(null)
            .size([win.width, win.height-90])
            .padding(6);

        var svg = d3.select('svg')
            .attr("width", win.width)
            .attr("height", win.height-90)
            .attr("class", "bubble");

        // graph update (throttle to make sure we don't call it too often, reducing update performance):
        update = _.throttle(function () {
            return function(){
                // get and clean the data:
                var dataLocal = bubble.nodes({children:$scope.twits})
                    .filter(function (d) {
                        return !d.children;
                    });

                // calculate colours:
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
                    });

                // new nodes, add a group to contain the circle and label:
                var g = node.enter().append('g')
                    .attr('class', 'node');

                // add a circle to the group:
                g.append('circle')
                    .style('fill', '#ffffff')
                    .on('mouseover', function(d){ d3.select(this).attr('stroke', '#dbf5ff'); })
                    .on('mouseout', function(d){ d3.select(this).attr('stroke', 'none'); })
                    .on('click', fnItem_Click);

                // add the text label:
                g.append('text')
                    .attr("dy", ".3em")
                    .attr('text-anchor', 'middle')
                    .attr('pointer-events', 'none')
                    .attr('pointer', 'none')
                    .text(function (d) {
                        return d.name;
                    });

                // now position the new group:
                g.attr('transform', function (d) {
                    return "translate(" + d.x + ',' + d.y + ")";
                });

                // update all existing nodes (node doesn't yet contain new nodes):
                node
                    .transition().duration(iUpdate*1.2)
                    .attr('transform', function (d) {
                        return "translate(" + d.x + ',' + d.y + ")";
                    });

                // now select circles within each group and set the radius and style:
                node.select('circle')
                    //.style('fill', '#fff')
                    .transition().ease('elastic').duration(iUpdate*4)
                    .attr('r', function (d) { return d.r; })
                    .style('fill', function (d) { return colour(d.value); });

                // select new nodes to highlight:
                var nodesnew = d3.selectAll('circle')
                    .data(
                    bubble.nodes({
                        children:$scope.twitChange})
                            .filter(function (d) { return !d.children; })
                    , function (d) { return d.name; });

                nodesnew
                    .style('fill', '#ff7000')
                    .transition().duration(100)
                    .style('fill', '#fff')
                    .transition().ease('elastic').duration(iUpdate*4)
                    .style('fill', function (d) { return colour(d.value); });

                // clear new nodes:
                $scope.twitChange = [];

                // return instance:
                return this;
            }
        }, iUpdate)();

        // return instance:
        return this;
    }();

    // listen for data:
    var con = io.connect();
    con.on('data', function (data) {
        // got data, update our model:
        fnUpdate(data.len);
    });

};

// helpful methods:
var helpers = {
    // get window size:
    win: function(){
        var db = document.body;
        var dde = document.documentElement;

        return {
            width: Math.max(db.scrollWidth, dde.scrollWidth, db.offsetWidth, dde.offsetWidth, db.clientWidth, dde.clientWidth) - 30
            , height: Math.max(db.scrollHeight, dde.scrollHeight, db.offsetHeight, dde.offsetHeight, db.clientHeight, dde.clientHeight) - 80
        };
    }
}

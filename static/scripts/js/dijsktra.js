var graph = new Map();

function setGraph(source, destination, distance){
    if(!graph.get(source)){
        graph.set(source, []);
    }
    graph.get(source).push({dst:destination, weight:distance});

    if(!graph.get(destination)){
        graph.set(destination, []);
    }
    graph.get(destination).push({dst:source, weight:distance});
}

var Komplek = 6;

function findPath(source, destination){
    var visited = new Map();
    var path = new Map();
    for(var i=1; i<=graph.size; i++){
        visited.set(i, false);
        path.set(i,{distance_from_source:Infinity, previous_vertex:null});
    }

    path.set(source, {distance_from_source:0, previous_vertex:null});

    var queue = []
    queue.push(source);

    while(queue.length>0){
        var queue_top = queue.pop();
        var temp_graph = graph.get(queue_top);
        var temp_path = path.get(queue_top);

        console.log("Now : " + queue_top);

        var next_ = {dst:null , weight:Infinity};
        var distance_before = temp_path.distance_from_source;
        
        visited.set(queue_top, true);
        temp_graph.forEach(element => {
            if(!visited.get(element.dst)){
                console.log(element);
                // console.log(visited);
                var total_weight = distance_before + element.weight;
                // console.log(total_weight);

                if(total_weight < path.get(element.dst).distance_from_source){
                    path.set(element.dst, {distance_from_source:total_weight, previous_vertex:queue_top});
                }

                if(total_weight < next_.weight){
                    next_ = element;
                }

                if(queue[0] != next_.dst){
                    queue.unshift(next_.dst);
                }
            }
        });
        console.log(queue);
    }
    console.log(path);
}

// setGraph(5,6,4);

/*

5 6 4
1 2 3
1 4 6
3 2 4
3 4 2
3 5 5
5 4 8

*/
setGraph(1,2,3);
setGraph(1,4,6);
setGraph(3,2,4);
setGraph(3,4,2);
setGraph(3,5,5);
setGraph(5,4,8);

findPath(1, 5);

// console.log(graph);
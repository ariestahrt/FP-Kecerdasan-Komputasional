/* ============ ::: Begin of ACO ============ */

function randomBetween(min,max){
    return (Math.random()*(max-min+1)+min)%max;
}


class Edge{
	constructor(a, b, weight, initial_pheromone){
		this.a = a;
		this.b = b;
		this.weight = weight;
		this.pheromone = initial_pheromone;
	}
}

class Ant{
	constructor(alpha, beta, num_nodes, edges){
		this.alpha = alpha
		this.beta = beta
		this.num_nodes = num_nodes
		this.edges = edges
		this.tour = []
		this.distance = 0.0
	}

	/*
		Return next node to visit
	*/
	_select_node(){
        let roulette_wheel = 0.0;
		let unvisited_nodes = [];

		for(let _=0; _<this.num_nodes; _++){
			if(!this.tour.includes(_)){
				unvisited_nodes.push(_);
			}
		}

		let heuristic_total = 0.0;
		unvisited_nodes.forEach((unvisited) => {
			heuristic_total += this.edges[this.tour[this.tour.length - 1]][unvisited].weight;
		});

		unvisited_nodes.forEach((unvisited) => {
			roulette_wheel += Math.pow(this.edges[this.tour[this.tour.length - 1]][unvisited].pheromone, this.alpha) * Math.pow((heuristic_total / this.edges[this.tour[this.tour.length - 1]][unvisited].weight), this.beta);
		});

		let random_value = randomBetween(0.0, roulette_wheel);
		let wheel_position = 0.0;
        let next_node = null;
        for(let i=0; i<unvisited_nodes.length; i++){
            let unvisited = unvisited_nodes[i];
			wheel_position += Math.pow(this.edges[this.tour[this.tour.length - 1]][unvisited].pheromone, this.alpha) * Math.pow((heuristic_total / this.edges[this.tour[this.tour.length - 1]][unvisited].weight), this.beta);
			if(wheel_position >= random_value){
                return unvisited;
			}
        }
	}

	/*
		Ant traveling
	*/
	find_tour(){
		// Determine ant traveling starting node
		this.tour = [];
        let random_start = Math.floor(randomBetween(0,this.num_nodes));
		this.tour.push(random_start);
		while(this.tour.length < this.num_nodes){
            let next_node = this._select_node();
			this.tour.push(next_node);
		}
        this.tour.push(this.tour[0]);
		return this.tour;
	}

	/*
		Return total distance
	*/
	get_distance(){
		this.distance = 0.0;
		for(let i=0; i<this.num_nodes; i++){
            let FROM=this.tour[i];
            let tour_to=(i+1) % (this.num_nodes);
            let TO = this.tour[tour_to];
			this.distance += this.edges[FROM][TO].weight;
		}
		return this.distance;
	}
}


class ACO {
	constructor(colony_size=10, alpha=1.0, beta=3.0, rho=0.1, pheromone_deposit_weight=1.0, initial_pheromone=1.0, steps=100, nodes=[], labels=[], node_list=[]){
		this.node_list = node_list
		this.colony_size = colony_size;
		this.rho = rho;
		this.pheromone_deposit_weight = pheromone_deposit_weight;
		this.steps = steps
		this.num_nodes = nodes.length;
		this.nodes = nodes;

		if(labels.length != 0){
			this.labels = labels;
		}else{
			this.labels = [];
			for(let i=0; i<=this.num_nodes; i++){
				this.labels.push();
			}
		}
		
		// Setup edges
		this.edges = [];
		for(let i=0; i<this.num_nodes; i++){
			let temp = [];
			for(let j=0; j<this.num_nodes; j++){
				temp.push();
			}
			this.edges.push(temp);
		}

		for(let i=0; i<this.num_nodes; i++){
			for(let j=i+1; j<this.num_nodes; j++){
				this.edges[i][j] = new Edge(i, j, Math.sqrt(Math.pow( this.nodes[i].lon - this.nodes[j].lon, 2.0) + Math.pow( this.nodes[i].lat - this.nodes[j].lat, 2.0)), initial_pheromone);
				this.edges[j][i] = this.edges[i][j];
			}
		}

		this.ants = [];
		for(let _ = 0; _ < this.colony_size; _++){
			this.ants.push(new Ant(alpha, beta, this.num_nodes, this.edges));
		}

		this.global_best_tour = [];
		this.global_best_distance = 9999999;
	}

	_add_pheromone(tour, distance, weight=1.0){
		let pheromone_to_add = this.pheromone_deposit_weight / distance;
		for(let i=0; i<this.num_nodes; i++){
			this.edges[tour[i]][tour[(i+1) % this.num_nodes]].pheromone += weight * pheromone_to_add;
		}
	}

	_acs(){
		for(let step=1; step<=this.steps; step++){
			this.ants.forEach((ant) => {
				this._add_pheromone(ant.find_tour(), ant.get_distance());
				if(ant.distance < this.global_best_distance){
					this.global_best_tour = ant.tour;
					this.global_best_distance = ant.distance;
				}
			});

			for(let i=0; i<this.num_nodes; i++){
				for(let j=i+1; j<this.num_nodes; j++){
					this.edges[i][j].pheromone *= (1.0 - this.rho);
				}
			}
		}
		console.log("BEST PATH");
		console.table(this.global_best_tour);

	}
}
/* ============ ::: End of ACO ============ */

let colony_size = 5
let steps = 5;
let node_count = 5;
let nodes = [];

for(let i=0; i<node_count; i++){
    nodes.push({
        lon: randomBetween(-400,400),
        lat:randomBetween(-400,400)
    })
}

//console.table(nodes);
hasil = new ACO(colony_size, 1.0, 3.0, 0.1, 1.0, 1.0, steps, nodes, [], []);
hasil._acs();
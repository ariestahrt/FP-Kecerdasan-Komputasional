// enable/disable console.log
// console.log = function() {}
// console.table = function() {}


/*

	Sales_List map structure:

	{
		key:
		color:
		home:
		missionList:
		waypointCluster:
	}

	Waypoint map structure:

	{
		[lon, lat]
	}
*/

// Debug
var Page = document.getElementById("html_page");
Page.addEventListener("keyup", function(event) {
	if (event.keyCode === 68) {
		console.log("SALES :");
		console.log(Sales_List);

		console.log("WAYPOINT :");
		console.log(WayPoint_List);
	}
});

let COLOR_LIST = ["red", "blue", "purple", "green", "cyan"];

var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');
var PointerInteraction = ol.interaction.Pointer;

// -- Global Variable -- //

var Sales_List = new Map();
var currentStatusDisplay = 0;

var HomePoint_List = new Map();
var Overlay_HomePoint_List = new Map();

var WayPoint_List = new Map();
var Overlay_WayPoint_List = new Map();

var TGO_mission_counter = 0;
var Mission_List = new Map();
Mission_List.set(Number(TGO_mission_counter), []);

var VehicleOverlay_List = new Map();

var lastPointID = 1;
var lastHomeID = 0;

var draw_line = {
	active: false,
	new: false,
	onMarker: false
}

var Global_HomePointIndex;
var globmsg;

var drawMission = false;
var setHomeEvent = false;
var toggleDragging = false;


// Permutation Global Variable;
var permArr = [], usedChars = [];

// -- End of Global Variable -- //

var missionvectorLineSource = new ol.source.Vector({});
var missionvectorLineStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: '#00FF00',
    weight: 4
  }),
  stroke: new ol.style.Stroke({
    color: '#00FF00',
    width: 2
  })
});

var missionvectorLineLayer = new ol.layer.Vector({
	source: missionvectorLineSource,
	style: missionvectorLineStyle
});


// -- Arrow Layer

var style_Arrow = [];
// var source_Arrow = new ol.source.Vector({});
// var arrow_VectorLayer = new ol.layer.Vector({
// 	source: missionvectorLineSource,
// 	style: style_Arrow
// });

// -- Using point track layer
const features_Track = [];
features_Track.push(new ol.Feature({
	geometry: new ol.geom.Point(convertFromLongLat([149.16460762750856,-35.36386907794211]))
}));

features_Track.push(new ol.Feature({
	geometry: new ol.geom.Point(convertFromLongLat([112.79862761540215, -7.276434779150961]))
}));


const source_Arrow = new ol.source.Vector({});
source_Arrow.addFeatures(features_Track);
const arrow_VectorLayer = new ol.layer.Vector({
	source: source_Arrow,
	style: style_Arrow
    // style: new ol.style.Style({
    // 	image: new ol.style.Circle({
    //         radius: 2,
    //         fill: new ol.style.Fill({color: 'yellow'})
    //     })
    // })
});

// -- End Arrow Layer

// -- TRANSFORM FUNCTION -- //

function convertToLonLat(coords) {
	return ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326');
}

function convertFromLongLat(coords) {
	return ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857')
}

// -- TRANSFORM FUNCTION -- //

// -- Map Mouse Event -- //

var Drag = (function (PointerInteraction) {
	function Drag() {
		PointerInteraction.call(this, {
			handleDownEvent: handleDownEvent,
			handleDragEvent: handleDragEvent,
			handleMoveEvent: handleMoveEvent,
			handleUpEvent: handleUpEvent,
		});

		this.coordinate_ = null;
		this.cursor_ = 'pointer';
		this.feature_ = null;
		this.previousCursor_ = undefined;
	}

	if (PointerInteraction) Drag.__proto__ = PointerInteraction;
	Drag.prototype = Object.create(PointerInteraction && PointerInteraction.prototype);
	Drag.prototype.constructor = Drag;

	return Drag;
}(PointerInteraction));

function handleDownEvent(evt) {

}

function handleDragEvent(evt) {

}

function handleMoveEvent(evt) {
	if (this.cursor_) {
		var coords = ol.proj.toLonLat(evt.coordinate);

		var lon = coords[0];
		var lat = coords[1];

		document.getElementById('pointer-coordinate').innerHTML = "<b>Longitude</b>: " + lon + " <b>Latitude</b>: " + lat;

		var map = evt.map;
		// Draw Line

		if (draw_line.active && draw_line.new == false && draw_line.onMarker == false) {
			Mission_List.get(Number(Global_HomePointIndex)).push({TYPE:"TEMP", TEMP_COORDS:[lon,lat]});
			UpdateLine();
			Mission_List.get(Number(Global_HomePointIndex)).pop();
		}
	}
}

function handleUpEvent() {

}

// -- END OF Map Mouse Event -- //


// -- Transfer Data To engine.py

function TransferData() {
	return;
}

// -- End Transfer Data To engine.py

// -- THE MAP -- //
// Raster = BingMap
var raster = new ol.layer.Tile({
	source: new ol.source.BingMaps({
		key: 'AnGHr16zmRWug0WA8mJKrMg5g6W4GejzGPBdP-wQ4Gqqw-yHNqsHmYPYh1VUOR1q',
		imagerySet: 'AerialWithLabels',
		// imagerySet: 'Road',
	})
});

var google_raster = new ol.layer.Tile({
	source: new ol.source.XYZ({
	  url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'
	})
});

var map = new ol.Map({
	interactions: ol.interaction.defaults().extend([new Drag()]),
	target: 'map',
	renderer: 'canvas', // Force the renderer to be used
	layers: [google_raster, missionvectorLineLayer, arrow_VectorLayer],
	view: new ol.View({
		center: ol.proj.transform([112.79750131436222, -7.277617644674081], 'EPSG:4326', 'EPSG:3857'),
		zoom: 19
	})
});

// -- END OF THE MAP -- //


// generate path arrow //

function generatePathArrow(path){
	style_Arrow = [];
	console.log("generatePathArrow called");
	var missionPoints_ = [];

	path.forEach(function (data){
		missionPoints_.push([WayPoint_List.get(Number(data))[0], WayPoint_List.get(Number(data))[1]]);
	});

	// console.table(missionPoints_);
	
	for(var i=1; i<missionPoints_.length; i++){
		var start = convertFromLongLat(missionPoints_[i-1]);
		var end   = convertFromLongLat(missionPoints_[i]);
		// console.log(start);
		// console.log(end);
		
		x1 = start[0];
		y1 = start[1];
		
		x2 = end[0];
		y2 = end[1];

		mid = [(x1 + x2)/2,(y1 + y2)/2];

		var dx = end[0] - start[0];
		var dy = end[1] - start[1];
		// console.log(`dx :${dx}`);
		// console.log(`dy :${dy}`);
		var rotation = Math.atan2(dy, dx);

		// arrows
		style_Arrow.push(
			new ol.style.Style({
			geometry: new ol.geom.Point(mid),
			image: new ol.style.Icon({
					src: 'static/images/arrow.png',
					anchor: [0.75, 0.5],
					rotateWithView: true,
					rotation: -rotation,
				}),
			})
		);
	}

	arrow_VectorLayer.setStyle(style_Arrow);
	// map.removeLayer(arrow_VectorLayer);
	// map.addLayer(arrow_VectorLayer);
};

// end of generate style arrow //

// -- UPDATE DRAW LINE FUNCTION -- //

// generate style arrow //

function generateStyleArrow(){

};

// end of generate style arrow //

// -- UPDATE DRAW LINE FUNCTION -- //

var TGO_current_wp = 1;

function UpdateLine() {
	
	missionvectorLineSource.clear();
	Mission_List.forEach(function (items, key) {
		// console.log("KEY : " + key);
		var missionPoints_ = [];

		// console.log("DATA BEGIN");
		items.forEach(function (data) {
			if (data.TYPE == "HOME") {
				missionPoints_.push([HomePoint_List.get(Number(data.ID))[0], HomePoint_List.get(Number(data.ID))[1]]);
			} else if (data.TYPE == "POINT") {
				missionPoints_.push([WayPoint_List.get(Number(data.ID))[0], WayPoint_List.get(Number(data.ID))[1]]);
			} else if (data.TYPE == "TEMP") {
				missionPoints_.push(data.TEMP_COORDS);
			}
		});
		// console.log("DATA END");

		for (var k = 0; k < missionPoints_.length; k++) {
			missionPoints_[k] = ol.proj.transform(missionPoints_[k], 'EPSG:4326', 'EPSG:3857');
		}

		var missionfeatureLine = new ol.Feature({
			geometry: new ol.geom.LineString(missionPoints_)
		});

	    missionvectorLineSource.addFeature(missionfeatureLine);
	});
}

// -- END OF UPDATE  DRAW LINE FUNCTION -- //

// -- PUSH PointLayer source -- //

function addWayPointOverlay(coordinate, id, fromGet=false) {
	var lon = coordinate[0];
	var lat = coordinate[1];

	var MarkerOverlayContent = document.createElement('div');
	MarkerOverlayContent.classList.add("marker");
	MarkerOverlayContent.setAttribute("data-point-id", lastPointID);
	MarkerOverlayContent.innerHTML = '<span><b>' + lastPointID + '</b></span>';

	WayPoint_List.set(lastPointID, [lon, lat]);

	var MarkerOverlay = new ol.Overlay({
		element: MarkerOverlayContent,
		position: ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'),
		positioning: 'center-center'
	});

	Overlay_WayPoint_List.set(id, MarkerOverlay);
	map.addOverlay(Overlay_WayPoint_List.get(Number(id)));

	MarkerOverlayContent.addEventListener('mousedown', function (evt) {
		var thisPointID = this.getAttribute("data-point-id");

		if (draw_line.active) {
			if (!draw_line.new) {
				alert("This is not Home Point, Try Again!");
			} else {

				if((Number(Mission_List.get(Number(TGO_mission_counter)).length) < 2)){
					// push to
					Mission_List.get(Number(TGO_mission_counter)).push({TYPE:"POINT", ID:thisPointID, COMMAND:16, ALT:2});
				}else{
					TGO_mission_counter++;
					Mission_List.set(Number(TGO_mission_counter), []);
					Mission_List.get(Number(TGO_mission_counter)).push({TYPE:"POINT", ID:thisPointID, COMMAND:16, ALT:2});
				}

				console.log("Add Mission List with point id : " + thisPointID);
				UpdateLine();
				style_Arrow = [];
				// generateStyleArrow();
			}
		}

		function move(evt) {
			if (toggleDragging) { // Enable draging
				var convertedCoordinate = convertToLonLat(map.getEventCoordinate(evt));
				Overlay_WayPoint_List.get(Number(id)).setPosition(map.getEventCoordinate(evt));
				WayPoint_List.set(Number(thisPointID), convertedCoordinate);
				UpdateLine();
				// console.log("Move Point");
				style_Arrow = [];
				generateStyleArrow();
				$('*[data-lon-wp-id="'+thisPointID+'"]').val(convertedCoordinate[0]);
				$('*[data-lat-wp-id="'+thisPointID+'"]').val(convertedCoordinate[1]);
			}
		}

		function end(evt) {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', end);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', end);
	});

	MarkerOverlayContent.addEventListener('mouseenter', function (evt) {
		draw_line.onMarker = true;
		if (draw_line.active) {
			if((Number(Mission_List.get(Number(TGO_mission_counter)).length) < 2)){
				var converted = convertToLonLat(Overlay_WayPoint_List.get(Number(id)).getPosition());
				console.log(converted);
				Mission_List.get(Number(TGO_mission_counter)).push({TYPE:"TEMP", TEMP_COORDS:converted});
				UpdateLine();
				Mission_List.get(Number(TGO_mission_counter)).pop();
			}
		}
	});

	MarkerOverlayContent.addEventListener('mouseleave', function (evt) {
		draw_line.onMarker = false;
	});

	lastPointID++;
	console.log("done");
}

// -- END OF PUSH PointLayer source -- //

// -- PUSH Home Point Overlay -- //

function addHomePointOverlay(coordinate) {
	console.log("ADDED home point");
	var lon = coordinate[0];
	var lat = coordinate[1];

	// Push new sales to sales list
	let current_sales_id = Number(Sales_List.size);
	Sales_List.set(current_sales_id, {
		key: current_sales_id,
		color: COLOR_LIST[current_sales_id],
		home: [lon, lat],
		missionList:[],
		waypointCluster:[]
	});

	var MarkerOverlayContent = document.createElement('div');
	MarkerOverlayContent.classList.add("marker");
	MarkerOverlayContent.setAttribute("data-home-id", current_sales_id);
	MarkerOverlayContent.innerHTML = '<span style="background: ' + Sales_List.get(current_sales_id).color + ';"><b>S</b></span>';

	var MarkerOverlay = new ol.Overlay({
		element: MarkerOverlayContent,
		position: ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'),
		positioning: 'center-center'
	});

	HomePoint_List.set(current_sales_id, [lon, lat]);

	Overlay_HomePoint_List.set(current_sales_id, MarkerOverlay);
	map.addOverlay(Overlay_HomePoint_List.get(current_sales_id));

	MarkerOverlayContent.addEventListener('mousedown', function (evt) {
		var thisPointID = this.getAttribute("data-home-id");
		console.log("Home clicked");
		console.log("data-home-id : " + thisPointID);

		if (draw_line.active){
			if (draw_line.new){
				Global_HomePointIndex = thisPointID;
				console.log(thisPointID);
				Mission_List.set(Number(thisPointID), []);
				Mission_List.get(Number(thisPointID)).push({TYPE:"HOME", ID:thisPointID, COMMAND:16, ALT:2});
				draw_line.new = false;
			} else {
				Mission_List.get(Number(thisPointID)).push({TYPE:"HOME", ID:thisPointID, COMMAND:16, ALT:2});
				draw_line.active = false;
		        draw_line.new = false;
				$('#btn-toggle-draw').click();
				Global_HomePointIndex = null;
				UpdateLine();
				// Finish drawing line
				style_Arrow = [];
				generateStyleArrow();
			}
		}

		function move(evt) {
			if (toggleDragging) { // Enable dragging
				var convertedCoordinate = convertToLonLat(map.getEventCoordinate(evt));
				Overlay_HomePoint_List.get(current_sales_id).setPosition(map.getEventCoordinate(evt));
				HomePoint_List.set(Number(thisPointID), convertedCoordinate);
				UpdateLine();
				style_Arrow = [];
				generateStyleArrow();
      		}
		}

		function end(evt) {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', end);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', end);
	});

	MarkerOverlayContent.addEventListener('mouseenter', function (evt) {
		draw_line.onMarker = true;
		if (draw_line.active) {
			var converted = convertToLonLat(Overlay_HomePoint_List.get(current_sales_id).getPosition());
			if (Global_HomePointIndex) {
				Mission_List.get(Number(Global_HomePointIndex)).push({TYPE:"TEMP", TEMP_COORDS:converted});
				UpdateLine();
				Mission_List.get(Number(Global_HomePointIndex)).pop();
			}
		}
	});

	MarkerOverlayContent.addEventListener('mouseleave', function (evt) {
		draw_line.onMarker = false;
	});

	// document.getElementById("btn-set-home").setAttribute("disabled", false);
	// setHomeEvent = false;
	lastHomeID++;
	console.log("OK");
}

// -- END OF PUSH Home Point Overlay -- //

// -- Enable Togle -- //

$('#btn-toggle-marker').on('click', function () {
	var toggleactive = this.getAttribute("data-toggle");
	if (toggleactive == "on") {
		toggleActive("btn-toggle-marker", true);
		drawMission = false;
		this.setAttribute("data-toggle", "off");
		this.style.opacity = 0.7;
	} else {
		toggleActive("btn-toggle-marker", false);
		drawMission = true;
		this.setAttribute("data-toggle", "on");
		this.style.opacity = 1;
	}
});

// -- End of Enable Togle -- //

// -- Set Home -- //

$('#btn-set-home').on('click', function () {
	var toggleactive = this.getAttribute("data-toggle");
	if (toggleactive == "on") {
		toggleActive("", true);
		toggleActive("btn-set-home", true);
		setHomeEvent = false;
		this.setAttribute("data-toggle", "off");
		this.style.opacity = 0.7;
	}else{
		toggleActive("btn-set-home", false);
		setHomeEvent = true;
		this.setAttribute("data-toggle", "on");
		this.style.opacity = 1;
	}
});

// -- End of Set Home -- //

// -- Toggle Draw -- //

$('#btn-toggle-draw').on('click', function () {
	var toggleactive = this.getAttribute("data-toggle");
	if (toggleactive == "on") {
		toggleActive("btn-toggle-draw", true);
		UpdateLine();
		draw_line.active = false;
		draw_line.new = false;
		this.setAttribute("data-toggle", "off");
		this.style.opacity = 0.7;
	} else {
		toggleActive("btn-toggle-draw", false);
		// alert("Please select Home Point first");
		draw_line.active = true;
		draw_line.new = true;
		this.setAttribute("data-toggle", "on");
		this.style.opacity = 1;
	}
});

// -- End of Toggle Draw -- // 

// -- Enable Togle Drag -- //

$('#btn-toggle-drag').on('click', function () {
	var toggleactive = this.getAttribute("data-toggle");
	if (toggleactive == "on") {
		toggleActive("btn-toggle-drag", true);
		toggleDragging = false;
		this.setAttribute("data-toggle", "off");
		this.style.opacity = 0.7;
	} else {
		toggleActive("btn-toggle-drag", false);
		toggleDragging = true;
		this.setAttribute("data-toggle", "on");
		this.style.opacity = 1;
	}
});

// -- End of Enable Togle Drag -- //


// Begin of enable/disableElement

function toggleActive(element, enableAll){
	var elementID = ["btn-toggle-marker", "btn-toggle-draw", "btn-toggle-drag",  "btn-clear-wp" ];
	elementID.forEach(item => {
		if(enableAll){
			document.getElementById(item).removeAttribute("disabled");
		}else{
			if(item != element){
				document.getElementById(item).setAttribute("disabled", true);
			}	
		}
	});
}

// Hitung Jarak

function HitungJarak(from_coord, to_coord){
	var x1 = from_coord[0];
	var x2 = to_coord[0];
	var y1 = from_coord[1];
	var y2 = to_coord[1];

	var jarak = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
	return jarak;
}

// End of Hitung Jarak

// Clear WP

$('#btn-clear-wp').on('click', function () {
	missionvectorLineSource.clear();
	var arr_wp_key = [];
	WayPoint_List.forEach(function (wp_item, wp_key){
		var thisDestination = wp_key;
		arr_wp_key.push(thisDestination);
	});

	arr_wp_key.forEach(function(key){
		console.log("remove overlay : " + key);
		map.removeOverlay(Overlay_WayPoint_List.get(key));
		WayPoint_List.delete(key);
		Overlay_WayPoint_List.delete(key);
	});
	Mission_List.clear();
	generateStyleArrow();
	lastPointID = 1;
});

/* ======== START ::: Clustering using K-Means ======== */

$('#btn-cluster').on('click', () => {
	// alert("WORK")
	let THIS_maxit = 3;
	let SALES_CENTROID = [];
	let distance_to_sales = [];
	let nearest_to_sales = [];

	Sales_List.forEach(function (item, key){
		SALES_CENTROID.push({
			key: key,
			lon: item.home[0],
			lat: item.home[1]
		});
	});
	// keknya objectin aja
	console.log(SALES_CENTROID);

	for(let j=0; j<SALES_CENTROID.length; j++){
		distance_to_sales.push();
		distance_to_sales[j] = [];
		WayPoint_List.forEach(function (wp_item, wp_key){
			distance_to_sales[j].push();
		});
	}

	// Set nearest Waypoint
	WayPoint_List.forEach(function (wp_item, wp_key){
		nearest_to_sales[wp_key] = {
			sales_id: null,
			distance: 99999999
		};
	});

	console.table("CURRENT CENTROID: ");
	console.table(SALES_CENTROID);	

	for(let i=0; i< THIS_maxit; i++){
			WayPoint_List.forEach(function (wp_item, wp_key){
				nearest_to_sales[wp_key] = {
					sales_id: null,
					distance: 99999999
				};
	
				for(let j=0; j<SALES_CENTROID.length; j++){
					let lon = wp_item[0];
					let lat = wp_item[1];
					distance_to_sales[j][wp_key] = HitungJarak([SALES_CENTROID[j].lon, SALES_CENTROID[j].lat], [lon,lat]);
					if(distance_to_sales[j][wp_key] < nearest_to_sales[wp_key].distance){
						nearest_to_sales[wp_key] = {
							sales_id: j,
							distance: distance_to_sales[j][wp_key]
						};
					}
				}			
			});
	
			// Then update CENTROID
			for(let j=0; j<SALES_CENTROID.length; j++){
				let total_lon = 0;
				let total_lat = 0;
				let match = 0;
				for(let i=1; i<nearest_to_sales.length; i++){
					// console.log("nearest_to_sales", i, nearest_to_sales[i]);
					if(nearest_to_sales[i].sales_id == j){
						match += 1;
						let coord = WayPoint_List.get(Number(i));
						total_lon += coord[0];
						total_lat += coord[1];					
					}
				}
				// Then update centroid value:
				if(match != 0){
					SALES_CENTROID[j].lon = total_lon / match;
					SALES_CENTROID[j].lat = total_lat / match;
	
					Overlay_HomePoint_List.get(Number(j)).setPosition(convertFromLongLat([SALES_CENTROID[j].lon, SALES_CENTROID[j].lat]));
				}
			}
			console.table("CENTROID UPDATE: ");
			console.table(SALES_CENTROID);
	}

	// console.table("distance_to_sales");
	// console.table(distance_to_sales);

	// console.table("nearest_to_sales");
	// console.table(nearest_to_sales);
	
});
/* ======== END ::: Clustering using K-Means ======== */

// End of Clear WP

// -- Global msg -- //

console.log(currentStatusDisplay);

map.getView().setCenter(ol.proj.transform([112.79862761540215, -7.276434779150961], 'EPSG:4326', 'EPSG:3857'));

map.on('click', function (evt) {
	var coords = ol.proj.toLonLat(evt.coordinate);

	var lat = coords[1];
	var lon = coords[0];

	if (setHomeEvent == true) {
		console.log([lon, lat]);
		addHomePointOverlay([lon, lat]);
		TransferData();
	}

	if (drawMission == true) {
		console.log([lon, lat]);
		addWayPointOverlay([lon, lat], lastPointID);
		TransferData();
	}
});

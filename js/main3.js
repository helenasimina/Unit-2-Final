var map;
var minValue;
var dataStats = {};
var minValueThreshold = 1; //FOR DEMO ONLY: display smaller values as big as threshold
var nullThreshold = 0.2; //FOR DEMO ONLY: deal with "0" values


//step 1 create map
function createMap(){

    map = L.map('map', {
        center: [45,-100],
        zoom: 2.5
    });
    
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        minZoom: 0,
        maxZoom: 20,
        attribution:  '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    
    }).addTo(map);
    //call getData function
    getData(map);
};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with storm count values
        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

function calcMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var state of data.features){
        //loop through each year
        for(var year = 1960; year <= 2020; year+=10){
              //get storms for current year
              var value = state.properties["Pop_"+ String(year)];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/ allValues.length;

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 0.4;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

function PopupContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("_")[1];
    this.population = this.properties[attribute];
    this.formatted = "<p><b>State:</b> " + this.properties.City + "</p><p><b>Storm count in " + this.year + ":</b> " + this.population + "</p>";
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#ca5cdd",
        color: "#ffffff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.5
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    if (attValue > minValueThreshold) {
		options.radius = calcPropRadius(attValue);
	}
	// assuming it's between zero and threshold min value
	else if (attValue > nullThreshold) {
		options.radius = 10;
	}
	// assuming it's zero
	else {
		options.radius = 10;
		options.fillColor = "#ffffff";
	}


    //build popup content string
    var popupContent = new PopupContent(feature.properties,attribute);

    //bind the popup to the circle marker
    layer.bindPopup(popupContent.formatted, { 
        offset: new L.Point(0,-options.radius)
    });
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};
//Step 3: Add circle markers for point features to the map

function createPropSymbols(data, attributes){

    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function createSequenceControls(attributes){
    //create range input element (slider)
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // ... initialize other DOM elements
             //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
            L.DomEvent.disableClickPropagation(container);
            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Reverse"><img src="img/forward.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/rewind.png"></button>'); 
            
            
            return container;
        }
    });
    map.addControl(new SequenceControl()); 
    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;

            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 6 : index;
            };
        
            //Step 8: update slider
    document.querySelector('.range-slider').addEventListener('input', function(){
                //Step 6: get the new index value
        var index = this.value;
        console.log(index)
        updatePropSymbols(attributes[index]);
        });

    document.querySelector('.range-slider').value = index;
        console.log(index);
        updatePropSymbols(attributes[index]);

        })
    })

};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
    if (layer.feature && layer.feature.properties[attribute]){
        //access feature properties
        var props = layer.feature.properties;

        //update each feature's radius based on new attribute values
        var radius = calcPropRadius(props[attribute]);
        layer.setRadius(radius);

        //add city to popup content string
        var popupContent = new PopupContent(props, attribute);

        //update popup content            
        popup = layer.getPopup();            
        popup.setContent(popupContent.formatted).update();
    };
    updateLegend(attribute);
});
};


//create legend
function createLegend(attributes) {
	var LegendControl = L.Control.extend({
		options: {
			position: 'bottomright'
		},

		onAdd: function () {
			// create the control container with a particular class name
			var container = L.DomUtil.create('div', 'legend-control-container');

			container.innerHTML = '<h3 class="temporalLegend" style = "font-family:Tahoma; color:white">Storm count in <span class="year">1960</span></h3>';

			//Step 1: start attribute legend svg string
			var svg = '<svg id="attribute-legend" width="150px" height="100px">';

			//array of circle names to base loop on
			var circles = ["max", "mean", "min"];

			//Step 2: loop to add each circle and text to svg string  
			for (var i = 0; i < circles.length; i++) {

				//Step 3: assign the r and cy attributes  
				var radius = calcPropRadius(dataStats[circles[i]]);
				var cy = 52 - radius;

				//circle string  
				svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#ca5cdd" fill-opacity="0.8" stroke="#ffffff" cx="35"/>';

				//Step 4: create legend text to label each circle     				          
				var textY = i * 20 + 12;
				svg += '<text id="' + circles[i] + '-text" x="90" y="' + textY + '">' + Math.round(dataStats[circles[i]] * 100) / 100 + '</text>';
			};

			//add annotation to include the values below threshold
			svg += '<text x="70" y="65"></text>';
			svg += "</svg>";
			svg += '<svg><circle class="legend-circle" id="nullCircle" r="10" cy="30" fill="#ffffff" fill-opacity="0.8" stroke="#000000" cx="35"/><text x="70" y="34" style = "fill:white; font-family: Tahoma">Zero or N/A</text></svg>';

			//add attribute legend svg to container
			container.insertAdjacentHTML('beforeend', svg);
            container.style.width = "160px";
            container.style.height = "200px";
			return container;
		}
	});

	map.addControl(new LegendControl());
};

//update legend
function updateLegend(attribute) {
	//create content for legend
	var year = attribute.split("_")[1];

	//replace legend content
	document.querySelector("span.year").innerHTML = year;

	var allValues = [];
	map.eachLayer(function (layer) {
		if (layer.feature) {
			allValues.push(layer.feature.properties[attribute]);
		}
	});

	var circleValues = {
		min: Math.min(...allValues),
		max: Math.max(...allValues),
		mean: allValues.reduce(function (a, b) { return a + b; }) / allValues.length
	}

	for (var key in circleValues) {
		var radius = calcPropRadius(circleValues[key]);
		document.querySelector("#" + key).setAttribute("cy", 52 - radius);
		document.querySelector("#" + key).setAttribute("r", radius)
		document.querySelector("#" + key + "-text").textContent = Math.round(circleValues[key] * 100) / 100 ;
	}
}



/* standalone functions */

//caltulate the stats value of given array
function calcStats(data) {
	//create empty array to store all data values
	var allValues = [];
	//loop through each city
	for (var city of data.features) {
		//loop through each year
		for (var year = 1960; year <= 2020; year += 10) {
			//get storm count for current year
			var value = city.properties["Pop_" + String(year)];
			//add value to array
			allValues.push(value);
		}
	}
	//get min, max, mean stats for our array
	dataStats.min = Math.min(...allValues);
	dataStats.max = Math.max(...allValues);

	//calculate meanValue
	var sum = allValues.reduce(function (a, b) { return a + b; });
	dataStats.mean = sum / allValues.length;
}

function getData(){
    //load the data
    fetch("data/finaldata.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //calculate minimum data value
            var attributes = processData(json);
            minValue = calcMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            createLegend(json);
        })
};

document.addEventListener('DOMContentLoaded',createMap)

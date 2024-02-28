//declare map variable globally so all functions have access
var map;
var minValue;

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
    // Empty array to hold attribute names (years)
    var attributes = [];

    // Loop through the features in the dataset
    data.features.forEach(function(feature){
        // Loop through the properties of each feature
        for (var prop in feature.properties){
            // Check if the property starts with a number (assumed to be a year)
            if (!isNaN(parseInt(prop[0]))) {
                // Check if the attribute is not already in the attributes array
                if (attributes.indexOf(prop) === -1) {
                    // Add the attribute to the attributes array
                    attributes.push(prop);
                }
            }
        }
    });

    // Check the extracted attributes
    console.log(attributes);

    return attributes;
}

function calcMinValue(data){
    // Create an empty array to store all storm count values
    var allValues = [];

    // Loop through each feature in the dataset
    data.features.forEach(function(feature){
        // Loop through each attribute (year) in the properties of the feature
        for (var prop in feature.properties){
            // Check if the attribute is a storm count (starts with a number)
            if (!isNaN(parseInt(prop[0]))) {
                // Get the storm count for the current attribute (year)
                var value = feature.properties[prop];
                // Add the storm count to the array of allValues
                allValues.push(value);
            }
        }
    });

    // Calculate the minimum value of the array of storm counts
    var minValue = Math.min(...allValues);

    return minValue;
}


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};


//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#0000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>State:</b> " + feature.properties.State + "</p><p>";
    var year = attribute;
    popupContent += "<p><b>Storms in " + year + ":</b> " + feature.properties[attribute] + "</p>";
    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

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
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);
    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');
    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")
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
        var popupContent = "<p><b>State:</b> " + props.State + "</p>";

        //add formatted attribute to panel content string
        var year = attribute;
        popupContent += "<p><b>Storms in " + year + ":</b> " + props[attribute] + "</p>";

        //update popup content            
        popup = layer.getPopup();            
        popup.setContent(popupContent).update();
    };
});
};


function getData(){
    //load the data
    fetch("data/Storm_Data.geojson")
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
        })
};

document.addEventListener('DOMContentLoaded',createMap)

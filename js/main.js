
var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
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
   getData();
};

//create function for oneach feature pop ups
function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};
//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/Storm_Data.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){            
            //create marker options
            var geojsonMarkerOptions = {
                radius: 5,
                fillColor: "#aaff00",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            }).addTo(map);
        })
};

document.addEventListener('DOMContentLoaded',createMap)

//Example 2.3 load the data    

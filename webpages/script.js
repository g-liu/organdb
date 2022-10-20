// const locationdata = require('./locationdata.json');

(async () => {
  var map = new OpenLayers.Map("mapdiv");
  map.addLayer(new OpenLayers.Layer.OSM());

  // TODO: READ FROM LOCATION DATA
  var startingLoc = new OpenLayers.LonLat( 47.5 ,-122.1 )
        .transform(
          new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
          map.getProjectionObject() // to Spherical Mercator Projection
        );

  var zoom=3;

  var markers = new OpenLayers.Layer.Markers( "Markers" );
  map.addLayer(markers);

  locationdata = await (await fetch('./locationdata.json')).json();
  locationdata.forEach(element => {
    if (element == null || element == undefined) { return; }
    var lonLat = new OpenLayers.LonLat(element.lat, element.lon)
      .transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    
    markers.addMarker(new OpenLayers.Marker(lonLat)); // TODO: Title, location?
  });

  map.setCenter(startingLoc, zoom);
})();
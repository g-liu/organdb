var map = new OpenLayers.Map("mapdiv");
map.addLayer(new OpenLayers.Layer.OSM());

var lonLat = new OpenLayers.LonLat( -0.1279688 ,51.5077286 )
      .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        map.getProjectionObject() // to Spherical Mercator Projection
      );
var fuck = new OpenLayers.LonLat( - 0.12, 51.5 )
      .transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
      );
      
var zoom=16;

var markers = new OpenLayers.Layer.Markers( "Markers" );
map.addLayer(markers);

markers.addMarker(new OpenLayers.Marker(lonLat));
markers.addMarker(new OpenLayers.Marker(fuck));

map.setCenter (lonLat, zoom);
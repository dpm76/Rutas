'use strict';

dpm.MapCto = function()
{	
    this._wgsProjection = new OpenLayers.Projection("EPSG:4326");   // WGS 1984
    this._sphmProjection = new OpenLayers.Projection("EPSG:900913"); // Spherical Mercator Projection
	
};

dpm.MapCto.DEFAULT_ZOOM = 15;

dpm.MapCto.prototype._transformToWGS84 = function(sphMercatorCoords) {
	// Transforma desde SphericalMercator a WGS84
	// Devuelve un OpenLayers.LonLat con el punto transformado

	var clon = sphMercatorCoords.clone();
	var pointWGS84 = clon.transform(this._sphmProjection, this._wgsProjection);

	return pointWGS84;
};

dpm.MapCto.prototype._transformToSphM = function(wgsCoords) {
	// Transforma desde WGS84 a SphericalMercator
	// Devuelve un OpenLayers.LonLat con el punto transformado
	var clon = wgsCoords.clone();
	var pointSphM = clon.transform(this._wgsProjection, this._sphmProjection);

	return pointSphM;
};

dpm.MapCto.prototype.loadMap = function()
{
	this._map = new OpenLayers.Map("MainMap",
	{ 
		controls: [
			new OpenLayers.Control.Navigation({
				dragPanOptions: {
					enableKinetic: true
			   }
			}),
			//new OpenLayers.Control.PinchZoom({
			//	autoActivate: true,
			//	preserveCenter: true
			//}),
			// new OpenLayers.Control.Zoom({
				// zoomInId: "zoomInButton",
				// zoomOutId: "zoomOutButton"
			// }),
			//new OpenLayers.Control.PanZoomBar(),
			//new OpenLayers.Control.LayerSwitcher({'ascending':false}),
			//new OpenLayers.Control.Permalink(),
			new OpenLayers.Control.ScaleLine(),
			//new OpenLayers.Control.Permalink('permalink'),
			new OpenLayers.Control.MousePosition({
				displayProjection: this._wgsProjection
			}),
			new OpenLayers.Control.OverviewMap({maximized:true}),
			//new OpenLayers.Control.KeyboardDefaults(),
			//new OpenLayers.Control.Attribution()
		]
	});

	//Añadir capa de cartografía
	this._map.addLayer(new OpenLayers.Layer.OSM("osm"
	[
		"https://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
		"https://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
		"https://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
	]));
	//Añadir capa de rutas
	this._lineLayer = new OpenLayers.Layer.Vector("Route"); 
	this._map.addLayer(this._lineLayer);                    
	
	//Añadir capa de marcadores
	this._markers = new OpenLayers.Layer.Markers("Maneuvers");
	this._map.addLayer(this._markers);	

	// //Añadir capa de radios
	// this._radiusLayer = new OpenLayers.Layer.Vector("Radius"); 
	// this._map.addLayer(this._radiusLayer);                    
	
	//Posición y zoom por defecto
	var position = this._transformToSphM(new OpenLayers.LonLat(-4.0,41.0));
	this._map.setCenter(position, dpm.MapCto.DEFAULT_ZOOM);
	
	/*
	map.events.on({
			moveend:function(e){
				var positionSphM = new OpenLayers.LonLat(map.getCenter().lon,map.getCenter().lat);
				//var lonlat = map.getLonLatFromPixel(position);
				var positionWGS = transformToWGS84(positionSphM);
				//latLonEnd.lat=position.lat;
				//latLonEnd.lon=position.lon;
			},
			movestart:function(e){
				//nada que hacer				
			}
	});
	*/
	
	//Añadir controles
	this._map.addControl(new OpenLayers.Control.PanPanel());
	this._map.addControl(new OpenLayers.Control.DrawFeature(this._lineLayer, OpenLayers.Handler.Path));
	
	$(".olControlPanPanel").hide();
	
	//Inicializar icono de marcador por defecto
	var size = new OpenLayers.Size(24,24);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	this._defaultMarkerIcon = new OpenLayers.Icon('./img/default-marker.png', size, offset);
};

dpm.MapCto.prototype.centerAt = function(lon, lat)
{
	var position = this._transformToSphM(new OpenLayers.LonLat(lon,lat));	
	this._map.panTo(position);
};
	 
dpm.MapCto.prototype.addRoute = function(positions)
{
	var points = [];	
	positions.forEach(function(position)
	{
		points.push(new OpenLayers.Geometry.Point(position[0], position[1]).transform(this._wgsProjection, this._map.getProjectionObject()));
		//points.push(this._transformToSphM(new OpenLayers.LonLat(position[0],position[1])));
	}.bind(this));

	var line = new OpenLayers.Geometry.LineString(points);

	var style = { 
	  strokeColor: '#0080ff', 
	  strokeOpacity: 0.8,
	  strokeWidth: 5
	};

	var lineFeature = new OpenLayers.Feature.Vector(line, null, style);
	this._lineLayer.addFeatures([lineFeature]);
};

dpm.MapCto.prototype.addManeuver = function(lon, lat, html, urlIcon)
{
	var position = this._transformToSphM(new OpenLayers.LonLat(lon,lat));
	
	var icon = null;
	if(urlIcon)
	{
		icon = new OpenLayers.Icon(urlIcon);
	}
	else{
		icon = this._defaultMarkerIcon.clone();
	}
	
	var marker = new OpenLayers.Marker(position,icon);	
	this._markers.addMarker(marker);
	
	marker.events.register('mouseover', marker, function() 
	{
		if(this._popup)
		{
			this._popup.destroy();
		}
	
		this._popup = new OpenLayers.Popup.FramedCloud("pop-up", position, null, html, null, true);
		this._map.addPopup(this._popup);
		// marker.events.register('mouseout', marker, 
			// setTimeout( function() 
			// {
				// if(this._popup)
				// {
					// this._popup.destroy(); 
					// this._popup = null; 
				// }
			// }.bind(this), 4000));
		
	}.bind(this));
	
};

dpm.MapCto.prototype.addRadius = function(lon, lat, radius)
{
	var lonlat = this._transformToSphM(new OpenLayers.LonLat(lon,lat));
	var position = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
	var range = OpenLayers.Geometry.Polygon.createRegularPolygon
	(
		position,
		radius,
		40
	);
	
	var rangeFeature = new OpenLayers.Feature.Vector(range);
	this._lineLayer.addFeatures([rangeFeature]);
};

dpm.MapCto.prototype.clearNonMapLayers = function()
{
	this._lineLayer.removeAllFeatures();
	this._markers.clearMarkers();
};
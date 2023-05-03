'use strict';

var DIRECTIONS_URL = 'https://www.mapquestapi.com/directions/v2/route';
var SHAPE_URL = 'https://www.mapquestapi.com/directions/v2/routeshape';
var APP_KEY = 'XIofZDl1wMD4N30csprJrNBW976eAgwM';

var map = null;
var route = null;

function clear()
{
	map.clearNonMapLayers();
	route = {
		_totalDistance: 0,
		_totalTime: 0,
		_key: "key",
		_name: "name",
		_description: "description",
		_isClosed: false,
		_guidancePoints: [],
		_wayPoints: []
	};
}

function onCalculateRouteButtonClick()
{
	clear();
	
	var fromPlace = $('#fromPlace').val().trim();
	
	if(fromPlace)
	{
		requestDirections(fromPlace);
	}	
};

function requestDirections(fromPlace)
{
    var options={
		locations: [fromPlace],
		options:{
			ambiguities: 'ignore',
			unit: 'k',
			routeType: 'fastest',
			locale: 'es_ES',
			avoids: ['Toll Road'],
			narrativeType: 'microformat',
			enhancedNarrative: false,
			doReverseGeocoding: false,
			destinationManeuverDisplay: false,
			manMaps: true
		}
	};
	
	$(".waypoint").each(function()
	{
		var toPlace = $(this).val().trim();
		if(toPlace)
		{
			options.locations.push(toPlace);
		}
	});

	var url = DIRECTIONS_URL + '?key={0}&outFormat=json&inFormat=json&json={1}'.format(APP_KEY, JSON.stringify(options));
	
	$.ajax({
		url: url,
		dataType: 'jsonp',
		crossDomain: true,
		success: renderDirections,
		error: function(data) 
		{ 
			alert( 'error occurred: ' + JSON.stringify(options) );
		}
	});
}

function renderDirections(response) 
{
    var legs = response.route.legs;
	var directions = [];
    
	if(legs)
	{	
		var index = 1;
	
		legs.forEach(function(leg)
		{						
			leg.maneuvers.forEach(function(maneuver){
				
				var lon = maneuver.startPoint.lng;
				var lat = maneuver.startPoint.lat;
				
				var html = '<div class="description">';
				
				maneuver.signs.forEach(function(sign){
					if (sign.url) {
						html += '<img src="' + sign.url + '">  '; 
					}
				});
				
				var narrative = maneuver.narrative.replace("la rampa", "el carril").replace("ramp", "el carril");
				
				html += narrative;
				html += '</div>';
				
				map.addManeuver(lon, lat, html, maneuver.iconUrl);
				
				//Eliminar los tags de HTML de la narración
				var cleanedNarrative = narrative.replace(/<\/?[^>]+(>|$)/g, "");
				directions.push({
					_key: "gp" + index,
					_point: [lat, lon],
					_radius: 500.0,
					_narrative: cleanedNarrative
				});
				
				index++;
			});				
		});
	
		prepareDirectionsFile(directions);
		
		route._totalDistance += response.route.distance;
		route._totalTime += response.route.time;
		
		var timeFormatted = dpm.utils.secondsToTimeString(route._totalTime);
		
		$('#routeInfo').html('<span class="dataHead">Distancia</span><span>'+ route._totalDistance.toFixed(0) +
			' km</span><span class="dataHead">Tiempo est.</span><span>'+ timeFormatted + '</span>');	
		$('#routeInfo').show();
		
		var shapeOptions={
			locations: [fromPlace],
			options:{
				avoids: ['Toll road'],
				outFormat: 'json',
				routeType: 'fastest',
				narrativeType: 'none',
				shapeFormat: 'raw',
				generalize: 0,
				generalizeAfter: 500,
				direction: -1,
				avoidManeuverDuration: -1,
				unit: 'k',			
				fishbone: false
			}
		};
		requestShape(response.route.sessionId);
	}
	else
	{
		alert("no encontrado");
	}
}

function requestShape(sessionId)
{
    var url = SHAPE_URL + '?key={0}&sessionId={1}&fullShape=true'.format(APP_KEY, sessionId);
	
    $.ajax({
	    url: url,
	    dataType: 'jsonp',
	    crossDomain: true,
	    success: renderShape,
	    error: function(data) 
	    { 
		    alert( 'error occurred: ' + JSON.stringify(options) );
	    }
    });
}

function renderShape(response)
{
	var locations = [];
	
    if(response.route.shape.shapePoints)
    {
        var lat = 0;
        var lon = 0;
		var indexLocations = 0;
        var coordComponents = response.route.shape.shapePoints;
		
		for(var i = 0; i < coordComponents.length; i++){
		    if(i%2 !== 0){
	                lon = coordComponents[i];
					//Añadir 1 de cada N y siempre el último punto
					//Así la ruta es más "ligera"
					if(indexLocations % 8 === 0 || i === (coordComponents.length - 1)){
						locations.push([lon, lat]);
					}
					indexLocations++;
		    }else{
	    	        lat = coordComponents[i];
		    }
		}
		
		if(locations.length){
			map.centerAt(locations[0][0], locations[0][1]);
			map.addRoute(locations);
		}
		
		prepareGuidingFile(locations);
    }
}


// Prepara los puntos de ruta (waypoints)
function prepareGuidingFile(locations)
{
	if(locations && locations.length){		
		locations.forEach(function(location){
			route._wayPoints.push([location[1], location[0]]);
		});
	}
}

// Prepara los puntos de guiado (guidance-points)
function prepareDirectionsFile(directions)
{	
	if(directions){		
		route._guidancePoints = route._guidancePoints.concat(directions);
	}
}

function setRoute(route)
{
	if(route)
	{
		map.clearNonMapLayers();
		
		//Procesar puntos de ruta
		if(route._wayPoints && route._wayPoints.length)
		{
			//En la ruta las coordenadas est�n como [lat, lon], pero el mapa usa el formato [lon, lat].
			//Hay que dar la vuelta a los puntos.
			var points = [];
			route._wayPoints.forEach(function(point)
			{
				points.push([point[1], point[0]]);
			});
			map.addRoute(points);
			map.centerAt(points[0][0], points[0][1]);
		}
		
		//Procesar puntos de guiado
		if(route._guidancePoints && route._guidancePoints.length)
		{			
			route._guidancePoints.forEach(function(point)
			{
				var html="<div><p>Id: {0}</p><p>{1}</p><p>Radio: {2}</p></div>".format(point._key, point._narrative, point._radius);
				map.addManeuver(point._point[1], point._point[0], html);
				map.addRadius(point._point[1], point._point[0], point._radius);
			});

		}
	}
}

function onSetRouteInputChanged(event)
{
	//Retrieve the first (and only!) File from the FileList object
    var file = event.target.files[0]; 

    if (file)
	{
		var reader = new FileReader();
		reader.onload = function(event) 
		{ 
			var contents = event.target.result;
			route = JSON.parse(contents);
			setRoute(route);
		}
		reader.readAsText(file);
    } else { 
		alert("Failed to load file");
    }
}

function onAddWaypointButtonClick()
{
	var waypointsContainer = $("#Waypoints");
	var lastWaypoint = waypointsContainer.children().last().val();	
	if(lastWaypoint && lastWaypoint.trim() != "")
	{	
		$("<input class=\"waypoint\" type=\"text\">")
			.click(onWaypointChange)
			.appendTo(waypointsContainer);
	}
}

function onWaypointChange()
{
	var input = $(this);
	if(!input.is(':last-child') && input.val().trim() == "")
	{
		input.remove();
	}
}

$(function()
{
	$('#CalculateRouteButton').click(onCalculateRouteButtonClick);
	$("#AddWaypointButton").click(onAddWaypointButtonClick);
	$(".waypoint").change(onWaypointChange);
	$("#getRouteButton").click(function()
	{
		if(route && route._wayPoints.length && route._guidancePoints.length)
		{
			var json = JSON.stringify(route);
			dpm.utils.prepareForDownloadFile("GetRouteFileLink", "route.json", json);
			
			window.location = $("#GetRouteFileLink").attr("href");
		}
	});
	$("#setRouteInput").on('change', onSetRouteInputChanged);
	$('#routeInfo').hide();
	
	map = new dpm.MapCto();
	map.loadMap();
});
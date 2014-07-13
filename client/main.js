//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       Import Collections
//
//////////////////////////////////////////////////////////////////////////////////////////////

restaurants = new Meteor.Collection("discounts");


//subscribe to Collection Feeds
Meteor.subscribe("discounts");


//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                     Iron Router Page Routing
//
//////////////////////////////////////////////////////////////////////////////////////////////

//Setup iron router global configuration
Router.configure({
                 layoutTemplate: 'masterLayout',
                 notFoundTemplate: 'notFound',
                 loadingTemplate: 'loading'
                 });

//Global Router Hook for Back button
Router.onStop(function() {
              var current_location = $(location).attr('pathname');
              if (current_location === "/cart") {
              current_location = "/";
              }
              Session.set("last_location", current_location);
              });

//Setup iron router page routes
Router.map(function() {
           this.route('home', {
                      path: '/'
                      });
           this.route('configureYelp', {
                      path: '/yelp'
                      });
           });

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                          Map Area
//
//////////////////////////////////////////////////////////////////////////////////////////////

$(window).resize(function () {
                 var h = $(window).height(), offsetTop = 0;
                 $mc = $('#map_canvas');
                 $mc.css('height', (h - offsetTop));
                 }).resize();

var map, markers = [ ];

var initialize = function(element, centroid, zoom, features) {
    map = L.map(element, {
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                touchZoom: false
                }).setView(new L.LatLng(centroid[0], centroid[1]), zoom);
    
    L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {opacity: .5}).addTo(map);

}

var addMarker = function(marker) {
    map.addLayer(marker);
    markers[marker.options._id] = marker;
}

var removeMarker = function(_id) {
    var marker = markers[_id];
    if (map.hasLayer(marker)) map.removeLayer(marker);
}

var createIcon = function(store) {
    var className = 'leaflet-div-icon ';
    className += store.public ? 'public' : 'private';
    return L.divIcon({
                     iconSize: [30, 30],
                     html: '<b>' + attending(party) + '</b>',
                     className: className
                     });
}

var openCreateDialog = function (latlng) {
    Session.set("createCoords", latlng);
    Session.set("createError", null);
    Session.set("showCreateDialog", true);
};

Template.map.created = function() {
//    discounts.find({}).observe({
//                              added: function(store) {
//                              var marker = new L.Marker(store.latlng, {
//                                                        _id: store._id,
//                                                        icon: createIcon(store)
//                                                        }).on('click', function(e) {
//                                                              Session.set("selected", e.target.options._id);
//                                                              });
//                              addMarker(marker);
//                              },
//                              changed: function(store) {
//                              var marker = markers[store._id];
//                              if (marker) marker.setIcon(createIcon(store));
//                              },
//                              removed: function(store) {
//                              removeMarker(store._id);
//                              }
//                              });
}

//Map Helpers
Template.map.rendered = function() {
    
    // basic housekeeping
    $(window).resize(function () {
                     var h = $(window).height(), offsetTop = 300;
                     $('#map_canvas').css('height', (h - offsetTop));
                     }).resize();
    
    // initialize map events
    if (!map) {
        
        
        if(!Session.get("currentLat")){
            Session.set("currentLat","27.770220499999997");
            Session.set("currentLng","-82.65385220000002");
        }
        var currentLat = Session.get("currentLat");
        var currentLng = Session.get("currentLng");
        
        initialize($("#map_canvas")[0], [ currentLat, currentLng ], 13);
        
        map.on("dblclick", function(e) {
               if (! Meteor.userId()){
                    return;
               }
               openCreateDialog(e.latlng);
               });
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       GeoLocation
//
//////////////////////////////////////////////////////////////////////////////////////////////

var geo = Geolocation.getInstance();

Meteor.startup(function () {
               console.log(geo.localize());
               var x = geo.localize();
               console.log(x.lat + ":" + x.lng);
               console.log(x.timeout);
               });


Template.home.events({
                     "click #search_yelp": function () {
                            console.log(geo.localize().lat + " : " + geo.localize().lng);
                            Session.set("currentLat", geo.localize().lat);
                            Session.set("currentLng", geo.localize().lng);
                     }
                     });

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       Yelp API Call
//
//////////////////////////////////////////////////////////////////////////////////////////////

Template.home.yelpResult = function() {
    if(!Session.get("currentLat")){
        Session.set("currentLat","27.770220499999997");
        Session.set("currentLng","-82.65385220000002");
    }
    var currentLat = Session.get("currentLat");
    var currentLng = Session.get("currentLng");
    Meteor.call("searchYelp", "carwash", true, currentLat,currentLng,function(error, results) {
                if(results){
                        Session.set("yelpResult", JSON.parse(results.content));
                }else {
                        Session.set("yelpResult", error);
                }
                });
    if(Session.get("yelpResult")){
        return(Session.get("yelpResult"));
    }else {
        return "no data received from server";
    }
}

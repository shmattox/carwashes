//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       Import Collections
//
//////////////////////////////////////////////////////////////////////////////////////////////

restaurants = new Meteor.Collection("discounts");


//subscribe to Collection Feeds
Meteor.subscribe("discounts");
Meteor.subscribe("yelpconfig");


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
    
    //    //Add if check to see if user is DD driver and show controls
    //    map.attributionControl.setPrefix('');
    //
    //	var attribution = new L.Control.Attribution();
    //    attribution.addAttribution("Geocoding data &copy; 2013 <a href='http://open.mapquestapi.com'>MapQuest, Inc.</a>");
    //    attribution.addAttribution("Map tiles by <a href='http://stamen.com'>Stamen Design</a> under <a href='http://creativecommons.org/licenses/by/3.0'>CC BY 3.0</a>.");
    //    attribution.addAttribution("Data by <a href='http://openstreetmap.org'>OpenStreetMap</a> under <a href='http://creativecommons.org/licenses/by-sa/3.0'>CC BY SA</a>.");
    //
    //    map.addControl(attribution);
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
                     var h = $(window).height(), offsetTop = 300; // Calculate the top offset
                     $('#map_canvas').css('height', (h - offsetTop));
                     }).resize();
    
    // initialize map events
    if (!map) {
        initialize($("#map_canvas")[0], [ 27.770220499999997, -82.65385220000002 ], 13);
        
        map.on("dblclick", function(e) {
               if (! Meteor.userId()) // must be logged in to create parties
               return;
               
               openCreateDialog(e.latlng);
               });
    }
}



//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                  Yelp Configure Area
//
//////////////////////////////////////////////////////////////////////////////////////////////

// Using SimpleSchema
Schema = [];
Schema.configureYelp = new SimpleSchema({
                                        consumerKey: {
                                        type: String,
                                        label: "Yelp Consumer Key"
                                        },
                                        consumerSecret: {
                                        type: String,
                                        label: "Yelp Consumer Secret"
                                        },
                                        accessToken: {
                                        type: String,
                                        label: "Yelp Access Token"
                                        },
                                        accessTokenSecret: {
                                        type: String,
                                        label: "Yelp Access Token Secret"
                                        }
                                        });

Meteor.methods({
               configureYelp: function(oauth_config) {
                    check(oauth_config, Schema.configureYelp);
               
                    ServiceConfiguration.configurations.remove({
                                                         service: "yelp"
                                                         });
               
                    ServiceConfiguration.configurations.insert({
                                                          service:      "yelp",
                                                          consumerKey: oauth_config.consumerKey,
                                                          consumerSecret: oauth_config.consumerSecret,
                                                          accessToken: oauth_config.accessToken,
                                                          accessTokenSecret: oauth_config.accessTokenSecret
                                                         });
               }
               });


Template.configureYelp.helpers({
                               configureYelp: function() {
                                    return Schema.configureYelp;
                               },
                               currentConfig: function() {
                                    ServiceConfiguration.configurations.findOne({service: 'yelp'});
                               }
                               });


//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       Yelp API Call
//
//////////////////////////////////////////////////////////////////////////////////////////////

Template.home.api = function() {
    //yelp api return
    console.log("print yelp api below");
    return Meteor.call("searchYelp", "car+wash", "false",function(error, results) {
                       console.log(error);
                       console.log(results.content);
                       });
}

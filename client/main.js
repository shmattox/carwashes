//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       Import Collections
//
//////////////////////////////////////////////////////////////////////////////////////////////

Claimed = new Meteor.Collection("claimed");

//subscribe to Collection Feeds
Meteor.subscribe("claimed");

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

//Setup iron router page routes
Router.map(function() {
           this.route('home', {
                      path: '/',
                      waitOn: function(){
                      
                      navigator.geolocation.getCurrentPosition(function(position) {
                               ServerSession.set("currentLat", position.coords.latitude);
                               ServerSession.set("currentLng", position.coords.longitude);
                                                               
                               //Get Marker Lat Lng Info through Yelp Call
                               Meteor.call("searchYelp", "carwash", true, position.coords.latitude, position.coords.longitude, function(error, results) {
                                           if(results){
                                           var theResult = JSON.parse(results.content).businesses;
                                           ServerSession.set("yelpResult", theResult);
                                           }
                                });
                      });
                      
                      },
                      onBeforeAction: function(){
                                  ServerSession.set("selectedBusiness","");
                                  ServerSession.set("selectedBusinessData","");
                      }
                      });
           this.route('thebusiness', {
                      path: '/thebusiness',
                      onBeforeAction: function () {
                          if(ServerSession.get("yelpResult")){
                          var theResult = ServerSession.get("yelpResult");
                          theResult.forEach(function(business){
                                            if(business.id === ServerSession.get("selectedBusiness")){
                                            ServerSession.set("selectedBusinessData",business);
                                            }else {
                                            return false;
                                            }
                                            });
                          }else {
                          return false;
                          }
                      }
                      });
           this.route('profile', {
                      path: '/profile'
                      });
           this.route('about', {
                      path: '/about',
                      waitOn: function() {
                      return Meteor.subscribe('voltagePages');
                      },
                      action: function() {
                      Voltage.render(this);
                      }
                      });
           this.route('how', {
                      path: '/how-it-works',
                      waitOn: function() {
                      return Meteor.subscribe('voltagePages');
                      },
                      action: function() {
                      Voltage.render(this);
                      }
                      });
           this.route('contact', {
                      path: '/contact-us',
                      waitOn: function() {
                      return Meteor.subscribe('voltagePages');
                      },
                      action: function() {
                      Voltage.render(this);
                      }
                      });
           this.route('privacy', {
                      path: '/privacy-policy',
                      waitOn: function() {
                      return Meteor.subscribe('voltagePages');
                      },
                      action: function() {
                      Voltage.render(this);
                      }
                      });
           this.route('adminTemplate', {
                      path:'/admin',
                      template: 'accountsAdmin',
                      onBeforeAction: function() {
                            if (Meteor.loggingIn()) {
                                    this.render(this.loadingTemplate);
                            } else if(!Roles.userIsInRole(Meteor.user(), ['admin'])) {
                                    console.log('redirecting');
                                    this.redirect('/');
                            }
                      }
                      });
           });

var CW_AfterHooks = {
    buildMap: function() {
        
        //Map Helpers
        Template.map.rendered = function() {
            
            // basic housekeeping
            $(window).resize(function () {
                             var h = $(window).height(), offsetTop = 300;
                             $('#map_canvas').css('height', (h - offsetTop));
                             }).resize();
            
            //Get Current Lat/Lng from Session
            var currentLat = ServerSession.get("currentLat");
            var currentLng = ServerSession.get("currentLng");
            
            initialize($("#map_canvas")[0], [ ServerSession.get("currentLat"), ServerSession.get("currentLng") ], 10);
            
            $("#business-listing").on("click", function(e) {
                                      e.preventDefault();
                                      ServerSession.set("selectedBusiness",this.name);
                                      Router.go("thebusiness");
                                      });
        }
    }
}

// (Global) After hooks for any route
Router.onAfterAction(CW_AfterHooks.buildMap);

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       Master Layout Area
//
//////////////////////////////////////////////////////////////////////////////////////////////

//Master Layout Code
Template.masterLayout.currentuser = function () {
    return Meteor.userId();
}
Template.masterLayout.notcurrentuser = function () {
    if(Meteor.userId()){
        return false;
    } else {
        return true;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                          Map Area
//
//////////////////////////////////////////////////////////////////////////////////////////////

//Adjust for screen size
$(window).resize(function () {
                 var h = $(window).height(), offsetTop = 0;
                 $mc = $('#map_canvas');
                 $mc.css('height', (h - offsetTop));
                 }).resize();

//start the map
var initialize = function(element, centroid, zoom, features) {
    
    //Define Map variables
    var map, markers = [ ];
    
    //Build Map initial map settings
    map = L.map(element, {
                scrollWheelZoom: false,
                doubleClickZoom: true,
                boxZoom: false,
                touchZoom: true
                }).setView(new L.LatLng(centroid[0], centroid[1]), zoom);
    
    //Set Default Image Path
    L.Icon.Default.imagePath = '/packages/leaflet/images';
    
    //Get Marker Lat Lng Info through Yelp Call
    Meteor.call("searchYelp", "carwash", true, centroid[0], centroid[1],function(error, results) {
                if(results){
                var theResult = JSON.parse(results.content).businesses;
                ServerSession.set("yelpResult", theResult);
                theResult.forEach(function(result){
                                  
                                  currentAddress = result.location.address;
                                  currentAddress += result.location.city;
                                  
                                  lat = "";
                                  lng = "";
                                  
                                  //Create Print Marker Function
                                  var printMarker = function(result, lat, lng){
                                          if(ServerSession.get("selectedBusinessData")){
                                          if(result.id === ServerSession.get("selectedBusiness")){
                                          L.marker([lat,lng]).addTo(map).bindPopup("<h3>" + result.name + "</h3><img src='" + result.rating_img_url + "'/><p>" + result.location.display_address + "</p><a target='_blank' href='" + result.url + "'>View on Yelp</a>").openPopup();
                                          }
                                          } else {
                                          L.marker([lat,lng]).addTo(map).bindPopup("<h3>" + result.name + "</h3><img src='" + result.rating_img_url + "'/><p>" + result.location.display_address + "</p><a href='" + Router.path('thebusiness') + "' id='" + result.id + "' class='business-listing'>View Discounts</a> | <a target='_blank' href='" + result.url + "'>View on Yelp</a>");
                                          
                                          }
                                  }
                                  
                                  if(!result.location.coordinate){
                                  Meteor.call("getLatLng",currentAddress,function(err,res){
                                              if(res){
                                              res.forEach(function(location){
                                                          lat = location.latitude.toString();
                                                          lng = location.longitude.toString();
                                                          printMarker(result, lat, lng);
                                                          });
                                              }else {
                                              return false;
                                              }
                                              });
                                  } else {
                                            lat = result.location.coordinate.latitude.toString();
                                            lng = result.location.coordinate.longitude.toString();
                                  }
                                  
                                  if(lat | lng){
                                        printMarker(result, lat, lng);
                                  }else {
                                  return false;
                                  }
                                  });
                
                } else {
                ServerSession.set("yelpResult", error);
                }
                });
    
    //Make a Custom Div Icon for the Users Location
    var createIcon = function() {
        var className = "map-div-icon";
        return L.divIcon({
                         iconSize: [40, 40],
                         html: "<i class='fa fa-child'></i>",
                         className: className
                         });
    }
    
    //Set Even Trigger
    map.on('popupopen', function() {
           $('.business-listing').click(function(e){
                                ServerSession.set("selectedBusiness",this.id);
                                Router.go("thebusiness");
                     });
           });
    
    //Set Custom Marker to Current Location
    L.marker([ServerSession.get("currentLat"),ServerSession.get("currentLng")],{icon:createIcon()}).addTo(map);
    
    //Map Layer Tile and Style
    L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {opacity: .5}).addTo(map);
    
    //Check for Single Business Selection and Pan the Map to the Lat Lng
    if(ServerSession.get("selectedBusinessData")){
            var business = ServerSession.get("selectedBusinessData");
            var lat = business.location.coordinate.latitude;
            var lng = business.location.coordinate.longitude;
            map.panTo([lat,lng]).openPopup();
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                              Homepage Yelp Result List
//
//////////////////////////////////////////////////////////////////////////////////////////////

Template.home.yelpResult = function() {
    //Check Session for Lat/Lng and set if needed ( San Fran )
    if(!ServerSession.get("currentLat")){
        ServerSession.set("currentLat","37.523052");
        ServerSession.set("currentLng","-122.375336");
    }
    return ServerSession.get("yelpResult");
}

Template.home.events({
         "click .business-listing": function(){
                     ServerSession.set("selectedBusiness",this.id);
                     Router.go("thebusiness");
          }
});

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                              Business Specific Page
//
//////////////////////////////////////////////////////////////////////////////////////////////

//Print Single Business Data to The Business Page
Template.thebusiness.business = function() {
    var result = ServerSession.get("selectedBusinessData");
    if(result){
        if(Claimed.findOne({storeId:result.id})){
                ServerSession.set("claimedInfo",Claimed.findOne({storeId:result.id}));
        }
        return(ServerSession.get("selectedBusinessData"));
    }else {
        return "no data received from server";
    }
}

//Print Single Business Data to The Business Page
Template.thebusiness.isClaimed = function() {
    return ServerSession.get("claimedInfo");
}
Template.thebusiness.events({
                     "click #claim_listing": function(){
                            console.log("Claim this listing");
                            var result = ServerSession.get("selectedBusinessData");
                            var claimed_listing = {
                                    ownerId: Meteor.userId(),
                                    storeId: result.id,
                                    state: result.location.state,
                                    city:  result.location.city,
                                    discounts: []
                            };
                            
                            Meteor.call("claimListing",claimed_listing);
                     }
                     });

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                  Profile Page
//
//////////////////////////////////////////////////////////////////////////////////////////////

Handlebars.registerHelper('isAdminUser', function() {
                          return Roles.userIsInRole(Meteor.user(), ['admin']);
                          });

Handlebars.registerHelper('isStoreOwner', function() {
                          return Roles.userIsInRole(Meteor.user(), ['store-owner']);
                          });
//Cart Order Data
Template.profile.helpers ({
          //Cleanup, repeating 3 times in template
          email: function () {
                var userInfo = Meteor.user();
                var userEmail = userInfo.emails;
                return userEmail;
          }
});

Template.adminTemplate.helpers({
                       // check if user is an admin
                       isAdminUser: function() {
                       return Roles.userIsInRole(Meteor.user(), ['admin']);
                       }
                       });

//////////////////////////////////////////////////////////////////////////////////////////////
//
//                                  Startup Page
//
//////////////////////////////////////////////////////////////////////////////////////////////
Meteor.startup(function() {
               return SEO.config({
                                 title: 'Local Car Wash Near Me',
                                 meta: {
                                 'description': 'Find the best deals and discounts on local car washes near me.',
                                 'viewport': 'initial-scale=1.0'
                                 }
                                 });
               });

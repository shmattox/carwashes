//Discounts = new Meteor.Collection("discounts");
//
////publish discounts data
//Meteor.publish("discounts", function() {
//               return Discounts.find();
//               });
//

var getYelpOauthBinding = function(url) {
    var config = ServiceConfiguration.configurations.findOne({service: "yelp"});
    if (config) {
        config.secret = config.consumerSecret;
        var oauthBinding = new OAuth1Binding(config, url);
        oauthBinding.accessToken = config.accessToken;
        oauthBinding.accessTokenSecret = config.accessTokenSecret;
        return oauthBinding;
    } else {
        throw new Meteor.Error(500, "Yelp Not Configured");
    }
}

Meteor.methods({
               searchYelp: function(search, isCategory, latitude, longitude) {
                       //this.unblock();
                       
                       // Add REST resource to base URL
                       var url = "http://api.yelp.com/v2/search";
                       
                       var oauthBinding = getYelpOauthBinding(url);
                       
                       // Build up query
                       var parameters = {};
               
                       // Search term or categories query
                       if(isCategory) {
                            parameters.category_filter = search;
                       } else {
                            parameters.term = search;
                       }
               
                       // Set lat, lon location, if available or default location
                       if(longitude && latitude){
                            parameters.ll = latitude + "," + longitude;
                       } else {
                            parameters.location = "San+Francisco";
                       }
               
                        //Search Radius
                       parameters.radius_filter = "40000";
               
                       // Results limited to 5
                       parameters.limit = 10;
               
                       // Only return .data because that is how yelp formats its responses
                       return oauthBinding.get(url, parameters);
               },
               getLatLng: function(adr){
               
                        var geo = new GeoCoder();
                        var result = geo.geocode(adr);
                        return result;
               },
               getLocation: function(){
                        var geo = Geolocation.getInstance();
                        var x = geo.localize();
                        return x;
               },
               getProfile: function(str) {
               return Meteor.user({_id:Meteor.userId()});
               }
               
               });


Meteor.startup(function () {
               // code to run on server at startup
});


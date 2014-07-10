Discounts = new Meteor.Collection("discounts");

//publish discounts data
Meteor.publish("discounts", function() {
               return Discounts.find();
               });

//publish yelp data
Meteor.publish("yelpconfig", function() {
               return ServiceConfiguration.configurations.find({service: "yelp"});
               });


//Secure Methods to Call on Client
//Meteor.methods({
//               newOrder: function(str){
//               console.log("Adding Discount");
//               if(! Discounts.find({_id:Meteor.userId()})){
//                    console.log("Doesnt Exist Yet, Make Order");
//                    //not working
//                    Discounts.insert({_id:Meteor.userId()},{})
//               } else {
//                    Discounts.update({_id:Meteor.userId()}, { $push:{"discount":str}})
//               }
//
//               return true;
//               },
//               removeOrder: function(str) {
//                    Discounts.update({_id:Meteor.userId()}, {$pull: {'orders': {'id': str}}});
//                    console.log("Discount Removed");
//               },
//               queryYelp: function() {
//                    this.unblock();
//                    return Meteor.http.call("GET", "http://api.yelp.com/v2/search?term=food&location=San+Francisco");
//               }
//               });

// FILE SHOULD BE ON SERVER ONLY
var getYelpOauthBinding = function(url) {
    var config = ServiceConfiguration.configurations.findOne({service: "yelp"});
    if (config) {
        config.secret = config.consumerSecret;
        var oauthBinding = new OAuth1Binding(config, url)
        oauthBinding.accessToken = config.accessToken;
        oauthBinding.accessTokenSecret = config.accessTokenSecret;
        
        return oauthBinding;
    } else {
        throw new Meteor.Error(500, "Yelp Not Configured");
    }
}

Meteor.methods({
               customYelp: function (str) {
                        this.unblock();
                        return Meteor.http.call("GET", "http://api.yelp.com/v2/search?term=food&location=San+Francisco",
                                    {params: {
                                    service:      'yelp',
                                    domain:       'carwashes.auth0.com',
                                    clientId:     '8Mzv6otr1GVfQnlQcR8DUlzSmqIgBm1f',
                                    clientSecret: 'kxloCF1KwW1bkCzG99Hr3MadzV-19Z2Wo8-t2qbmvgWdqO72LMTCQiko5PQBj_-I'
                                    }, headers: {
                                    "content-type": "application/x-www-form-urlencoded"
                                    }});
               },
               searchYelp: function(search, isCategory, latitude, longitude) {
                       this.unblock();
                       
                       console.log("Yelp search for userId: " + this.userId + "(search, isCategory, lat, lon) with vals (", search, isCategory, latitude, longitude, ")");
                       
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
                       parameters.location = "New+York";
                       }
               
                       // Results limited to 5
                       parameters.limit = 5;
                       
                       // Only return .data because that is how yelp formats its responses
                       return oauthBinding.get(url, parameters).data;
               }
               });


Meteor.startup(function () {
               // code to run on server at startup
               //console.log(JSON.parse(Assets.getText('mcdonalds.json')));
});


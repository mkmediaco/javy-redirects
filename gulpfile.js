var runSequence = require('run-sequence');
var gulp        = require("gulp");
var clean       = require('gulp-clean');
var serve       = require('gulp-serve');
var sass        = require("gulp-sass");
var request     = require("request");
var fs          = require('fs');
var config      = require('dotenv').config()



// what goes where?
var buildSrc = "src";
var buildDest = "dist";



// local webserver for development
gulp.task('serve', serve({
  root: [buildDest],
  port: 8008,
}));






// Compile the templates into html
// We don't need a template tool for this, just copy the
// html files to the build folder
gulp.task("render", function () {
  gulp.src([buildSrc + '/pages/**/'])
    .pipe(gulp.dest(buildDest))
});


// get a list of routes stored in the form
gulp.task("get:routes", function () {

  var url = "https://api.netlify.com/api/v1/forms/" + process.env.ROUTES_FORM_ID + "/submissions?access_token=" + process.env.API_AUTH;

  request(url, function(err, response, body){

    // Parse successful responses
    if(!err && response.statusCode === 200){

      // parse and massage the data we hold in the routes form
      var routes = [];
      var formsData = JSON.parse(body);
      for(var item in formsData) {

        // Assume http if protocol is omitted
        var destination = formsData[item].data.destination;
         if(destination.indexOf("://") == -1) {
          destination = "http://" + destination;
        }

        // add this route to our list
        routes.push("/" + formsData[item].data.influencer + "  " + destination + "  302");
      }

      // save our routes to the redirect file
      fs.writeFile(buildDest + '/_redirects', routes.join('\n'), function(err) {
        if(err) {
          return console.log(err);
        } else {
          return console.log("Routes data saved.");
        }
      });

    } else {
      return console.log(err);
    }
  })

});






// build the site
gulp.task("build", function(callback) {
  runSequence(
    "clean-build",
    ["get:routes", "render", "js", "scss"],
    callback
  );
});

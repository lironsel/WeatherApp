
var http= require('http');
var fs= require('fs');
var ejs=require('ejs');
var myCrawler = require('./weatherCrawler');

//handle requests on port 8000
function onRequest(req,res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    //data array
    var cities=
    [];
    //start crawling, handle each location at a time and render html in the end,
    myCrawler.initiateCrawler("tel aviv")
        .then(function(weather){
            cities.push(weather)
            //push only after the crawler function finished
            myCrawler.initiateCrawler("new york")
                .then(function(weather) {
                    cities.push(weather);
                    myCrawler.initiateCrawler("haifa")
                        .then(function (weather) {
                            cities.push(weather);
                            //the data is rendered html
                            ejs.renderFile('./index.ejs', {cities: cities}, null, function (err, data) {
                                if (err) {
                                    res.writeHead(404);
                                    res.write('File not found');
                                }
                                res.write(data);
                                res.end();
                            });
                        });
                });
        });
}
http.createServer(onRequest).listen(8000);


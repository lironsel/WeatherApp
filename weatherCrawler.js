/**
 * Created by Liron on 29/07/2017.
 */

var crawler = require('crawler');
//const vars, wont change
const start_url = "https://www.accuweather.com/en/il/israel-weather";
const baseUrl = "http://www.accuweather.com";

// start crawler
var initiateCrawler = function(search_word) {
    // returns promise to make sure it will finish its work when its called, before continuing to execute more code after
    return new Promise(function (resolve,reject) {
        //for already visited pages
        var pagesVisited = [];
        //keep running while true
        var isRunning = true;
        var c = new crawler
        ({
            "maxConnections": 100,
            //commit for every page returned
            "callback": function (error, result, done) {
                if (isRunning) {
                    if (error) {
                        console.log("Error: " + error);
                    }
                    // all clear
                    else if (result) {
                        // allow html manipulation on $
                        var $ = result.$;
                        // stop crawling if found needed page
                        var stop = stopCrawling($, search_word);
                        if (stop) {
                            //collect the data from the page
                            var res = collectWeather($, search_word);
                            // console.log("found");
                            // crawling stop
                            isRunning = false;
                            // send result data from page
                            resolve(res);
                            //stop current crawl
                            process.exit;
                        }
                        else {
                            //collect links from page
                            var links = collectLinks($, search_word, pagesVisited);
                            //crawl each
                            links.forEach(function (link) {
                                c.queue(link);
                            })
                        }
                    }
                }
            }
        });
        //start crawling first url
        c.queue(start_url);
        // dont visit again
        pagesVisited.push(start_url);
    });
}

//return true if the current page is the wanted one, otherwise false
function stopCrawling($, search_word){
    //theres a meta tag with name= description
    if ($('meta[name=description]')!==undefined ){
        var attr = $('meta[name=description]').attr("content");
        // for some browsers, `attr` is undefined; for others `attr` is false if it doesnt exist
        if (typeof attr !== typeof undefined && attr !== false) {
            //check for the location, temprature, current in the content description inside meta tags
            if (attr.toLowerCase().indexOf("current") !== -1 && attr.toLowerCase().indexOf("temperature") !== -1 && attr.toLowerCase().indexOf(search_word) !== -1){
                return true;
            }
        }
    }
    return false;
}

//collect links on current page, the url includes the location name and not yet visited
function collectLinks($,search_word,pagesVisited){
    var relativeLinks = $("a[href^='/']");
    var val;
    var links= [];
    // if the location is 2 words, switch spaces with hyphen
    var wordInUrl=search_word.replace(/\s+/g, '-');
    //find all relative links- starts with '/'
    relativeLinks.each(function () {
        val=(baseUrl + $(this).attr('href'))
        if (!(pagesVisited.includes(val)) && val.toLowerCase().indexOf(wordInUrl) !== -1){
            links.push(val);
            pagesVisited.push(val);
        }
    });
    //stay in the same website but collect absolute urls
    var absoluteLinks = $("a[href^='https://www.accuweather']");
    absoluteLinks.each(function () {
        val=($(this).attr('href'));
        if (!(pagesVisited.includes(val))&& val.toLowerCase().indexOf(wordInUrl) !== -1){
            links.push(val);
            pagesVisited.push(val);
        }
    });
    //return all
    return links;
}

//collect weather data, executes when the current page has the needed data. spacific page
function collectWeather($,search_word){
    var data= {};
    data.temperature= $('#detail-now .temp').text();
    var stats= $(".stats li").map(function() {
        return $(this).text();
    }).toArray();
    data.city=search_word;
    data.windDirection= stats[0];
    data.windSpeed = stats [1];
    data.humidity= stats[2];
    // get the name of the icon class and extrect the number from it
    var iconNum = $('#detail-now div.icon').attr("class").match(/\d+/g)[0];
    // all numbers between 1-9, add '0' to the left
    iconNum = (iconNum < 10) ? ("0" + iconNum) : iconNum;
    // complete link to the correct wether icon
    data.icon = "https://vortex.accuweather.com/adc2010/images/slate/icons/" + iconNum + ".svg";
    return data;
}

exports.initiateCrawler = initiateCrawler;

var path = require('path')
var express = require('express')
var bodyparser = require('body-parser')
var mustacheExpress = require('mustache-express')
var nginxParser = require('./nginx-parser')
const fs = require("fs");

var app = express()

// Register '.html' extension with The Mustache Express
app.engine('html', mustacheExpress());

app.set('views', path.join(__dirname, 'public/templates'))
app.set('view engine', 'mustache');

// serve static content
app.use('/static', express.static('public'))

// Parse the body
app.use(bodyparser.urlencoded({extended: false}))

var channel = "auctionzip";
var filename = "/Users/tcheng/dev/projects/nginx/prod/conf.d/auctionzip/auctionzip.com.conf"
// var channel = "connect";
// var filename = "/Users/tcheng/dev/projects/nginx/prod/conf.d/connect-prd/connect.com.conf"

app.get('/', function(req, res) {
    res.render('index.html')
})

app.get('/data', function(req, res) {
    res.setHeader("Content-Type", "application/json")
    nginxParser(filename, channel, function (data) {
        res.end(JSON.stringify(data))
    })
})

app.get('/source', function(req, res) {
	fs.readFile(filename, 'utf-8', function(err, data) {
	    if (err) {
        	return console.log(err);
    	}
    	res.end(data);
	});

})

app.listen(4000)

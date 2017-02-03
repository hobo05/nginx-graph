// Load .env
var config = require('./config');

var path = require('path')
var express = require('express')
var ipfilter = require('express-ipfilter').IpFilter;
var bodyparser = require('body-parser')
var mustacheExpress = require('mustache-express')
var Promise = require("bluebird");
const fs = require("fs");

// local modules
var nginxParser = Promise.promisify(require('./nginx-parser'));
var latestCommit = require('./latest-git-master-commit');



var app = express()

// Register '.html' extension with The Mustache Express
app.engine('html', mustacheExpress());

app.set('views', path.join(__dirname, 'public/templates'))
app.set('view engine', 'mustache');

// ip filter
var ips = ['50.235.35.0/24'];
app.use(ipfilter(ips, {mode: 'allow'}));

// serve static content
app.use('/static', express.static('public'))

// Parse the body
app.use(bodyparser.urlencoded({extended: false}))

var channel = "AuctionZip";

const REPO_DIR = path.resolve(__dirname, "nginx");
var auctionZipConf = path.resolve(REPO_DIR, "prod/conf.d/auctionzip/auctionzip.com.conf");

// var filename = "/Users/tcheng/dev/projects/nginx/prod/conf.d/auctionzip/auctionzip.com.conf"
// var channel = "Connect-IB";
// var filename = "/Users/tcheng/dev/projects/nginx/prod/conf.d/connect-prd/connect.com.conf"

app.get('/', function(req, res) {
    res.render('index.html', {channel: channel})
})

app.get('/data', function(req, res) {
    res.setHeader("Content-Type", "application/json")

    nginxParser(auctionZipConf, channel
    ).then(data => {
        res.end(JSON.stringify(data))
    }).catch(error => console.error(error));
})

app.get('/source', function(req, res) {
	fs.readFile(auctionZipConf, 'utf-8', function(err, data) {
	    if (err) {
        	return console.error(err);
    	}
    	res.end(data);
	});

})

latestCommit(config("NGINX_CONF_REPO"), REPO_DIR)
    .then(() => {
        console.log("Nginx conf repo cloned successfully. Start server...")
        app.listen(config("PORT"))
    }).catch(error => console.error(error));

// Load .env
var config = require('./lib/config');

var path = require('path')
var express = require('express')
var ipfilter = require('express-ipfilter').IpFilter;
var bodyparser = require('body-parser')
var mustacheExpress = require('mustache-express')
var Promise = require("bluebird");
const fs = require("fs");

// Webpack
var webpack = require('webpack');
var webpackConfig = require('./webpack.config');
var compiler = webpack(webpackConfig);

// local modules
var nginxParser = Promise.promisify(require('./lib/nginx-parser'));
var latestCommit = require('./lib/latest-git-master-commit');



var app = express()

if (process.env.NODE_ENV !== 'production') {
    app.use(require("webpack-dev-middleware")(compiler, {
        noInfo: false, 
        publicPath: webpackConfig.output.publicPath
    }));

    app.use(require("webpack-hot-middleware")(compiler, {
        // path: "/__what",
        heartbeat: 2000
    }));
}


// Register '.html' extension with The Mustache Express
app.engine('html', mustacheExpress());

app.set('views', path.join(__dirname, 'src/templates'))
app.set('view engine', 'mustache');

// Whitelist IP(s) if they are passed in
var ipsString = config("WHITELISTED_IPS");
if (ipsString.length > 0) {
    var ips = ipsString.split(",");
    app.use(ipfilter(ips, {mode: 'allow', allowedHeaders: ['x-forwarded-for']}));
}

// serve static content
app.use(express.static(__dirname + '/dist'))

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

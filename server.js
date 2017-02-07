// Load .env
var config = require('./lib/config');

var path = require('path')
var express = require('express')
var ipfilter = require('express-ipfilter').IpFilter;
var bodyparser = require('body-parser')
var mustacheExpress = require('mustache-express')
var _ = require('lodash');
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
app.use(bodyparser.json());

// nginx conf repo directory
const REPO_DIR = path.resolve(__dirname, "nginx");

// Load the nginx conf JSON file
var nginxLoadConf = JSON.parse(fs.readFileSync(config("NGINX_CONF_LOAD_CONF")));

// Add field in object to determine if the conf key is the selectd one
function createSelectData(nginxLoadConf, selectedKey) {
    return _.map(nginxLoadConf, obj => {
        obj.selected = obj.key === selectedKey
        return obj;
    });
}

function getConfKey(req) {
    var confKey = defaultConfKey;
    if (req.body.confKey) {
        confKey = req.body.confKey;
    }
    return confKey;
}

function getConfPath(key) {
    // Find the path by confKey
    var confEntry = _.find(nginxLoadConf, ["key", key]);
    return path.resolve(REPO_DIR, confEntry.path);
}

// Select the default conf as the first one
var defaultConf = nginxLoadConf[0];
var defaultConfKey = defaultConf.key;
var defaultPath = path.resolve(REPO_DIR, defaultConf.path);

app.get('/', function(req, res) {
    var confKey = getConfKey(req);

    res.render('index.html', {
        confKey: confKey,
        nginxLoadConf: createSelectData(nginxLoadConf, confKey)
    })
})

app.post('/data', function(req, res) {
    res.setHeader("Content-Type", "application/json")

    var confKey = getConfKey(req);
    var absolutePath = getConfPath(confKey);

    nginxParser(absolutePath, confKey).then(data => {
        res.end(JSON.stringify(data))
    }).catch(error => console.error(error));
})

app.post('/source', function(req, res) {
    var confKey = getConfKey(req);
    var absolutePath = getConfPath(confKey);

	fs.readFile(absolutePath, 'utf-8', function(err, data) {
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

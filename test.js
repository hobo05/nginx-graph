var nginxParser = require('./nginx-parser')

var filename = "/Users/tcheng/dev/projects/nginx/prod/conf.d/auctionzip/auctionzip.com.conf"
nginxParser(filename, "auctionzip", function(data) {
    console.log(JSON.stringify(data))
})

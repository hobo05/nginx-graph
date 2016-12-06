# nginx-graph
A way to visualize nginx config files

## Features
* Display nginx config files in a tree diagram
* Interactive diagrams
* Scroll to source code from graph

## Technologies
* [Node.js](https://nodejs.org) - Server-side Javascript
* [NPM](https://www.npmjs.com/) - Node package manager
* [ExpressJS](http://expressjs.com/) - Node webserver
* [GoJS](http://gojs.net/) - Interactive diagrams in HTML
* [Mustache on Express](https://www.npmjs.com/package/mustache-express) - Templating language
* [Webpack](http://webpack.github.io/docs/) - Javascript module bundler
* [highlightjs](https://highlightjs.org/) - Syntax highlighting for source code
* [markjs](https://markjs.io/) - Javascript keyword highlighting

## Endpoints

* `GET /` - homepages
* `GET /data` - json representation of graph objects
* `GET /source` - source files of nginx config

## How it works

### Build Process
1. Use npm to install dependencies
2. use webpack to process module *.js files into one compiled and optimized js file

### Parsing
1. Load nginx config file using the "readline" lib in node
2. Parse nginx config sections into graph objects with properties
3. Link graph objects to their parents during parsing
4. Return graph objects as a json array

### Rendering the diagram
1. Define diagram properties
* Make an ajax call to `/data` to get graph objects
* Render diagram on callback

### Source code highlighting
1. Define code block in HTML
2. Make an ajax call to `/source` and set the code block to the source
3. Use highlightjs to highlight the code block on callback

## How to run it
* Clone the repo
```bash
git clone https://github.com/hobo05/nginx-graph.git
cd nginx-graph
```
* Find the following lines in app.js
```javascript
var channel = "AuctionZip";
var filename = "/Users/tcheng/dev/projects/nginx/prod/conf.d/auctionzip/auctionzip.com.conf"
```
* Change the filename to the path where your nginx config file exists
* Change the channel if you wish the root node of the diagram to display correctly
* Install the dependencies and start the app
```bash
npm install
npm start
```
* Go to <http://localhost:4000> to see the rendered diagram

# nginx-graph
A way to visualize nginx config files

## Features
* Display nginx config files in a tree diagram
* Switching between multiple config files with no page reload
* Resolve include files recursively
* Fully-configurable using .rc file(s)
* Hover mouse over nodes to see associated source code
* Right-click on nodes to scroll to source code from graph

## Technologies
* [Node.js](https://nodejs.org) - Server-side Javascript
* [NPM](https://www.npmjs.com/) - Node package manager
* [ExpressJS](http://expressjs.com/) - Node webserver
* [NodeGit](http://www.nodegit.org/) - Asynchronous native Node bindings to libgit2
* [GoJS](http://gojs.net/) - Interactive diagrams in HTML
* [Mustache on Express](https://www.npmjs.com/package/mustache-express) - Templating language
* [Webpack v1.x](http://webpack.github.io/docs/) - Javascript module bundler and hot-reloading for client-side code
* [highlightjs](https://highlightjs.org/) - Syntax highlighting for source code
* [markjs](https://markjs.io/) - Javascript keyword highlighting
* [babel](http://babeljs.io/) - Javascript compiler to support ES6 syntax
* [Blue Bird](http://bluebirdjs.com/) - Feature-rich Promise library
* [Lodash](https://lodash.com/) - JS Utility library
* [funcy](https://github.com/Suor/funcy) - Functional pattern-matching
* [rc](https://github.com/dominictarr/rc) - The non-configurable configuration loader for lazy people
* [nodemon](https://nodemon.io/) - Monitor and reload server-side changes

## Endpoints

* `GET /` - homepages
* `POST /data` - json representation of graph objects
* `POST /source` - source files of nginx config

## How it works

### Build Process
1. Use npm to install dependencies
2. Use webpack to process module *.js files into one compiled and optimized js file

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

## How to run it locally
* Clone the repo

```bash
$ git clone https://github.com/hobo05/nginx-graph.git
$ cd nginx-graph
$ cp .env-example .env
```

* Open up .env
* Update all the various fields
* Open up [.nginxGraphrc](https://github.com/hobo05/nginx-graph/blob/master/.nginxGraphrc) and configure the application
* Install the dependencies and start the app
* 
```bash
npm install
npm run local-dev
```
* Go to <http://localhost:3000> (or whatever port you set in .env) to see the rendered diagram
* Since we've set up [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) and [webpack-hot-middleware](https://github.com/glenjamin/webpack-hot-middleware), the client-side JS should compile and the page should automatically reload during development

**Note:** The reason we're using local-dev is because we're using nodemon to run the server instead of directly using node

## How to run it in Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

1. After performing the local setup and seeing that everything works, sign up for Heroku on the free plan with the button above
* Follow the tutorial for [Getting Started on Heroku with Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs) if you don't know how Heroku works
* Create a new Heroku app from your project root
* Install <https://github.com/xavdid/heroku-config> and push your .env settings to heroku
* Run `heroku buildpacks:add --index 1 https://github.com/heroku/heroku-buildpack-apt`. This will tell heroku to run the Aptfile in the root of the project which installs necessary libraries for NodeGit before starting the app. See this [github issue](https://github.com/nodegit/nodegit/issues/845) for more details
* Run `git push heroku master` and it should be up in running in the cloud!

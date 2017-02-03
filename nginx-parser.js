const fs = require("fs");
const readline = require('readline');
var Multimap = require('multimap');

// var filename = "/Users/tcheng/dev/projects/nginx/prod/conf.d/auctionzip/auctionzip.com.conf";

module.exports = function(filename, rootParent, callback) {
    var parseStack = []
    var nginxGraphObjects = []
    var rootKey = 0;
    var currentKey = 1;


    readline.createInterface({
        input: fs.createReadStream(filename),
        terminal: false
    }).on('line', function(line) {

        // Skip these the charset map and comments
        if (line.match(/charset_map/) ||
            line.match(/\s*#/)) {
            return;
        }

        if (line.match(/}/)) {
            var lastobj = parseStack.pop();

            // If there is a root object, add this object to it
            var rootObject = parseStack.peek();
            if (rootObject) {
                var valueMultiMap = getOrCreateMultiMap(rootObject, "children")
                valueMultiMap.set(lastobj.name, lastobj)

                // Set the object's parent to the root object's name
                lastobj.parent = rootObject.key
                return
            } else {
            	// If there is no rootObject, set it to the rootParent
            	lastobj.parent = rootKey;

            	// Add to graph objects
            	nginxGraphObjects.push(lastobj);
            }
            // console.log("lastobj=" + JSON.stringify(lastobj))
            // printProperties(lastobj.properties)
            return;
        }

        var obj = line.match(/(\w+)\s+(.*)\s*{/)
        if (obj) {
            parseStack.push({key: currentKey++, name: obj[1], type: obj[1], value: obj[2] });
            // printStack()
            return;
        }

        var prop = line.match(/(\w+)\s+(.+);/)
        if (prop) {
            var curObj = parseStack.peek()
            var valueMultiMap = getOrCreateMultiMap(curObj, "properties")

            // Set property in multimap
            var propName = prop[1];
            var propValue = prop[2];
            valueMultiMap.set(propName, propValue);

            // If the server name is found, set that as the name
			if (curObj.name === "server" && propName === "server_name") {
				curObj.name = propValue;
			}  
            else if (curObj.type === "location" && propName === "proxy_pass") {
                nginxGraphObjects.push({key: currentKey++, name: propValue, type: propName, parent: curObj.key });
            }
        }
    }).on('close', function() {
    	// Create root parent inside
    	var graphObjs = [{key: rootKey, name: rootParent, type: "channel"}];

    	nginxGraphObjects.forEach(function (curObj) {
    		graphObjs = graphObjs.concat(parseAsGraphObjects(curObj, []))
    	});
        return callback(null, graphObjs);
    })

};

function getOrCreateMultiMap(obj, propName) {
    var valueMultiMap = obj[propName]
    if (!valueMultiMap) {
        valueMultiMap = new Multimap();
        obj[propName] = valueMultiMap;
    }
    return valueMultiMap;
}

function parseAsGraphObjects(nginxObject, createdObjects) {

	if (nginxObject.name === "location") {
		nginxObject.name = nginxObject.value;
	}

    if (nginxObject.properties) {
        var toolTip = "";
        nginxObject.properties.forEach(function(value, key) {
            toolTip += key + ": " + value + "\n";
        });
        nginxObject.propertiesTooltip = toolTip;
    }

	// First add the object to the created list
	createdObjects.push(nginxObject);

	// If there are no children, simply return
	if (!nginxObject.children) {
		return createdObjects;
	}

	// Go through each child and parse out their descendents
	// and add it to the list
	nginxObject.children.forEach(function (value, key) {
		var parsedChildren = parseAsGraphObjects(value, []);
		createdObjects = createdObjects.concat(parsedChildren)
	})

	return createdObjects;
}

function printStack() {
    console.log("parseStack=" + JSON.stringify(parseStack) + ", peek=" + JSON.stringify(parseStack.peek()));
}

function printProperties(map) {
    map.forEach(function(value, key) {
        console.log("key=" + key, "value=" + value)
    })
}

Array.prototype.peek = function() {
    return this[this.length - 1];
}

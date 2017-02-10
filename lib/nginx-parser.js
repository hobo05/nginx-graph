var config = require('./config');

const fs = require("fs");
const readline = require("readline");
var path = require("path");
var Multimap = require("multimap");
var _ = require('lodash');
var minimatch = require("minimatch")
var fun = require('funcy');
var appRootDir = require('app-root-dir').get();

const REGEX_SECTION_END = /}\s*$/;
const REGEX_SECTION_START = /(\w+)\s+(.*)\s*{\s*$/;
const REGEX_SECTION_START_NO_BRACKET = /(\w+)\s+(.*)\s*$/;
const REGEX_SECTION_START_ONLY_BRACKET = /^\s*{\s*$/;
const REGEX_PROPERTY = /(\w+)\s+(.+);\s*$/;


function parseLine(context, line) {
    // Replace all tabs with spaces
    line = line.replace(/\t/g, " ");

    // Skip these lines
    if (line.length === 0 ||            // Ignore empty lines
        line.match(/^\s+$/) ||          // Ignore lines with only spaces
        line.match(/charset_map/) ||    // Ignore charset_map
        line.match(/\s*#/)) {           // Ignore commented lines
        return;
    }

    // console.log(`line=${line}`)
    // console.log(`line.match(REGEX_SECTION_END)=${JSON.stringify(line.match(REGEX_SECTION_END))}`);

    // TODO add try...finally and set context.lastUnparsedLine so when '{' is
    // detected, it can use the last unparsed line to detect a section

    var matchLine = fun(
        [REGEX_SECTION_START, () => parseSectionStart(context, line, REGEX_SECTION_START)],
        [REGEX_PROPERTY, () => parseProperty(context, line)],
        [REGEX_SECTION_START_ONLY_BRACKET, () => parseSectionStartOnlyBracket(context, line)],
        [REGEX_SECTION_END, () => parseSectionEnd(context, line)],
        [fun.wildcard, () => context.unparsedLinesStack.push(line)]
    );

    matchLine(line);
}

/**
 * Parses a section that only has a start bracket '{' by 
 * looking behind to find the actual section heading
 * 
 * @param  {Object} context The parsing context
 * @param  {String} line    The current line
 */
function parseSectionStartOnlyBracket(context, line) {
    // Read the first unparsed line and check if it's a section heading
    var lastUnparsedLine = context.unparsedLinesStack.peek();
    if (lastUnparsedLine && lastUnparsedLine.match(REGEX_SECTION_START_NO_BRACKET)) {
        // Remove the last unparsed line as we have successfully found the section heading
        context.unparsedLinesStack.pop();
        // Parse the section heading
        parseSectionStart(context, lastUnparsedLine, REGEX_SECTION_START_NO_BRACKET);
    } else {
        throw new Error(`Current [line="${line}"] is a section starting bracket, cannot find an unparsed line that represents a section heading [context.unparsedLinesStack=${context.unparsedLinesStack}]`);
    }
}

/**
 * Parses the section heading by using the regex to extract the relevant parts
 * 
 * @param  {Object} context The parsing context
 * @param  {String} line    The current line
 * @param  {Regex}  regex   The regular expression that will be used to extract the section heading elements
 */
function parseSectionStart(context, line, regex) {
    let section = line.match(regex);
    // console.log(`section=${section}`)
    context.parseStack.push({key: context.currentKey++, name: section[1], type: section[1], value: section[2] });
}

function parseSectionEnd(context, line) {

    // printStack(context);
    // console.log(`section end line detected`);
    var lastobj = context.parseStack.pop();

    // If there is a root object, add this object to it
    var rootObject = context.parseStack.peek();
    // console.log(`rootObject=${JSON.stringify(rootObject)}`);
    if (rootObject) {
        var valueMultiMap = getOrCreateMultiMap(rootObject, "children")
        valueMultiMap.set(lastobj.name, lastobj)

        // Set the object's parent to the root object's name
        lastobj.parent = rootObject.key
    } else {
        // If there is no rootObject, set it to the rootParent
        lastobj.parent = context.rootKey;

        // Add to graph objects
        context.nginxGraphObjects.push(lastobj);
    }
}

function parseProperty(context, line) {
    let prop = line.match(REGEX_PROPERTY);
    // console.log(`line=${line}, prop=${prop}`)
    let propName = prop[1];
    let propValue = prop[2];
    // printStack(context);

    let curObj = context.parseStack.peek()
    // console.log(`curObj=${JSON.stringify(curObj)} \n`);

    let valueMultiMap = getOrCreateMultiMap(curObj, "properties")

    // Set property in multimap
    valueMultiMap.set(propName, propValue);

    // If the server name is found, set that as the name
    if (curObj.name === "server" && propName === "server_name") {
        curObj.name = propValue;
    }  
    else if (curObj.type === "location" && propName === "proxy_pass") {
        context.nginxGraphObjects.push({key: context.currentKey++, name: propValue, type: propName, parent: curObj.key });
    }

    if (prop[1] === "include" 
        && context.enableIncludes 
        && !minimatch(propValue, context.ignorePattern, { matchBase: true })) {
        // console.log(`include line=${line}`)
        // console.log(`prop=${propValue}, relativePath=${path.relative("/etc/nginx", propValue)}`);

        var matchCors = minimatch(propValue, "cors", { matchBase: true });
        // console.log(`matchCors=${matchCors}`);

        // Create relative path and load it
        var relativePath = context.relativeIncludePath ? path.relative(context.relativeIncludePath, propValue) : propValue;
        // console.log(`relativePath=${relativePath}`);
        

        var mappedSearchPaths = _.map(context.includeSearchPaths, searchPath => path.resolve(searchPath, relativePath));
        // console.log(`mappedSearchPaths=${JSON.stringify(mappedSearchPaths)}`)
        var includePath = _.find(mappedSearchPaths, fs.existsSync);
        // console.log(`includePath=${includePath}`)

        // If the include path exists, load it synchrounously and parse each line
        if (includePath) {
            var includeLines = fs.readFileSync(includePath, 'utf8').split("\n");
            _.each(includeLines, line => parseLine(context, line));
        }
    }
}

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

function printStack(context) {
    var parseStack = context.parseStack;
    console.log(`parseStack=${JSON.stringify(parseStack, null, 4)}, peek=${JSON.stringify(parseStack.peek(), null, 4)}`);
}

function printProperties(map) {
    map.forEach(function(value, key) {
        console.log(`key=${key}, value=${value}`)
    })
}

Array.prototype.peek = function() {
    return this[this.length - 1];
}

module.exports = (nginxConfEntry, enableIncludes, callback) => {

    // console.log(`nginxConfEntry=${JSON.stringify(nginxConfEntry)}`)
    var includesConf = nginxConfEntry.includesConf ? nginxConfEntry.includesConf : {};

    var parsingContext = {
        parseStack: [],
        nginxGraphObjects: [],
        rootKey: 0,
        currentKey: 1,
        unparsedLinesStack: [],
        enableIncludes: enableIncludes,
        relativeIncludePath: includesConf.relativePath ? includesConf.relativePath : undefined,
        includeSearchPaths: includesConf.searchPaths ? includesConf.searchPaths : [],
        ignorePattern: includesConf.ignorePattern ? includesConf.ignorePattern : ""
    }

    // Resolve include search paths using the conf root dir
    // console.log(`parsingContext=${JSON.stringify(parsingContext, null, 4)}`)
    parsingContext.includeSearchPaths = _.map(parsingContext.includeSearchPaths, curPath => path.resolve(config.nginxConfRootDir, curPath));

    // console.log(`appRootDir=${appRootDir}, config.nginxConfRootDir=${config.nginxConfRootDir}, nginxConfEntry.path=${nginxConfEntry.path}`);
    var filename = path.resolve(appRootDir, config.nginxConfRootDir, nginxConfEntry.path);

    readline.createInterface({
        input: fs.createReadStream(filename),
        terminal: false
    }).on('line', line => parseLine(parsingContext, line))
    .on('close', () => {
        // Create root parent inside
        var graphObjs = [{key: parsingContext.rootKey, name: nginxConfEntry.key, type: "channel"}];

        parsingContext.nginxGraphObjects.forEach(curObj => {
            graphObjs = graphObjs.concat(parseAsGraphObjects(curObj, []))
        });
        return callback(null, graphObjs);
    })

};

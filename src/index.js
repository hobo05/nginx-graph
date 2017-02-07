// Load jquery and bootstrap
var $ = require('jquery');
global.jQuery = require('jquery');
require('bootstrap');

// Load highlightjs for source code highlighting
global.hljs = require("highlightjs");
// Allow rendering of line numbers
require("./js/highlightjs-line-numbers.min");

// Load the theme for source code
require("style-loader!css-loader!./styles/solarized-dark.css");

// Load markjs jQuery plugin
require("./js/jquery.mark.min");

// Load goJS to render graphs
var $$ = require("gojs");

// Create the current conf key JSON from the select
var createConfJson = () => JSON.stringify({"confKey": $("#confKey").val()});

// Retrieve the diagram data from server
var retrieveDiagramData = () => {
    return $.ajax({
        url: '/data', //the URL to your node.js server that has data
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        cache: false,
        data: createConfJson()
    })
};

// Retrieve the source code from the server andn highlight the code
var retrieveAndSetSourceCode = () => {
    $.ajax({
        url: '/source', //the URL to your node.js server that has data
        method: 'POST',
        contentType: 'application/json',
        cache: false,
        data: createConfJson()
    }).done(data => {
        var sourceCode = $("<code></code>").addClass("nginx");
        sourceCode.text(data);

        var sourceContainer = $("#source")
        sourceContainer.empty();
        sourceContainer.append(sourceCode);

        $('pre code').each((i, block) => {
            hljs.highlightBlock(block);
            hljs.lineNumbersBlock(block);
        });
    })
}


// Declare myModel here so it can be updated dynamically
var myModel;

document.body.onload = $(() => {
    retrieveDiagramData().done(data => createDiagram(data));

    retrieveAndSetSourceCode();

    $('#confKey').on('change', event => {
        retrieveDiagramData().done(data => myModel.nodeDataArray = data);
        retrieveAndSetSourceCode();
    });
});

// var nodeDataArray = [
//     { key: "*.auctionzip.com" },
//     { key: "NGINX", parent: "*.auctionzip.com" },
//     { key: "www.auctionzip.com", parent: "NGINX", test: "key" },
//     { key: "bweb:3001", parent: "NGINX" },
//     { key: "bweb:8000", parent: "NGINX" },
//     { key: "bsvz-az", parent: "NGINX" }
// ];

// document.body.onload = createDiagram(nodeDataArray)

function createDiagram(dataArray) {

    var $$ = go.GraphObject.make; // for conciseness in defining templates

    var myDiagram = $$(go.Diagram, "myDiagramDiv", // create a Diagram for the DIV HTML element
        {
            "toolManager.hoverDelay": 100,  // 100 milliseconds instead of the default 850
            initialContentAlignment: go.Spot.Center, // center the content
            "undoManager.isEnabled": true // enable undo & redo
        });

    // To simplify this code we define a function for creating a context menu button:
    function makeButton(text, action, visiblePredicate) {
        return $$("ContextMenuButton",
            $$(go.TextBlock, text), { click: action },
            // don't bother with binding GraphObject.visible if there's no predicate
            visiblePredicate ? new go.Binding("visible", "", visiblePredicate).ofObject() : {});
    }

    // a context menu is an Adornment with a bunch of buttons in them
    var partContextMenu =
        $$(go.Adornment, "Vertical",
            makeButton("Source",
                (e, obj) => { // OBJ is this Button
                    var contextmenu = obj.part; // the Button is in the context menu Adornment
                    var part = contextmenu.adornedPart; // the adornedPart is the Part that the context menu adorns
                    // now can do something with PART, or with its data, or with the Adornment (the context menu)
                    if (part instanceof go.Link) alert(linkInfo(part.data));
                    else if (part instanceof go.Group) alert(groupInfo(contextmenu));
                    else {
                        // Mark the source and scroll to it smoothly
                        $("pre").unmark();
                        $("pre").mark(part.data.name);


                        var firstMatch = $("pre").find("mark").eq(0);
                        if (firstMatch.length) {
                            // Find the offset that sets the element in the middle
                            var elOffset = firstMatch.offset().top;
                            var elHeight = firstMatch.height();
                            var windowHeight = $(window).height();
                            var offset;

                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({ scrollTop: offset }, 700);
                        }
                    }
                })
        );

    // get tooltip text from the object's data
    function tooltipTextConverter(nginxConfig) {        
        return nginxConfig.propertiesTooltip;
    }

    // define tooltips for nodes
    var tooltiptemplate =
      $$(go.Adornment, "Auto",
        $$(go.Shape, "Rectangle",
          { fill: "whitesmoke", stroke: "black" }),
        $$(go.TextBlock,
          { font: "bold 8pt Helvetica, bold Arial, sans-serif",
            wrap: go.TextBlock.WrapFit,
            margin: 5 },
          new go.Binding("text", "", tooltipTextConverter))
      );

    myDiagram.nodeTemplate =
        $$(go.Node, "Vertical", // second argument of a Node/Panel can be a Panel type
            { toolTip: tooltiptemplate }, {
                mouseEnter: (e, obj) => {
                    var node = obj.part;
                    console.log("parent=" + node.data.test)
                }
            },
            // example Node binding sets Node.location to the value of Node.data.loc
            new go.Binding("location", "loc"),

            $$(go.Panel, "Auto", // second argument of a Node/Panel can be a Panel type
                {  },

                // GraphObjects contained within the Node
                // this Shape will be vertically above the TextBlock
                $$(go.Shape,
                    "RoundedRectangle", // string argument can name a predefined figure
                    { width: 200, height: 50, fill: null },
                    // example Shape binding sets Shape.figure to the value of Node.data.fig
                    new go.Binding("figure", "fig")),

                $$(go.TextBlock,
                    "default text", // string argument can be initial text string
                    { font: "bold 18px sans-serif" },
                    // example TextBlock binding sets TextBlock.text to the value of Node.data.key
                    new go.Binding("text", "type"))
            ),

            $$(go.TextBlock,
                "default text", // string argument can be initial text string
                { /* set TextBlock properties here */ },
                // example TextBlock binding sets TextBlock.text to the value of Node.data.key
                new go.Binding("text", "name")), {
                // this context menu Adornment is shared by all nodes
                contextMenu: partContextMenu
            }
        );

    myModel = $$(go.TreeModel);
    // in the model data, each node is represented by a JavaScript object:
    myModel.nodeDataArray = dataArray

    myDiagram.model = myModel;

    myDiagram.layout =
        $$(go.TreeLayout, { angle: 90, layerSpacing: 50 });

    // define a Link template that routes orthogonally, with no arrowhead
    myDiagram.linkTemplate =
        $$(go.Link,
            // default routing is go.Link.Normal
            // default corner is 0
            { routing: go.Link.Orthogonal, corner: 5 },
            $$(go.Shape, { strokeWidth: 3, stroke: "#555" }), // the link shape

            // if we wanted an arrowhead we would also add another Shape with toArrow defined:
            $$(go.Shape, { toArrow: "Standard", stroke: null })
        );

    $("#zoomToFit").on("click", () => myDiagram.zoomToFit());

    $("#centerRoot").on("click", () => {
        // reset the scale
        myDiagram.scale = 1;
        
        // Find the root node by example
        var iter = myDiagram.findNodesByExample({type: "channel"});
        var rootNode = iter.first();
        // Scroll to the root node
        myDiagram.scrollToRect(rootNode.actualBounds);

    });

}

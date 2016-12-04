var $ = require("jquery");
var $$ = require("gojs");

document.body.onload = $(function() {
    $.ajax({
        url: '/data', //the URL to your node.js server that has data
        dataType: 'json',
        cache: false
    }).done(function(data) {
        createDiagram(data);
    });

    $.ajax({
        url: '/source', //the URL to your node.js server that has data
        cache: false
    }).done(function(data) {
        var sourceCode = $("pre>code");
        sourceCode.text(data);

        $('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
            hljs.lineNumbersBlock(block);
        });
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
    if (window.goSamples) goSamples(); // init for these samples -- you don't need to call this

    var $$ = go.GraphObject.make; // for conciseness in defining templates

    myDiagram = $$(go.Diagram, "myDiagramDiv", // create a Diagram for the DIV HTML element
        {
            initialContentAlignment: go.Spot.Center, // center the content
            "undoManager.isEnabled": true // enable undo & redo
        });

    myDiagram.nodeTemplate =
        $$(go.Node, "Vertical", // second argument of a Node/Panel can be a Panel type
            { /* set Node properties here */ }, {
                mouseEnter: function(e, obj) {
                    var node = obj.part;
                    console.log("parent=" + node.data.test)
                }
            },
            // example Node binding sets Node.location to the value of Node.data.loc
            new go.Binding("location", "loc"),

            $$(go.Panel, "Auto", // second argument of a Node/Panel can be a Panel type
                { /* set Node properties here */ },

                // GraphObjects contained within the Node
                // this Shape will be vertically above the TextBlock
                $$(go.Shape,
                    "RoundedRectangle", // string argument can name a predefined figure
                    { width: 200, height: 50, fill: null },
                    // example Shape binding sets Shape.figure to the value of Node.data.fig
                    new go.Binding("figure", "fig")),

                $$(go.TextBlock,
                    "default text", // string argument can be initial text string
                    { /* set TextBlock properties here */ },
                    // example TextBlock binding sets TextBlock.text to the value of Node.data.key
                    new go.Binding("text", "mainProp"))
            ),

            $$(go.TextBlock,
                "default text", // string argument can be initial text string
                { /* set TextBlock properties here */ },
                // example TextBlock binding sets TextBlock.text to the value of Node.data.key
                new go.Binding("text", "key"))
        );

    var myModel = $$(go.TreeModel);
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
}

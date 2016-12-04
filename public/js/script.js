document.body.onload = $(function() {
    $.ajax({
        url: '/data', //the URL to your node.js server that has data
        dataType: 'json',
        cache: false
    }).done(function(data) {
        createDiagram(data);
    });
});

function createDiagram(dataArray) {
    if (window.goSamples) goSamples(); // init for these samples -- you don't need to call this

    var GO = go.GraphObject.make; // for conciseness in defining templates

    myDiagram = GO(go.Diagram, "myDiagramDiv", // create a Diagram for the DIV HTML element
        {
            initialContentAlignment: go.Spot.Center, // center the content
            "undoManager.isEnabled": true // enable undo & redo
        });

    myDiagram.nodeTemplate =
        GO(go.Node, "Vertical", // second argument of a Node/Panel can be a Panel type
            { /* set Node properties here */ },
            // example Node binding sets Node.location to the value of Node.data.loc
            new go.Binding("location", "loc"),

            // GraphObjects contained within the Node
            // this Shape will be vertically above the TextBlock
            GO(go.Shape,
                "RoundedRectangle", // string argument can name a predefined figure
                { width: 50, height: 50, fill: null },
                // example Shape binding sets Shape.figure to the value of Node.data.fig
                new go.Binding("figure", "fig")),

            GO(go.TextBlock,
                "default text", // string argument can be initial text string
                { /* set TextBlock properties here */ },
                // example TextBlock binding sets TextBlock.text to the value of Node.data.key
                new go.Binding("text", "key"))
        );

    var myModel = GO(go.TreeModel);
    // in the model data, each node is represented by a JavaScript object:
    // myModel.nodeDataArray = [
    //     { key: "*.auctionzip.com" },
    //     { key: "NGINX", parent: "*.auctionzip.com" },
    //     { key: "www.auctionzip.com", parent: "NGINX" },
    //     { key: "bweb:3001", parent: "NGINX" },
    //     { key: "bweb:8000", parent: "NGINX" },
    //     { key: "bsvz-az", parent: "NGINX" }
    // ];

    myModel.nodeDataArray = dataArray

    myDiagram.model = myModel;

    myDiagram.layout =
        GO(go.TreeLayout, { angle: 90, layerSpacing: 35 });

    // define a Link template that routes orthogonally, with no arrowhead
    myDiagram.linkTemplate =
        GO(go.Link,
            // default routing is go.Link.Normal
            // default corner is 0
            { routing: go.Link.Orthogonal, corner: 5 },
            GO(go.Shape, { strokeWidth: 3, stroke: "#555" }), // the link shape

            // if we wanted an arrowhead we would also add another Shape with toArrow defined:
            GO(go.Shape, { toArrow: "Standard", stroke: null })
        );
}

function main() {
    const SERVER_URL = "ws://159.203.171.13:8080";
    const PROTOCOL = "heroesoftheswarm";
    ws = initialize_websocket(SERVER_URL, PROTOCOL);
    ctx = initialize_canvas();
    draw_circle(ctx);
}

function initialize_canvas() {
	// Get the canvas
	var ctx = document.getElementById("game_canvas").getContext("2d");
	// Set up the context
	ctx.globalCompositeOperation = 'destination-over';
	return ctx;
}

function draw_circle(ctx) {
    ctx.clearRect(0, 0, game_canvas.width, game_canvas.height); // clear canvas
	var centerX = game_canvas.width / 2;
	var centerY = game_canvas.height / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
}

function initialize_websocket(url, protocol) {
    // Initialize the websocket
    var ws = new WebSocket(url, protocol);
    // This is run when the server sends us something. It should handle all the different types of messages
    ws.onmessage = function (event) {
        console.log(event.data);
    }
    // This is run when something fscks up
    ws.onerror= function (event) {
        console.log(event.data);
    }
    return ws;
}

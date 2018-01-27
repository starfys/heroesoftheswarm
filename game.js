const SERVER_URL = "ws://159.203.171.13:8080";
const PROTOCOL = "heroesoftheswarm";
const FPS = 30;
const PINGS_PER_FRAME = 1;
var GLOBAL_STATE_NO_TOUCH;

function main() {
    var ws = initializeWebSocket(SERVER_URL, PROTOCOL, function(event) {GLOBAL_STATE_NO_TOUCH = event.data;});
    setTimeout(pingServer, 500, ws);
    var ctx = initializeCanvas();
    drawCircle(ctx);
}

function initializeCanvas() {
	// Get the canvas
	var ctx = document.getElementById("game_canvas").getContext("2d");
	// Set up the context
	ctx.globalCompositeOperation = 'destination-over';
	return ctx;
}

function drawCircle(ctx) {
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

function initializeWebSocket(url, protocol, onmessage) {
    // Initialize the websocket
    var ws = new WebSocket(url, protocol);
    // This is run when the server sends us something. It should handle all the different types of messages
    ws.onmessage = onmessage;
    // This is run when something fscks up
    ws.onerror = function (event) {
        console.log(event.data);
    }
    return ws;
}

function pingServer(ws) {
    ws.send("U");
    setTimeout(pingServer, 1000 / FPS / PINGS_PER_FRAME, ws);
}

function getState() {
    return GLOBAL_STATE_NO_TOUCH;
}

function vec2(x, y) {
    this.x = x;
    this.y = y;
    this.magn = function() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
}

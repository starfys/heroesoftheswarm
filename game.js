const SERVER_URL = "ws://159.203.171.13:8080";
const PROTOCOL = "heroesoftheswarm";
const FPS = 30;
const PINGS_PER_FRAME = 1;
var GLOBAL_STATE_NO_TOUCH;
var GLOBAL_ID_NO_TOUCH;
const PING_MODE = 'U';

function init() {
    var ws = initializeWebSocket(SERVER_URL, PROTOCOL, function(event) {
        data = JSON.parse(JSON.parse(JSON.stringify(event.data)));
        type = data.mt;
        switch(type) {
            case 'c':
                GLOBAL_ID_NO_TOUCH = data.message.config.player_id; break;
            case 'w':
                GLOBAL_STATE_NO_TOUCH = data.message.world; break;
                console.log(GLOBAL_STATE_NO_TOUCH);
        }
    });
    var ctx = initializeCanvas();
    setTimeout(pingServer, 1000, ws, ctx);
    setTimeout(_loop, 1500, ctx, 1000 / FPS, 0);
    $("#upload-button").on('click', function(event) {
        ws.send(JSON.stringify({program: $("#code").val()}));
        console.log("program sent!");
    });
}

function frame(ctx, dt, frameN) {
    mapSize = new vec2(1600, 900);
    screenSize = new vec2(ctx.canvas.width, ctx.canvas.height);
    state = getState();
    viewport = getViewport(ctx);
    ctx.clearRect(0, 0, screenSize.x, screenSize.y);
    $.each(state.swarms, function(id, swarm) {
        red = swarm.color[0]; green = swarm.color[1]; blue = swarm.color[2];
        color = '#' + ((red << 16) | (green << 8) | blue).toString(16);
        swarm_pos = new vec2(swarm.x, swarm.y);
        $.each(swarm.members, function(i, particle) {
            pos = swarm_pos.add(new vec2(particle.x, particle.y));
            absolute_pos = pos.sub(viewport[0]);
            drawParticle(ctx, absolute_pos, 5, color, 'black', 2, swarm.direction);
        });
    });
}

function initializeCanvas() {
	// Get the canvas
	var ctx = document.getElementById("game_canvas").getContext("2d");
	// Set up the context
	ctx.globalCompositeOperation = 'destination-over';
	return ctx;
}

function drawParticle(ctx, pos, radius, fillColor, borderColor, borderWidth, dir) {
    dir = d2r(dir);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2*Math.PI, false);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    ctx.beginPath();
    var pos2 = pos.add(new vec2(radius*Math.cos(dir), -radius*Math.sin(dir)));
    ctx.arc(pos2.x, pos2.y, radius*.5, 0, 2*Math.PI, false);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
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

function pingServer(ws, ctx) {
    if (PING_MODE == 'U') {
        ws.send("U");
    } else if (PING_MODE == 'viewport') {
        viewport = getViewport(ctx);
        obj = {viewport: [viewport[0].coords(), viewport[1].coords()]};
        ws.send(JSON.stringify(obj));
    }
    setTimeout(pingServer, 1000 / FPS / PINGS_PER_FRAME, ws, ctx);
}

function getState() {
    return GLOBAL_STATE_NO_TOUCH;
}

function getID() {
    return GLOBAL_ID_NO_TOUCH;
}

function getViewport(ctx) {
    state = getState();
    id = getID();
    swarm = state.swarms[id]
    center = new vec2(swarm.x, swarm.y);
    screenSize = new vec2(ctx.canvas.width, ctx.canvas.height);
    topLeft = center.sub(screenSize.times(.5));
    bottomRight = center.add(screenSize.times(.5));
    return [topLeft, bottomRight];
}

function vec2(x, y) {
    this.x = x;
    this.y = y;
    this.add = function(rhs) {
        return new vec2(this.x+rhs.x,this.y+rhs.y);
    };
    this.sub = function(rhs) {
        return new vec2(this.x-rhs.x,this.y-rhs.y);
    };
    this.addX = function(rhs) {
        return new vec2(this.x+rhs, this.y);
    };
    this.addY = function(rhs) {
        return new vec2(this.x, this.y+addY);
    };
    this.magn = function() {
        return Math.sqrt(Math.pow(this.x, 2)+Math.pow(this.y, 2));
    };
    this.dir = function() {
        return new vec2(this.x / this.magn(), this.y / this.magn());
    };
    this.times = function(rhs) {
        return new vec2(this.x * rhs, this.y * rhs);
    };
    this.coords = function() {
        return { x: this.x, y: this.y };
    };
}

function _loop(ctx, dt, frameN) {
    frameN++;
    var before = performance.now();
    frame(ctx, dt, frameN);
    var frameT = performance.now() - before;
    dt = (1000 / FPS) - frameT;
    setTimeout(_loop, dt, ctx, dt, frameN);
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function d2r(deg) {
    return deg * Math.PI / 180;
}

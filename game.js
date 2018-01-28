const SERVER_URL = "ws://159.203.171.13:8080";
const PROTOCOL = "heroesoftheswarm";
const FPS = 30;
const PINGS_PER_FRAME = 1;
var GLOBAL_STATE_NO_TOUCH;
var GLOBAL_ID_NO_TOUCH;
const SEND_VIEWPORT_P = true;

function init() {
    var ws = initializeWebSocket(SERVER_URL, PROTOCOL, function(event) {
        data = JSON.parse(JSON.parse(JSON.stringify(event.data)));
        type = data.mt;
        switch(type) {
            case 'c':
                GLOBAL_ID_NO_TOUCH = data.message.config.player_id; break;
            case 'w':
                GLOBAL_STATE_NO_TOUCH = data.message.world; break;
        }
    });
    var ctx = initializeCanvas();
    setTimeout(pingServer, 1000, ws, ctx);
    setTimeout(_loop, 2000, ctx, 1000 / FPS, 0);
    $("#upload-button").on('click', function(event) {
        ws.send(JSON.stringify({program: $("#code").val()}));
    });
}

function frame(ctx, dt, frameN) {
    mapSize = new vec2(1600, 900);
    screenSize = new vec2(ctx.canvas.width, ctx.canvas.height);
    state = getState();
    viewport = getViewport(ctx);
    ctx.clearRect(0, 0, screenSize.x, screenSize.y);
    $.each(state.swarms, function(id, swarm) {
        color = ints2HexColor(swarm.color);
        swarm_pos = new vec2(swarm.x, swarm.y);
        $.each(swarm.members, function(i, particle) {
            console.log(particle);
            if (particle !== null) {
                pos = swarm_pos.add(new vec2(particle.x, particle.y));
                drawParticle(ctx, pos.sub(viewport[0]), 5, color, 'white', 2, particle.direction);
            }
        });
    });

    $.each(state.bullets, function(i, bullet) {
        owner = state.swarms[bullet.owner];
        if (owner !== undefined) {
            color = ints2HexColor(state.swarms[bullet.owner].color);
        } else {
            color = 'white';
        }
        pos = new vec2(bullet.x, bullet.y);
        drawBullet(ctx, pos.sub(viewport[0]), 10, color, 'white', bullet.direction);
    })

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, screenSize.x, screenSize.y);
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
    var pos2 = pos.add(new vec2(Math.cos(dir), -Math.sin(dir)).times(radius));
    ctx.arc(pos2.x, pos2.y, radius*.5, 0, 2*Math.PI, false);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
}

function drawBullet(ctx, pos, length, playerColor, borderColor, dir) {
    dir = d2r(dir);
    var pos2 = pos.add(new vec2(Math.cos(dir), -Math.sin(dir)).times(length));

    ctx.beginPath();
    ctx.strokeStyle = borderColor;
    ctx.moveTo(pos.x, pos.y-1);
    ctx.lineTo(pos2.x, pos2.y-1);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = playerColor;
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos2.x, pos2.y);

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

function initializeCanvas() {
	// Get the canvas
	var ctx = document.getElementById("game_canvas").getContext("2d");
	// Set up the context
	ctx.globalCompositeOperation = 'destination-over';
	return ctx;
}

function pingServer(ws, ctx) {
    if (SEND_VIEWPORT_P) {
        viewport = getViewport(ctx);
        obj = [viewport[0].coords(), viewport[1].coords()];
        ws.send(JSON.stringify(obj));
    } else {
        ws.send('U');
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
    screenSize = new vec2(ctx.canvas.width, ctx.canvas.height);
    if (state === undefined) {
        return [new vec2(0,0), screenSize];
    }
    id = getID();
    swarm = state.swarms[id];
    center = new vec2(swarm.x, swarm.y);
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
    dt = (1000 / FPS) - frameT - 20;
    setTimeout(_loop, dt, ctx, dt, frameN);
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function d2r(deg) {
    return deg * Math.PI / 180;
}

// Takes an array of 3 ints: [red, green, blue] (each 0-255)
function ints2HexColor(arr) {
    return '#' + ((arr[0] << 16) | (arr[1] << 8) | arr[2]).toString(16);
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

const SERVER_URL = "ws://159.203.171.13:8080";
const PROTOCOL = "heroesoftheswarm";
const FPS = 60;
const PING_RATE = 30;
const SEND_VIEWPORT_P = true;
const MAP_SIZE = new vec2(1600, 900);
const XP_LEVEL = 300;

// ESR forgive me, for I have sinned
var GLOBAL_STATE_NO_TOUCH;
var GLOBAL_CONFIG_NO_TOUCH;
var BACKGROUND;

function init() {
    var foo = 0;
    var ws = initializeWebSocket(SERVER_URL, PROTOCOL, function(event) {
        data = JSON.parse(JSON.parse(JSON.stringify(event.data)));
        type = data.mt;
        switch(type) {
            case 'i':
                GLOBAL_CONFIG_NO_TOUCH = data.message.config; break;
            case 'w':
                GLOBAL_STATE_NO_TOUCH = data.message.world; break;
            case 'c':
                updateEditor(data.message.compile);
                break;
        }
    });
    var ctx = initializeCanvas();
    BACKGROUND = initializeBackground();
    setTimeout(pingServer, 1000, ws, ctx);

    setTimeout(_loop, 1500, ctx, 1000 / FPS, 0);

    $("#upload-button").on('click', function(event) {
        ws.send(JSON.stringify({program: $("#code").val()}));
    });
    $(document).ready(function(){
        $('[data-toggle="popover"]').popover();
    });
}

function frame(ctx, dt, frameN) {
    screenSize = new vec2(ctx.canvas.width, ctx.canvas.height);
    state = getState();
    viewport = getViewport(ctx);
    ctx.clearRect(0, 0, screenSize.x, screenSize.y);
    if (checkDeath()) {
        drawDeathText(ctx);
        $("#respawn").removeClass("invisible").addClass("visible");
    }
    $.each(state.swarms, function(id, swarm) {
        color = ints2HexColor(swarm.color);
        swarm_pos = new vec2(swarm.x, swarm.y);
        $.each(swarm.members, function(i, particle) {
            pos = swarm_pos.add(new vec2(particle.x, particle.y));
            drawParticle(ctx, pos.sub(viewport[0]), 7, color, healthColor(particle.health), 5, particle.direction);
        })

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


    x = state.swarms[getID()].x
    y = state.swarms[getID()].y
    ctx.drawImage(
        BACKGROUND,
        viewport[0].x, viewport[0].y,
        screenSize.x, screenSize.y,
        0, 0,
        screenSize.x, screenSize.y
    );

    xp = state.swarms[getID()].experience
    $("#xp").html(xp.toString() + ' XP');
    $("#lvl").html("(<strong>" + (XP_LEVEL - (xp % 300)) + "</strong> to next particle)");
    updateLeaderboard();
}

function drawParticle(ctx, pos, radius, fillColor, borderColor, borderWidth, dir) {
    dir = d2r(dir);
    ctx.beginPath();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.arc(pos.x, pos.y, radius, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.stroke();
    ctx.closePath()

    ctx.beginPath();
    var pos2 = pos.add(new vec2(Math.cos(dir), -Math.sin(dir)).times(radius));
    ctx.arc(pos2.x, pos2.y, radius*.5, 0, 2*Math.PI, false);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.fill();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    ctx.closePath();
}

function drawBullet(ctx, pos, length, playerColor, borderColor, dir) {
    dir = d2r(dir);
    var pos2 = pos.add(new vec2(Math.cos(dir), -Math.sin(dir)).times(length));
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.strokeStyle = borderColor;
    ctx.moveTo(pos.x, pos.y-1);
    ctx.lineTo(pos2.x, pos2.y-1);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = playerColor;
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos2.x, pos2.y);
    ctx.stroke();
    ctx.closePath();
}

function drawGrid(ctx, screenSize, spacing, color) {
    var x; var y;
    w = screenSize.x; h = screenSize.y;
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (x = 0; x <= w; x += spacing) {
        for (y = 0; y <= h; y += spacing) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }
    ctx.closePath();
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

function drawDeathText(ctx) {
    ctx.fillStyle = 'white';
    ctx.font = '50px monospace';
    ctx.fillText("YOU DIED", screenSize.x / 2 - 115, screenSize.y / 2);
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

function initializeBackground() {
    var img = new Image();
    img.src = "background2.png";
    return img;
}

// Hey look modern web design
function updateEditor(message) {
    btn = $("#compile-report");
    if (message.success) {
        console.log("success");
        btn.removeClass("btn-danger")
           .addClass("btn-success")
           .html("<strong>Compilation was successful</strong>")
           .attr('data-content', "");
    } else {
        console.log("failure");
        btn.removeClass("btn-success")
           .addClass("btn-danger")
           .html("<strong>Compilation failed (hover)</strong>")
           .attr('data-content', message.error);
    }
}

function updateLeaderboard() {
    leaderboard = getState().leaderboard;
    for (var i = 0; i < 3; i++) {
        ctx = document.getElementById("leaderboardC"+i.toString()).getContext('2d');
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = ints2HexColor(leaderboard[i][0])
        ctx.fillRect(0, 0, 25, 25);
        $("#leaderboardS"+i.toString()).html(leaderboard[i][1].toString());
    }
}

function pingServer(ws, ctx) {
    if (SEND_VIEWPORT_P) {
        viewport = getViewport(ctx);
        obj = [viewport[0].coords(), viewport[1].coords()];
        ws.send(JSON.stringify(obj));
    } else {
        ws.send('U');
    }

    setTimeout(pingServer, 1000 / PING_RATE, ws, ctx);
}

function getState() {
    return GLOBAL_STATE_NO_TOUCH;
}

function getID() {
    return GLOBAL_CONFIG_NO_TOUCH.player_id;
}

function getMaxHealth() {
    // return GLOBAL_CONFIG_NO_TOUCH.max_health;
    return 5; // P
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
    if (topLeft.x < 0) {
        topLeft.x = 0;
    }
    if (topLeft.y < 0) {
        topLeft.y = 0;
    }
    bottomRight = topLeft.add(screenSize);
    if (bottomRight.x > MAP_SIZE.x) {
        bottomRight.x = MAP_SIZE.x;
        topLeft.x = MAP_SIZE.x - screenSize.x;
    }
    if (bottomRight.y > screenSize.y) {
        bottomRight.y = screenSize.y;
        topLeft.y = MAP_SIZE.y - screenSize.y;
    }
    return [topLeft, bottomRight];
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

function checkDeath() {
    return getState().swarms[getID()].members.length == 0
}

// Takes an array of 3 ints: [red, green, blue] (each 0-255)
function ints2HexColor(arr) {

    return '#' + ((arr[0] << 16) | (arr[1] << 8) | arr[2]).toString(16).padStart(6, '0');
}

function healthColor(health) {
    g = health / getMaxHealth() * 255;
    r = 255 - g;
    b = 0;
    return ints2HexColor([r, g, b]);

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

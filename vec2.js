function vec2(x, y) {
    if (y === undefined) {
        this.x = x.x;
        this.y = x.y;
    } else {
        this.x = x;
        this.y = y;
    }
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

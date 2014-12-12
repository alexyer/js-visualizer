function Polygon(sides, x, y, tileSize, ctx, num, rotation, tiles, audioSource) {
    this.sides = sides;
    this.tileSize = tileSize;
    this.ctx = ctx;
    this.num = num;
    this.high = 0;
    this.decay = this.num > 42 ? 1.5 : 2;
    this.highlight = 0;
    this.rotation = rotation;
    this.audioSource = audioSource;
    this.tiles = tiles;

    var step = Math.round(Math.cos(Math.PI/6) * tileSize * 2);
    this.y = Math.round(step * Math.sin(Math.PI/3) * -y);
    this.x = Math.round(x * step + y * step / 2);

    this.vertices = [];
    for (var i = 1; i <= this.sides; i++) {
        x = this.x + this.tileSize * Math.cos(i * 2 * Math.PI / this.sides + Math.PI / 6);
        y = this.y + this.tileSize * Math.sin(i * 2 * Math.PI / this.sides + Math.PI / 6);
        this.vertices.push([x, y]);
    };
}

Polygon.prototype.rotateVertices = function (visualizer) {
    visualizer.fgRotation -= this.audioSource.volume > 100000 ? Math.sin(this.audioSource.volume / 800000) : 0;
    this.rotation = visualizer.fgRotation;
    for (var i = 0; i <= this.sides - 1; i++) {
        this.vertices[i][0] = this.vertices[i][0] - this.vertices[i][1] * Math.sin(this.rotation);
        this.vertices[i][1] = this.vertices[i][1] + this.vertices[i][0] * Math.sin(this.rotation);
    };
}

Polygon.prototype.calculateOffset = function (coords) {
    var angle = Math.atan(coords[1]/coords[0]);
    var distance = Math.sqrt(Math.pow(coords[0], 2) + Math.pow(coords[1], 2));
    var mentalFactor = Math.min(Math.max((Math.tan(this.audioSource.volume / 6000) * 0.5), -20), 2);

    var offsetFactor = Math.pow(distance / 3, 2) * (this.audioSource.volume / 2000000) * (Math.pow(this.high, 1.3) / 300)* mentalFactor;
    var offsetX = Math.cos(angle) * offsetFactor;
    var offsetY = Math.sin(angle) * offsetFactor;

    offsetX *= (coords[0] < 0) ? -1 : 1;
    offsetY *= (coords[0] < 0) ? -1 : 1;

    return [offsetX, offsetY];
}

Polygon.prototype.drawPolygon = function () {
    var freqs = new Uint8Array(this.audioSource.frequencyBinCount);
    this.audioSource.getByteFrequencyData(freqs);

    var bucket = Math.ceil(this.audioSource.frequencyBinCount / this.tiles.length * this.num);
    var val = Math.pow((freqs[bucket] / 255), 2) * 255;
    val *= this.num > 42 ? 1.1 : 1;

    if (val > this.high) {
        this.high = val;
    } else {
        this.high -= this.decay;
        val = this.high;
    }

    var r, g, b, a;
    if (val > 0) {
        this.ctx.beginPath();
        var offset = this.calculateOffset(this.vertices[0]);
        this.ctx.moveTo(this.vertices[0][0] + offset[0], this.vertices[0][1] + offset[1]);
        for (var i = 1; i <= this.sides - 1; i++) {
            offset = this.calculateOffset(this.vertices[i]);
            this.ctx.lineTo(this.vertices[i][0] + offset[0], this.vertices[i][1] + offset[1]);
        };
        this.ctx.closePath();

        if (val > 128) {
            r = (val - 128) * 2;
            g = (Math.cos((2 * val / 128 * Math.PI / 2) - 4 * Math.PI / 3) + 1) * 128;
            b = (val - 105) * 3;
        } else if (val > 175) {
            r = (val - 128) * 2;
            g = 255;
            b = (val - 105) * 3;
        } else {
            r = (Math.cos((2 * val / 128 * Math.PI / 2)) + 1) * 128;
            g = (Math.cos((2 * val / 128 * Math.PI / 2) - 4 * Math.PI / 3) + 1) * 128;
            b = (Math.cos((2.4 * val / 128 * Math.PI / 2) - 2 * Math.PI / 3) + 1) * 128;
        }

        if (val > 210) {
            this.cubbed = val;
        }

        if (val > 120) {
            this.highlight = 100;
        }

        var e = 2.7182;
        a = (0.5 / (1 + 40 * Math.pow(e, -val / 8))) + (0.5 / (1 + 40 * Math.pow(e, -val / 20)));

        this.ctx.fillStyle = 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', ' + a + ')';
        this.ctx.fill();

        if (val > 20) {
            var strokeVal = 20;
            this.ctx.strokeStyle = 'rgba(' + strokeVal + ', ' + strokeVal + ', ' + strokeVal + ', 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
};

Polygon.prototype.drawHighlight = function () {
    this.ctx.beginPath();
    var offset = this.calculateOffset(this.vertices[0]);
    this.ctx.moveTo(this.vertices[0][0] + offset[0], this.vertices[0][1] + offset[1]);
    for (var i = 0; i <= this.sides - 1; i++) {
        offset = this.calculateOffset(this.vertices[i]);
        this.ctx.lineTo(this.vertices[i][0] + offset[0], this.vertices[i][1] + offset[1]);
    };
    this.ctx.closePath();
    var a = this.highlight / 100;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + a + ')';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.highlight -= 0.5;
}

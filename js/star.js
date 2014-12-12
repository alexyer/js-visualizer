function Star(x, y, startSize, ctx, canvas, audioSource) {
    this.x = x;
    this.y = y;
    this.starSize = startSize;
    this.angle = Math.atan(Math.abs(y) / Math.abs(x));
    this.ctx = ctx;
    this.canvas = canvas;
    this.audioSource = audioSource;
    this.high = 0;
}

Star.prototype.updateCanvas = function (canvas) {
    this.canvas = canvas;
}

Star.prototype.drawStar = function () {
    var distanceFromCenter = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));

    var brightness = 200 + Math.min(Math.round(this.high * 5), 55);
    this.ctx.lineWidth = 0.5 + distanceFromCenter / 2000 * Math.max(this.starSize / 2, 1);
    this.ctx.strokeStyle = 'rgba(' + brightness + ', ' + brightness + ', ' + brightness + ', 1)';
    this.ctx.beginPath();
    this.ctx.moveTo(this.x, this.y);
    var lengthFactor = 1 + Math.min(Math.pow(distanceFromCenter, 2) / 30000 * Math.pow(this.audioSource.volume, 2) / 60000, distanceFromCenter);
    var toX = Math.cos(this.angle) * -lengthFactor;
    var toY = Math.sin(this.angle) * -lengthFactor;
    toX *= this.x > 0 ? 1 : -1;
    toY *= this.y > 0 ? 1 : -1;
    this.ctx.lineTo(this.x + toX, this.y + toY);
    this.ctx.stroke();
    this.ctx.closePath();

    var speed = lengthFactor / 20 * this.starSize;
    this.high -= Math.max(this.high - 0.0001, 0);

    if (speed > this.high) {
        this.high = speed;
    }

    var dX = Math.cos(this.angle) * this.high;
    var dY = Math.sin(this.angle) * this.high;
    this.x += this.x > 0 ? dX : -dX;
    this.y += this.y > 0 ? dY : -dY;

    var limitY = this.canvas.height / 2 + 500;
    var limitX = this.canvas.width / 2 + 500;

    if ((this.y > limitY || this.y < -limitY) || (this.x > limitX || this.x < -limitX)) {
        this.x = (Math.random() - 0.5) * this.canvas.width / 3;
        this.y = (Math.random() - 0.5) * this.canvas.height / 3;
        this.angle = Math.atan(Math.abs(this.y) / Math.abs(this.x));
    }
}

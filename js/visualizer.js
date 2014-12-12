var Visualizer = function(container) {
    this.audioBufferSourceNode;
    this.audioContext;
    this.analyser;
    this.bgCanvas;
    this.bgCtx;
    this.container = container;
    this.fgCanvas;
    this.fgCtx;
    this.fgRotation = 0.001;
    this.file;
    this.fileName;
    this.freqs;
    this.sfCanvas;
    this.sfCtx;
    this.status = 0;
    this.stars;
    this.source;
    this.tiles;
    this.tileSize;
};

Visualizer.prototype.initBgCanvas = function() {
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.bgCanvas.setAttribute('style', 'position: absolute; z-index: 1');
    this.container.appendChild(this.bgCanvas);
};

Visualizer.prototype.initSfCanvas = function() {
    this.sfCanvas = document.createElement('canvas');
    this.sfCtx = this.sfCanvas.getContext('2d');
    this.sfCanvas.setAttribute('style', 'position: absolute; z-index: 5');
    this.container.appendChild(this.sfCanvas);
};

Visualizer.prototype.initFgCanvas = function() {
    this.fgCanvas = document.createElement('canvas');
    this.fgCtx = this.fgCanvas.getContext('2d');
    this.fgCanvas.setAttribute('style', 'position: absolute; z-index: 10');
    this.container.appendChild(this.fgCanvas);
};

Visualizer.prototype.init = function() {
    var self = this;

    var resize = function() {
        self.bgCanvas.width = window.innerWidth;
        self.bgCanvas.height = window.innerHeight;

        self.sfCanvas.width = window.innerWidth;
        self.sfCanvas.height = window.innerHeight;
        self.sfCtx.translate(self.sfCanvas.width / 2, self.sfCanvas.height / 2);

        self.fgCanvas.width = window.innerWidth;
        self.fgCanvas.height = window.innerHeight;
        self.fgCtx.translate(self.fgCanvas.width / 2, self.fgCanvas.height / 2);
        self.tileSize = self.fgCanvas.width > self.fgCanvas.height ? self.fgCanvas.width / 40 : self.fgCanvas.height / 40;
        self.makePolygonArray();
    };

    this.initAudioAPI();
    this.initDrop();
    this.initBgCanvas();
    this.initFgCanvas();
    this.initSfCanvas();
    resize();
    window.addEventListener('resize', this.resize, false);
};

Visualizer.prototype.initAudioAPI = function() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
};

Visualizer.prototype.initDrop = function() {
    var dropContainer = this.container;
    var self = this;

    dropContainer.addEventListener('dragover', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }, false);

    dropContainer.addEventListener('drop', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        self.file = evt.dataTransfer.files[0];
        self.fileName = self.file.name;
        self.start();
    });
};

Visualizer.prototype.start = function() {
    var self = this;
    var file = this.file;
    var reader = new FileReader();

    reader.onload = function(evt) {
        var fileResult = evt.target.result;
        var audioContext = self.audioContext;

        if (audioContext == null) {
            return;
        };

        self.updateInfo('Decoding the audio');
        audioContext.decodeAudioData(fileResult, function(buffer) {
            self.updateInfo('Decoded successfully, starting the Visualizer');
            self.visualize(buffer);
        }, function(e) {
            self.updateInfo('Failed to decode the file');
            console.log(e);
        });
    };

    reader.onerror = function(e) {
        self.updateInfo('Failed to read the file');
        console.log(e);
    };

    this.updateInfo('Start reading the file');
    reader.readAsArrayBuffer(file);
};

Visualizer.prototype.visualize = function(buffer) {
    var self = this;
    if (this.audioBufferSourceNode) {
        this.audioBufferSourceNode.stop(0);
    };

    this.audioBufferSourceNode = self.audioContext.createBufferSource();
    this.analyser = self.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    this.audioBufferSourceNode.connect(this.analyser);
    this.analyser.connect(self.audioContext.destination);
    this.audioBufferSourceNode.buffer = buffer;

    if (!this.audioBufferSourceNode.start) {
        this.audioBufferSourceNode.start = this.audioBufferSourceNode.noteOn;
        this.audioBufferSourceNode.stop = this.audioBufferSourceNode.noteOff;
    };

    this.audioBufferSourceNode.start(0);
    this.updateInfo('Now playing: ' + this.fileName);
    this.status = 1;
    this.audioBufferSourceNode.onended = function() {
        self.audioEnd(self);
    };

    this.startVisualization();
};

Visualizer.prototype.drawBg = function() {
    this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    var r, g, b, a;
    var val = this.analyser.volume / 1000;
    r = 200 + (Math.sin(val) + 1) * 28;
    g = val * 4;
    b = val * 8;
    a = Math.sin(val + 3 * Math.PI / 2) + 1;

    this.bgCtx.beginPath();
    this.bgCtx.rect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    var grd = this.bgCtx.createRadialGradient(this.bgCanvas.width/2, this.bgCanvas.height/2, val,
                                              this.bgCanvas.width/2, this.bgCanvas.height/2,
                                              this.bgCanvas.width - Math.min(Math.pow(val, 2.7), this.bgCanvas.width - 20));
    grd.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grd.addColorStop(0.8, 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', 0.4)');
    
    this.bgCtx.fillStyle = grd;
    this.bgCtx.fill();
};

Visualizer.prototype.drawStars = function() {
    this.sfCtx.save();
    this.sfCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.sfCtx.clearRect(0, 0, this.sfCanvas.width, this.sfCanvas.height);
    this.sfCtx.restore();

    this.stars.forEach(function(star) {
        star.drawStar();
    });
};

Visualizer.prototype.drawTiles = function() {
    this.fgCtx.save();
    this.fgCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
    this.fgCtx.restore();

    this.tiles.forEach(function(tile) {
        tile.drawPolygon();
        tile.drawHighlight();
    });
};

Visualizer.prototype.makeStarArray = function () {
    var x, y, starSize;
    this.stars = [];
    var limit = this.sfCanvas.width / 15;
    for (var i = 0; i < limit; i++) {
        x = (Math.random()- 0.5) * this.sfCanvas.width;
        y = (Math.random()- 0.5) * this.sfCanvas.height;
        starSize = (Math.random() + 0.1) * 3;
        this.stars.push(new Star(x, y, starSize, this.sfCtx, this.sfCanvas, this.analyser));
    };
};

Visualizer.prototype.makePolygonArray = function () {
    this.tiles = [];

    var i = 0;
    this.tiles.push(new Polygon(6, 0, 0, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
    i++;
    for (var layer = 1; layer < 7; layer++) {
        this.tiles.push(new Polygon(6, 0, layer, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
        i++;
        this.tiles.push(new Polygon(6, 0, -layer, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
        i++;
        for (var x = 1; x < layer; x++) {
            this.tiles.push(new Polygon(6, x, -layer, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
            i++;
            this.tiles.push(new Polygon(6, -x, layer, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
            i++;
            this.tiles.push(new Polygon(6, x, layer-x, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
            i++;
            this.tiles.push(new Polygon(6, -x, -layer+x, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
            i++;
        };
        for (var y = -layer; y <= 0; y++) {
            this.tiles.push(new Polygon(6, layer, y, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
            i++;
            this.tiles.push(new Polygon(6, -layer, -y, this.tileSize, this.fgCtx, i, this.fgRotation, this.tiles, this.analyser));
            i++;
        };
    };
};

Visualizer.prototype.startVisualization = function() {
    var self = this;
    self.freqs = new Uint8Array(self.analyser.frequencyBinCount);
    self.analyser.volume = 0;

    var draw = function() {
        self.analyser.getByteFrequencyData(self.freqs);

        var total = 0;
        for (var i = 0; i < self.analyser.frequencyBinCount; i++) {
            total += self.freqs[i];
        };
        self.analyser.volume = total;

        self.drawBg();
        self.drawStars();
        self.drawTiles();
        self.rotateForeground();
        requestAnimationFrame(draw);
    };
    self.makePolygonArray();
    self.makeStarArray();
    draw();
};

Visualizer.prototype.rotateForeground = function () {
    var self = this;
    this.tiles.forEach(function (tile) {
        tile.rotateVertices(self);
    });
}

Visualizer.prototype.audioEnd = function(instance) {
    if (this.forceStop) {
        this.forceStop = false;
        this.status = 1;
        return;
    };
    this.status = 0;
    var txt = 'Audio Visualizer';
    document.getElementsById('info').innerHTML = txt;
}

Visualizer.prototype.updateInfo = function(text) {
    document.getElementById('info').innerHTML = text;
};

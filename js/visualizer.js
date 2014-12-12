var Visualizer = function(container) {
    this.audioContext;
    this.analyser;
    this.bgCanvas;
    this.bgCtx;
    this.container = container;
    this.file;
    this.fileName;
    this.freqs;
    this.sfCanvas;
    this.sfCtx;
    this.status = 0;
    this.stars;
    this.source;
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

Visualizer.prototype.init = function() {
    var self = this;

    var resize = function() {
        self.bgCanvas.width = window.innerWidth;
        self.bgCanvas.height = window.innerHeight;

        self.sfCanvas.width = window.innerWidth;
        self.sfCanvas.height = window.innerHeight;
        self.sfCtx.translate(self.sfCanvas.width / 2, self.sfCanvas.height / 2);
    };

    this.initAudioAPI();
    this.initDrop();
    this.initBgCanvas();
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
    var audioBufferSourceNode = self.audioContext.createBufferSource();
    this.analyser = self.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    audioBufferSourceNode.connect(this.analyser);
    this.analyser.connect(self.audioContext.destination);
    audioBufferSourceNode.buffer = buffer;

    if (!audioBufferSourceNode.start) {
        audioBufferSourceNode.start = audioBufferSourceNode.noteOn;
        audioBufferSourceNode.stop = audioBufferSourceNode.noteOff;
    };

    audioBufferSourceNode.start(0);
    this.status = 1;
    audioBufferSourceNode.onended = function() {
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

Visualizer.prototype.startVisualization = function() {
    var self = this;
    self.freqs = new Uint8Array(self.analyser.frequencyBinCount);

    var draw = function() {
        self.analyser.getByteFrequencyData(self.freqs);

        var total = 0;
        for (var i = 0; i < self.analyser.frequencyBinCount; i++) {
            total += self.freqs[i];
        };
        self.analyser.volume = total;

        self.drawBg();
        self.drawStars();
        requestAnimationFrame(draw);
    };
    self.makeStarArray();
    draw();
};

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

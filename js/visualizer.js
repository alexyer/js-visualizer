var Visualizer = function(canvas) {
    this.audioContext;
    this.analyser;
    this.canvas = canvas;
    this.file;
    this.fileName;
    this.status = 0;
    this.source;
};

Visualizer.prototype.resize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

Visualizer.prototype.init = function() {
    this.resize();
    this.initAudioAPI();
    this.initDrop();
    window.addEventListener('resize', this.resize, false);
};

Visualizer.prototype.initAudioAPI = function() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
};

Visualizer.prototype.initDrop = function() {
    var dropContainer = this.canvas;
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

Visualizer.prototype.startVisualization = function() {
    var self = this;
    var draw = function() {
        var freqs = new Uint8Array(self.analyser.frequencyBinCount);
        self.analyser.getByteFrequencyData(freqs);
        console.log(freqs);
        requestAnimationFrame(draw);
    };
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

var toggleControlPanel = function() {
    var panel = document.getElementById('control-panel');

    if (panel.className.indexOf('hidden') == 0) {
        panel.className = '';
    } else {
        panel.className = 'hidden';
    };
};

window.onload = function() {
    var visualizer = new Visualizer(document.getElementById('visualizer'));
    visualizer.init();

    document.getElementById('toggleButton').addEventListener('click', function(evt) {
        evt.preventDefault();
        toggleControlPanel();
    });
};

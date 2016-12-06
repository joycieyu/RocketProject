import React, { Component } from 'react';

(function () {
    var script = document.currentScript,
        codecs = {
            preview_url: 'audio/mpeg'
        },
        resize = (function () {
            var resized = false,
                callbacks = [],
                timeout;

            function tick() {
                if(resized) {
                    callbacks.forEach(function (callback) {
                        callback();
                    });
                }

                resized = false;
                timeout = setTimeout(tick, 10);
            }

            window.addEventListener('resize', function () {
                resized = true;
            });

            function resize(callback) {
                callbacks.push(callback);
                callback();
            }

            tick();

            return resize;
        })(),
        settings;

    function remove(node) {
        if(node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }

    function inReverse(a, b) {
        return b.localeCompare(a);
    }

    function AudioAnalyser() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.canplay = false;
        this.seeking = false;
        this.context = new AudioAnalyser.AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = settings.size * 2; /* The amount of data values is generally half the fftSize */
        this.analyser.smoothingTimeConstant = settings.smoothing;
        this.analyser.minDecibels = settings.mindecibels;
        this.analyser.maxDecibels = settings.maxdecibels;
        this.source = null;
        this.gainNode = null;
        this.events = {};
        this.song =  -1; /* calling next() will load first song */
    }

    AudioAnalyser.prototype.next = function () {
        this.song = (this.song + 1) % settings.audio.length;
        this.load(settings.audio[this.song]);
    };

    AudioAnalyser.prototype.last = function () {
        this.song = (this.song + settings.audio.length - 1) % settings.audio.length;
        this.load(settings.audio[this.song]);
    };

    AudioAnalyser.prototype.initialize = function () {
        var audioObject = this;

        ['canplay', 'ended', 'pause', 'playing', 'progress', 'timeupdate'].forEach(function (name) {
            audioObject.audio.addEventListener(name, function (event) {
                audioObject.emit(name, event);
            });
        });

        audioObject.audio.addEventListener('canplay', function () {
            var canplay = audioObject.canplay;

            audioObject.canplay = true;

            if(settings.autoplay) {
                audioObject.play();
            }

            if(AudioAnalyser.enabled && !canplay) {
                audioObject.source = audioObject.context.createMediaElementSource(audioObject.audio);
                audioObject.source.connect(audioObject.analyser);
                audioObject.gainNode = audioObject.context.createGain();
                audioObject.gainNode.gain.value = settings.volume;
                audioObject.analyser.connect(audioObject.gainNode);
                audioObject.gainNode.connect(audioObject.context.destination);
            }
        });

        audioObject.addEventListener('seeking', function (event) {
            audioObject.pause();
            audioObject.seeking = true;
            audioObject.audio.currentTime = event.currentTime;
        });

        audioObject.addEventListener('seeked', function (event) {
            audioObject.seeking = false;
            if(event.resume) {
                audioObject.play();
            }
        });

        audioObject.audio.addEventListener('ended', audioObject.next.bind(audioObject));

        audioObject.next();
    };

    AudioAnalyser.prototype.load = function (song) {
        var audio = this.audio,
            props = Object.getOwnPropertyNames(song),
            i,
            prop,
            source;

        audio.pause();
        Array.prototype.slice.call(audio.children).forEach(remove);
        props.sort(inReverse);

        for(i = 0; i < props.length; i++) {
            prop = props[i];

            if(prop === 'name') {
                this.emit('name', {name: song[prop]});
            } else {
                source = document.createElement('source');
                source.type = codecs[prop];
                source.src = song[prop];
                audio.appendChild(source);
            }
        }

        audio.controls = true;

        if(settings.autoplay) {
            audio.autoplay = true;
        }

        audio.load();
    };

    AudioAnalyser.prototype.play = function () {
        if(this.audio.paused && this.canplay && !this.seeking) {
            this.audio.play();
        }
    };

    AudioAnalyser.prototype.pause = function () {
        if(!this.audio.paused) {
            this.audio.pause();
        }
    };

    AudioAnalyser.prototype.addEventListener = function (event, callback) {
        if(typeof callback !== 'function' || (this.events[event] && !this.events.hasOwnProperty(event))) {
            return;
        }

        if(!this.events.hasOwnProperty(event)) {
            this.events[event] = [callback];
        } else if(Array.isArray(this.events[event])) {
            this.events[event].push(callback);
        }
    };

    AudioAnalyser.prototype.emit = function (event, data) {
        if(this.events.hasOwnProperty(event) && Array.isArray(this.events[event])) {
            for(var i = 0; i < this.events[event].length; i++) {
                this.events[event][i].call(this, data);
            }
        }
    };

    AudioAnalyser.AudioContext = window.AudioContext || window.webkitAudioContext;

    AudioAnalyser.enabled = (AudioAnalyser.AudioContext !== undefined);

    function makeControls(audioanalyser, container) {
        var link = document.createElement('link'),
            controls = document.createElement('div'),
            back = document.createElement('div'),
            toggle = document.createElement('div'),
            skip = document.createElement('div'),
            seekbar = document.createElement('div'),
            seekinner = document.createElement('div'),
            buffered = document.createElement('div'),
            played = document.createElement('div'),
            seekbtn = document.createElement('div'),
            time = document.createElement('div'),
            speaker = document.createElement('div'),
            volbar = document.createElement('div'),
            volinner = document.createElement('div'),
            volume = document.createElement('div'),
            volbtn = document.createElement('div'),
            dragbar,
            innerbar,
            dragbtn,
            dragging = false,
            muted = false,
            lastVol = settings.volume,
            resume;

        function setTime(currentTime) {
            var seconds = Math.floor(currentTime),
                minutes = Math.floor(seconds / 60),
                timeStr = '';

            timeStr += minutes + ':';
            seconds -= minutes * 60;
            timeStr += ('0' + seconds).slice(-2);

            time.textContent = timeStr;
        }

        function getPos(event, element) {
            var x = event.clientX,
                y = event.clientY,
                currentElement = element;
            
            do {
                x -= currentElement.offsetLeft - currentElement.scrollLeft;
                y -= currentElement.offsetTop - currentElement.scrollTop;
            } while (currentElement = currentElement.parentElement);
            
            return {
                x: x,
                y: y
            };
        }

        function updatePos(xPos, bar, button) {
            var x = Math.max(Math.min(xPos, bar.offsetWidth - button.offsetWidth - 1), -1);
            button.style.left = x + 'px';
        }

        function updateRange(start, end, bar, range) {
            var left = Math.round(bar.clientWidth * start),
                right = Math.round(bar.clientWidth * end);

            range.style.left = left + 'px';
            range.style.width = (right - left) + 'px';
        }

        function barMousedown(event) {
            dragging = true;
            dragbar = this;
            innerbar = this.firstElementChild;
            dragbtn = this.lastElementChild;

            if(dragbtn === seekbtn) {
                resume = !audioanalyser.audio.paused;
            }

            barMousemove(event);

            event.preventDefault();
        }

        function barMousemove(event) {
            if(dragging) {
                updatePos(Math.round(getPos(event, dragbar).x - dragbtn.offsetWidth / 2 - 2), dragbar, dragbtn);

                if(dragbtn === seekbtn) {
                    seekMousemove(event);
                }

                if(dragbtn === volbtn) {
                    volumeMousemove(event);
                }
            }
        }

        function barMouseup() {
            if(dragbtn === seekbtn) {
                audioanalyser.emit('seeked', {
                    resume: resume
                });
            }

            dragging = false;
            dragbar = null;
            innerbar = null;
            dragbtn = null;
        }

        function seekMousemove(event) {
            var percent = (seekbtn.offsetLeft + 1) / (seekbar.offsetWidth - seekbtn.offsetWidth);

            updateRange(0, (seekbtn.offsetLeft + seekbtn.offsetWidth / 2) / seekbar.clientWidth, seekinner, played);

            audioanalyser.emit('seeking', {
                currentTime: Math.floor(Math.max(Math.min(percent, 1), 0) * audioanalyser.audio.duration)
            });
        }

        function volumeMousemove(event) {
            var percent = (volbtn.offsetLeft + 1) / (volbar.offsetWidth - volbtn.offsetWidth);

            updateRange(0, (volbtn.offsetLeft + volbtn.offsetWidth / 2) / volbar.clientWidth, volinner, volume);
            
            if(audioanalyser.gainNode) {
                audioanalyser.gainNode.gain.value = percent;
            }

            muted = false;

            if(percent > 0.5) {
                speaker.classList.remove('icon-volume-off', 'icon-volume-down');
                speaker.classList.add('icon-volume-up');
            } else if(percent > 0) {
                speaker.classList.remove('icon-volume-off', 'icon-volume-up');
                speaker.classList.add('icon-volume-down');
            } else {
                speaker.classList.remove('icon-volume-down', 'icon-volume-up');
                speaker.classList.add('icon-volume-off');
                muted = true;
            }

            lastVol = percent || 1;
        }

        toggle.addEventListener('click', function () {
            if(audioanalyser.audio.paused) {
                audioanalyser.play();
            } else {
                audioanalyser.pause();
            }
        });

        back.addEventListener('click', function () {
            audioanalyser.last();
        });

        skip.addEventListener('click', function () {
            audioanalyser.next();
        });

        speaker.addEventListener('click', function () {
            if(muted) {
                updatePos(lastVol * (volbar.offsetWidth - volbtn.offsetWidth) - 1, volbar, volbtn);
                audioanalyser.gainNode.gain.value = lastVol;

                if(lastVol > 0.5) {
                    speaker.classList.remove('icon-volume-off', 'icon-volume-down');
                    speaker.classList.add('icon-volume-up');
                } else {
                    speaker.classList.remove('icon-volume-off', 'icon-volume-up');
                    speaker.classList.add('icon-volume-down');
                }
            } else {
                updatePos(-1, volbar, volbtn);
                audioanalyser.gainNode.gain.value = 0;
                speaker.classList.remove('icon-volume-down', 'icon-volume-up');
                speaker.classList.add('icon-volume-off');
            }

            updateRange(0, (volbtn.offsetLeft + volbtn.offsetWidth / 2) / volbar.clientWidth, volinner, volume);
            muted = !muted;
        });

        audioanalyser.addEventListener('playing', function () {
            toggle.classList.add('icon-pause');
            toggle.classList.remove('icon-play');
        });

        audioanalyser.addEventListener('pause', function () {
            toggle.classList.add('icon-play');
            toggle.classList.remove('icon-pause');
        });

        audioanalyser.addEventListener('timeupdate', function () {
            var percent = audioanalyser.audio.currentTime / audioanalyser.audio.duration,
                xPos = Math.round((seekbar.offsetWidth - seekbtn.offsetWidth) * percent - 1);

            if(!audioanalyser.audio.paused) {
                updatePos(xPos, seekbar, seekbtn);
                updateRange(0, (seekbtn.offsetLeft + seekbtn.offsetWidth / 2) / seekbar.clientWidth, seekinner, played);
            }

            setTime(audioanalyser.audio.currentTime);
        });

        audioanalyser.addEventListener('progress', function () {
            if(audioanalyser.audio.buffered.length > 0) {
                var percentStart = audioanalyser.audio.buffered.start(0) / audioanalyser.audio.duration,
                    percentEnd = audioanalyser.audio.buffered.end(0) / audioanalyser.audio.duration;

                updateRange(percentStart, percentEnd, seekinner, buffered);
            }
        });

        seekbar.addEventListener('mousedown', barMousedown);

        volbar.addEventListener('mousedown', barMousedown);

        document.addEventListener('mousemove', barMousemove);

        document.addEventListener('mouseup', barMouseup);

        link.setAttribute('type', 'text/css');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', '//html5music.herokuapp.com/css/style.css');

        link.addEventListener('load', function () {
            setTime(0);

            updatePos(lastVol * (volbar.offsetWidth - volbtn.offsetWidth) - 1, volbar, volbtn);
            volumeMousemove();

            audioanalyser.initialize();
        });

        controls.setAttribute('style', settings.controls);

        controls.classList.add('audio');
        back.classList.add('back', 'icon-step-backward');
        toggle.classList.add('toggle', 'icon-play');
        skip.classList.add('skip', 'icon-step-forward');
        seekbar.classList.add('seekbar');
        seekinner.classList.add('innerbar');
        buffered.classList.add('buffered');
        played.classList.add('played');
        seekbtn.classList.add('seekbtn');
        time.classList.add('time');
        speaker.classList.add('speaker', 'icon-volume-up');
        volbar.classList.add('volbar');
        volinner.classList.add('innerbar');
        volume.classList.add('volume');
        volbtn.classList.add('volbtn');

        document.head.appendChild(link);

        controls.appendChild(back);
        controls.appendChild(toggle);
        controls.appendChild(skip);
        controls.appendChild(seekbar);
        controls.appendChild(time);
        controls.appendChild(speaker);
        controls.appendChild(volbar);

        seekbar.appendChild(seekinner);
        seekbar.appendChild(seekbtn);

        seekinner.appendChild(buffered);
        seekinner.appendChild(played);

        volbar.appendChild(volinner);
        volbar.appendChild(volbtn);

        volinner.appendChild(volume);

        container.appendChild(controls);
    }

    function getMaxSizeNeeded(canvas, effect) {
        switch(effect.position) {
        case 'topright':
        case 'topleft':
        case 'bottomright':
        case 'bottomleft':
        case 'horizontalright':
        case 'horizontalleft':
            return canvas.clientWidth / effect.size;
        case 'topmirror':
        case 'bottommirror':
        case 'horizontalmirror':
            return canvas.clientWidth / effect.size / 2;
        case 'leftdown':
        case 'leftup':
        case 'rightdown':
        case 'rightup':
        case 'verticaldown':
        case 'verticalup':
            return canvas.clientHeight / effect.size;
        case 'leftmirror':
        case 'rightmirror':
        case 'verticalmirror':
            return canvas.clientHeight / effect.size / 2;
        case 'horizontal':
            return canvas.clientWidth;
        case 'vertical':
            return canvas.clientHeight;
        }
    }

    function Visualizer() {
        var audioObject = this,
            i,
            canvas,
            effect;

        audioObject.audioanalyser = new AudioAnalyser();
        audioObject.timeout = null;
        audioObject.canvases = [];
        audioObject.contexts = [];
        audioObject.sizes = new Array(settings.effects.length);
        audioObject.container = document.createElement('div');
        audioObject.container.classList.add('music');
        audioObject.container.setAttribute('style', settings.container);

        script.parentNode.insertBefore(audioObject.container, script);

        for(i = 0; i < settings.effects.length; i++) {
            canvas = document.createElement('canvas');
            effect = settings.effects[i];

            audioObject.canvases.push(canvas);
            canvas.setAttribute('style', effect.style);
            audioObject.container.appendChild(canvas);
            audioObject.contexts.push(canvas.getContext('2d'));

            resize((function (canvas, effect, i) {
                return function () {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                    audioObject.sizes[i] = getMaxSizeNeeded(canvas, effect);
                };
            }(canvas, effect, i)));
        }

        makeControls(audioObject.audioanalyser, audioObject.container);

        audioObject.name = document.createElement('div');
        audioObject.name.classList.add('name');
        audioObject.name.setAttribute('style', settings.name);

        audioObject.container.appendChild(audioObject.name);

        audioObject.audioanalyser.addEventListener('playing', function () {
            if(audioObject.timeout === null) {
                audioObject.timeout = setInterval(audioObject.draw.bind(audioObject), settings.frame);
            }
        });

        audioObject.audioanalyser.addEventListener('name', function (data) {
            audioObject.name.textContent = data.name;
        });
    }

    Visualizer.prototype.clear = function () {
        for(var i = 0; i < settings.effects.length; i++) {
            this.contexts[i].clearRect(0, 0, this.canvases[i].width, this.canvases[i].height);
        }
    };

    Visualizer.prototype.draw = function () {
        this.clear();

        /* if audio is paused, cancel interval and clear canvases */
        if(this.audioanalyser.audio.paused) {
            clearInterval(this.timeout);
            this.timeout = null;
            return;
        }

        var analyser = this.audioanalyser.analyser,
            timeSize = Math.min(analyser.fftSize, Math.max.apply(Math, this.sizes)),
            freqSize = Math.min(analyser.frequencyBinCount, Math.max.apply(Math, this.sizes)),
            timeData = new Uint8Array(timeSize),
            freqData = new Uint8Array(freqSize),
            i;

        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        for(i = 0; i < settings.effects.length; i++) {
            switch(settings.effects[i].type) {
            case 'fft':
                Visualizer.drawFFT(settings.effects[i], this.canvases[i], this.contexts[i], freqData);
                break;
            case 'waveform':
                Visualizer.drawWaveform(settings.effects[i], this.canvases[i], this.contexts[i], timeData);
                break;
            }
        }
    };

    Visualizer.drawFFT = function (effect, canvas, context, data) {
        var W = canvas.width,
            H = canvas.height,
            D = effect.size,
            L = effect.colors.length,
            c, /* color index */
            i, /* data index */
            p, /* 1st canvas pixel row / col */
            q, /* 2nd canvas pixel row / col */
            v; /* volume */

        for(c = 0; c < L; c++) {
            context.fillStyle = effect.colors[c];
            switch(effect.position) {
            case 'topright':
                for(i = 0, p = 0; i < data.length && p < W; i++) {
                    p = ~~(i * D);
                    v = ~~(data[i] / 256 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, v * c, 1 - D, v - 1);
                }
                break;
            case 'topleft':
                for(i = 0, p = W; i < data.length && p >= 0; i++) {
                    p = ~~(W - i * D);
                    v = ~~(data[i] / 256 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, v * c, 1 - D, v - 1);
                }
                break;
            case 'topmirror':
                for(i = 0, p = W/2; i < data.length && p >= 0; i++) {
                    p = ~~(W/2 - i * D);
                    q = ~~(W/2 + i * D + 1);
                    v = ~~(data[i] / 256 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, v * c, 1 - D, v - 1);
                    context.fillRect(q, v * c, D - 1, v - 1);
                }
                break;
            case 'bottomright':
                for(i = 0, p = 0; i < data.length && p < W; i++) {
                    p = ~~(i * D);
                    v = ~~(data[i] / 256 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, H - v * c, 1 - D, 1 - v);
                }
                break;
            case 'bottomleft':
                for(i = 0, p = W; i < data.length && p >= 0; i++) {
                    p = ~~(W - i * D);
                    v = ~~(data[i] / 256 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, H - v * c, 1 - D, 1 - v);
                }
                break;
            case 'bottommirror':
                for(i = 0, p = W/2; i < data.length && p >= 0; i++) {
                    p = ~~(W/2 - i * D);
                    q = ~~(W/2 + i * D + 1);
                    v = ~~(data[i] / 256 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, H - v * c, 1 - D, 1 - v);
                    context.fillRect(q, H - v * c, D - 1, 1 - v);
                }
                break;
            case 'leftdown':
                for(i = 0, p = 0; i < data.length && p < H; i++) {
                    p = ~~(i * D);
                    v = ~~(data[i] / 256 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(v * c, p, v - 1, 1 - D);
                }
                break;
            case 'leftup':
                for(i = 0, p = 0; i < data.length && p < H; i++) {
                    p = ~~(H - i * D);
                    v = ~~(data[i] / 256 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(v * c, p, v - 1, 1 - D);
                }
                break;
            case 'leftmirror':
                for(i = 0, p = H/2; i < data.length && p >= 0; i++) {
                    p = ~~(H/2 - i * D);
                    q = ~~(H/2 + i * D + 1);
                    v = ~~(data[i] / 256 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(v * c, p, v - 1, 1 - D);
                    context.fillRect(v * c, q, v - 1, D - 1);
                }
                break;
            case 'rightdown':
                for(i = 0, p = 0; i < data.length && p < H; i++) {
                    p = ~~(i * D);
                    v = ~~(data[i] / 256 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(W - v * c, p, 1 - v, 1 - D);
                }
                break;
            case 'rightup':
                for(i = 0, p = H; i < data.length && p >= 0; i++) {
                    p = ~~(H - i * D);
                    v = ~~(data[i] / 256 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(W - v * c, p, 1 - v, 1 - D);
                }
                break;
            case 'rightmirror':
                for(i = 0, p = H/2; i < data.length && p >= 0; i++) {
                    p = ~~(H/2 - i * D);
                    q = ~~(H/2 + i * D + 1);
                    v = ~~(data[i] / 256 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(W - v * c, p, 1 - v, 1 - D);
                    context.fillRect(W - v * c, q, 1 - v, D - 1);
                }
                break;
            case 'horizontalright':
                for(i = 0, p = 0; i < data.length && p < W; i++) {
                    p = ~~(i * D);
                    v = ~~(data[i] / 512 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, ~~(H/2) + v * c, 1 - D, v - 1);
                    context.fillRect(p, ~~(H/2) - v * c, 1 - D, 1 - v);
                }
                break;
            case 'horizontalleft':
                for(i = 0, p = W; i < data.length && p >= 0; i++) {
                    p = ~~(W - i * D);
                    v = ~~(data[i] / 512 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, ~~(H/2) + v * c, 1 - D, v - 1);
                    context.fillRect(p, ~~(H/2) - v * c, 1 - D, 1 - v);
                }
                break;
            case 'horizontalmirror':
                for(i = 0, p = W/2; i < data.length && p >= 0; i++) {
                    p = ~~(W/2 - i * D);
                    q = ~~(W/2 + i * D + 1);
                    v = ~~(data[i] / 512 * H / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(p, ~~(H/2) + v * c, 1 - D, v - 1);
                    context.fillRect(q, ~~(H/2) + v * c, D - 1, v - 1);
                    context.fillRect(p, ~~(H/2) - v * c, 1 - D, 1 - v);
                    context.fillRect(q, ~~(H/2) - v * c, D - 1, 1 - v);
                }
                break;
            case 'verticaldown':
                for(i = 0, p = 0; i < data.length && p < H; i++) {
                    p = ~~(i * D);
                    v = ~~(data[i] / 512 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(~~(W/2) + v * c, p, v - 1, 1 - D);
                    context.fillRect(~~(W/2) - v * c, p, 1 - v, 1 - D);
                }
                break;
            case 'verticalup':
                for(i = 0, p = H; i < data.length && p >= 0; i++) {
                    p = ~~(H - i * D);
                    v = ~~(data[i] / 512 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(~~(W/2) + v * c, p, v - 1, 1 - D);
                    context.fillRect(~~(W/2) - v * c, p, 1 - v, 1 - D);
                }
                break;
            case 'verticalmirror':
                for(i = 0, p = H/2; i < data.length && p >= 0; i++) {
                    p = ~~(H/2 - i * D);
                    q = ~~(H/2 + i * D + 1);
                    v = ~~(data[i] / 512 * W / L) + 1;
                    v = (v === 1 ? 0 : v);
                    context.fillRect(~~(W/2) + v * c, p, v - 1, 1 - D);
                    context.fillRect(~~(W/2) + v * c, q, v - 1, D - 1);
                    context.fillRect(~~(W/2) - v * c, p, 1 - v, 1 - D);
                    context.fillRect(~~(W/2) - v * c, q, 1 - v, D - 1);
                }
                break;
            }
        }
    };

    Visualizer.drawWaveform = function (effect, canvas, context, data) {
        var W = canvas.width,
            H = canvas.height,
            D = data.length, /* buffer length */
            i = 0; /* data index */

        context.strokeStyle = effect.color;
        context.lineWidth = effect.size;

        context.beginPath();

        switch(effect.position) {
        case 'horizontal':
            context.moveTo((W + 1) * i / D, data[0] / 256 * H);
            for(i = 1; i < D; i++) {
                context.lineTo((W + 1) * i / D, data[i] / 256 * H);
            }
            break;
        case 'vertical':
            context.moveTo(data[0] / 256 * W, (H + 1) * i / D);
            for(i = 1; i < D; i++) {
                context.lineTo(data[i] / 256 * W, (H + 1) * i / D);
            }
            break;
        }

        context.stroke();
    };

    try {
        settings = JSON.parse(script.textContent.trim()||'{}');
        new Visualizer();
    } catch(error) {
        console.log(error);
        return;
    }
})();

var audioObject = {
            "autoplay": true,
            "volume": 1,
            "size": 1024,
            "smoothing": 0.6,
            "mindecibels": -50,
            "maxdecibels": -15,
            "frame": 30,
            "container": "position:relative;background-color:#000;width:100%;height:100%",
            "controls": "position:absolute;left:0;bottom:0",
            "name": "position:absolute;right:0;bottom:0;padding:10px;color:#FFF;font-size:16px;font-family:\"Average Sans\"",
            "effects": [
                {
                    "type": "fft",
                    "position": "horizontalmirror",
                    "colors": [
                        "#0FF",
                        "#0BB",
                        "#088",
                        "#044"
                    ],
                    "size": 4,
                    "style": "position:absolute;bottom:0;left:0;width:100%;height:30%"
                },
                {
                    "type": "waveform",
                    "position": "horizontal",
                    "color": "#F00",
                    "size": 3,
                    "style": "position:absolute;top:15%;left:0;width:100%;height:30%"
                }
            ],
            "audio": [
                {
                    "preview_url": "https://p.scdn.co/mp3-preview/0b90429fd554bad6785faa2b8931d613db4a0ee4",
                    "name": "My First Song"
                },
                {
                    "mp3": "https://p.scdn.co/mp3-preview/0b90429fd554bad6785faa2b8931d613db4a0ee4",
                    "name": "My Second Song"
                },
                {
                    "mp3": "https://p.scdn.co/mp3-preview/3c1802d9bb1e80348da770f1c38d2e63b7a2e5c6",
                    "name": "Another One"
                }

            ]
        }

class VisualPage extends Component {
 constructor(props) {
      super(props);
      this.state = ({
         songList: [],
         nowPlaying: []
      });
   }
    render() {
        return (
            <div className="container">
                <div>
                    {this.state.songList.length > 0 &&
                    <SongList songList={this.state.songList} updateParent={this.updateNowPlaying}/>
                    }
                </div>
                {this.state.nowPlaying.length > 0 && 
                <AudioPlayer autoplay style={styles.audioPlayerStyle} playlist={this.state.nowPlaying}/>  
                }
            </div>
        );
    }
}

export default VisualPage;
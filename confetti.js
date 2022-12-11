
(function (global) {
    'use strict';
  
    var requestFrame = (window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function (cb) {
            setTimeout(callback, 1000 / 60);
          }).bind(global);
  
    function ParticleCanvasClass (canvas, container) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.container = container;
  
      if (container && window) {
        this.resizeToContainer();
        window.removeEventListener('resize', this.resizeToContainer);
      }
    }
  
    ParticleCanvasClass.prototype.resizeToContainer = function () {
      if (this.container) {
        this.size(this.container.offsetWidth, this.container.offsetHeight);
      }
  
      return this;
    };
  
    ParticleCanvasClass.prototype.size = function (width, height) {
      if (arguments.length === 2) {
        this.canvas.width = width;
        this.canvas.height = height;
  
        return this;
      } else if (arguments.length === 1 && ('width' === arguments[0] || 'height' === arguments[0])) {
        return this.canvas[arguments[0]];
      } else if (arguments.length === 0) {
        return {
          width: this.canvas.width,
          height: this.canvas.height
        };
      } else {
        console.error('Expects 0 or 2 arguments.');
      }
  
      return this;
    };
  
    ParticleCanvasClass.prototype.step = function (particles, config) {
      var that = this;
      return function animator() {
        if (that.halt) {
          console.log('Stopping');
          return;
        }
        var context = that.context;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, that.canvas.width, that.canvas.height);
        
        if (config.updateState) {
          config.updateState(config);
        }
  
        for (var i = 0; i < particles.length; i++) {
          config.drawParticle(particles[i], i, that, config);
          config.updateParticle(particles[i], i, that, config);
        }
  
        if (config.batch) {
          context[(config.fill) ? 'fill' : 'stroke']();
        }
  
        requestFrame(that.step(particles, config));
      };
    };
  
    ParticleCanvasClass.prototype.start = function (particles, config) {
      this.halt = false;
      this.step(particles, config)();
    };
  
    ParticleCanvasClass.prototype.stop = function () {
      this.halt = true;
      window.removeEventListener('resize', this.resizeToContainer);
    };
  
    ParticleCanvasClass.prototype.destroy = function () {
      this.stop();
    };
  
    ParticleCanvasClass.prototype.createParticle = function (config) {
      return new ParticleClass(config);
    };
  
    function ParticleClass(props) {
      for (var prop in props) {
        this[prop] = props[prop];
      }
    }
  
    ParticleClass.prototype.isExiting = function (canvas) {
      return (this.x > canvas.width + 5 || this.x < -5 || this.y > canvas.height);
    };
  
    window.createParticleCanvas = function (canvas, container) {
      return new ParticleCanvasClass(canvas, container);
    };
    window.createParticle = function (props) {
      return new ParticleClass(props);
    };
  })(window);
  
  function randomBetween(a, b, round) {
    var num = a + Math.random() * (b - a);
    return ('undefined' !== typeof round) ? +num.toFixed(round) : num;
  }
  
  function color(hueRange, saturationRange, lightnessRange, opacityRange) {
    hueRange = hueRange || [0, 360];
    saturationRange = saturationRange || [0, 100];
    lightnessRange = lightnessRange || [0, 100];
    opacityRange = opacityRange || [0, 1];
    
    var color = 'hsla(' + randomBetween(hueRange[0], hueRange[1]) + ', ' +
      randomBetween(saturationRange[0], saturationRange[1]) + '%, ' +
      randomBetween(lightnessRange[0], lightnessRange[1]) + '%, ' + 
      randomBetween(opacityRange[0], opacityRange[1]) + ')';
  
    return color;
  }
  
  function initialConfettiState(distance, canvas, config) {
    var width = 15 + 10 * Math.random();
    var height = 15 + 5 * Math.random();
    var distanceScale = 1;
    
    if (!distance) {
      distanceScale = Math.pow(randomBetween(0, 1), config.distanceWeight);
      distance = config.minDistance + (config.maxDistance - config.minDistance) * distanceScale; 
    } else {
      distanceScale = (distance - config.shared.minDistance) / (config.shared.maxDistance - config.shared.minDistance);
    }
    
    return {
      x: randomBetween(0, canvas.size('width')),
      y: -1 * randomBetween(0, canvas.size('height')),
      w: width / distance,
      h: height / distance,
      mass: width * height,
      distance: distance,
      distanceSq: Math.pow(distance, 2),
      color: color(
        [config.shared.startingHue, config.shared.startingHue + 20], 
        [90, 100], 
        [40, 80], 
        [Math.max(1 - distanceScale + 0.5, 0.2), Math.min(1 - distanceScale + 0.5, 1)]
      ),
      drift: 0,
      angle: randomBetween(0, Math.PI * 2),
      angleIncrement: (Math.random() > 0.5 ? 1 : -1 ) * randomBetween(0.01, 0.075),
      angleCos: 0,
      angleSin: 0,
      skewXScale: randomBetween(0.5, 1),
      skewYScale: randomBetween(0.5, 1),
      driftScale: 1 - distanceScale,
      driftAngleOffset: randomBetween(0, Math.PI * 2),
      rotationAngleOffset: randomBetween(0, Math.PI * 2)
    };
  }
  
  function drawConfetti(particle, index, canvas, config) {
    var driftOffset = {
      x: particle.drift * particle.driftScale * particle.w,
      y: 0
    };
      
    var transform = {
      scaleX: 1,
      scaleY: 0.75,
      skewX: 1 * particle.skewXScale * particle.angleCos,
      skewY: 1 * particle.skewYScale * particle.angleSin,
      translateX: particle.x + driftOffset.x,    
      translateY: particle.y
    };
    
    canvas.context.beginPath();
    canvas.context.setTransform(
      transform.scaleX, 
      transform.skewX, 
      transform.skewY, 
      transform.scaleY, 
      transform.translateX, 
      transform.translateY
    );
    canvas.context.rotate(
      particle.angle + particle.rotationAngleOffset
    );
    canvas.context.fillStyle = particle.color;
    canvas.context.fillRect(
      -0.5 * particle.w, 
      -0.5 * particle.h, 
      particle.w,
      particle.h);
  }
  
  function updateConfetti(particle, index, canvas, config) {
    particle.y += (1 + Math.abs(particle.mass / 100 + Math.abs(particle.angleIncrement) * 20) / particle.distanceSq);
    particle.drift = Math.cos(particle.angle + particle.driftAngleOffset);
    particle.angleCos = Math.cos(particle.angle);
    particle.angleSin = Math.sin(particle.angle);
    particle.angle += particle.angleIncrement;
  
    if ((particle.y - particle.h) >= canvas.size('height')) {
      var newState = initialConfettiState(particle.distance, canvas, config);
    
      particle.x = newState.x;
      particle.y = -particle.h * 2;
      particle.color = newState.color;
    }
  }
  
  function updateState(config) {
    config.shared.startingHue += 0.05;
  }
  
  var numParticles = 600;
  var layerRatio = 0.3;
  
  var sharedConfig = {
    minDistance: 1,
    maxDistance: 5,
    startingHue: Math.random() * 360
  };
  
  var backgroundConfig = {
    shared: sharedConfig,
    minDistance: 1.5,
    maxDistance: 5,
    distanceWeight: 1,
    drawParticle: drawConfetti,
    updateParticle: updateConfetti,
    updateState: updateState
  };
  
  var foregroundConfig = {
    shared: sharedConfig,
    minDistance: 1,
    maxDistance: 1.5,
    distanceWeight: 0.25,
    drawParticle: drawConfetti,
    updateParticle: updateConfetti,
    updateState: updateState
  };
  
  var backgroundCanvas = createParticleCanvas(
      document.querySelector('canvas.background'),
      document.querySelector('.scene')
  );
  
  var foregroundCanvas = createParticleCanvas(
      document.querySelector('canvas.foreground'),
      document.querySelector('.scene')
  );
  
  var backgroundParticles = _.range(0, Math.floor(numParticles * (1 - layerRatio))).map(function () {
    return createParticle(initialConfettiState(null, backgroundCanvas, backgroundConfig));
  }).sort(function(a, b) {
    return a.distance > b.distance;
  });
  
  var foregroundParticles = _.range(0, Math.floor(numParticles * (layerRatio))).map(function () {
    return createParticle(initialConfettiState(null, foregroundCanvas, foregroundConfig));
  }).sort(function(a, b) {
    return a.distance > b.distance;
  });
  
  backgroundCanvas.start(backgroundParticles, backgroundConfig);
  foregroundCanvas.start(foregroundParticles, foregroundConfig);
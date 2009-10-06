/* JavaScript Strange Attractor generator using Canvas
 * by Jacob Seidelin 2009
 * Somewhat based on code by the magnificent Paul Bourke */


var StrangeGenerator = function() {

function $(id) { return document.getElementById(id); }

var background;

var w, h,
    running = false,
    doneCallback,
    maxIterations,
    maxAttractors = 10000,
    numAttractors = 0,
    options,

    canvas = $("output"),
    ctx = canvas.getContext("2d"),


    sin = Math.sin,
    cos = Math.cos,
    sqrt = Math.sqrt,
    abs = Math.abs,
    log = Math.log,

    RNG = new MersenneTwister19937(),
    seed;

function random() {
  return RNG.genrand_real1();
}

var logelement = $("log"),
    loglines = [],
    fadelogTimer;

function printLog(str, newline) {
  if (newline) {
    if (loglines.length > 20) loglines.shift();
    loglines.push(str);
  } else {
    loglines[loglines.length-1] += str;
  }
  logelement.innerHTML = loglines.join("<br>");
}

function fadeoutLog() {
  var logopacity = 1;
  var next = function() {
    logopacity -= 0.05;
    if (logopacity < 0) {
      logopacity = 0;
      fadelogTimer = 0;
      logelement.style.display = "none";
    } else {
      fadelogTimer = setTimeout(next, 1000 / 30);
    }
    logelement.style.opacity = logopacity;
    logelement.style.mozOpacity = logopacity;

  };
  next();
}

function resetLog() {
  if (fadelogTimer) {
    clearTimeout(fadelogTimer);
    fadelogTimer = 0;
  }

  loglines = [];
  logelement.innerHTML = "";
  logelement.style.display = "block";
  logelement.style.opacity = 1;
  logelement.style.mozOpacity = 1;
}



function nextAttractor(fixedseed) {
  running = true;
  numAttractors++;
  if (numAttractors > maxAttractors) {
    printLog("Attractor limit reached, bailing out");
    running = false;
    return;
  }
  if (numAttractors > 1000)
    $("piece-title").innerHTML = "This is taking a long time, huh?";

  seed = (typeof fixedseed === "number") ? fixedseed : (Math.round(Math.random() * 0xffffffff));
  RNG.init_genrand(seed);

  printLog("Calculating attractor (seed = " + seed + ") ", true);
  setTimeout(function() {
    generateAttractor(typeof fixedseed === "number");
  }, 1);
}

function generateAttractor(fixed) {

  var ax = [];
  var ay = [];
  var xmin = 1e32, xmax = -1e32, ymin = 1e32, ymax = -1e32;
  var d0, dd, dx, dy, lyapunov;
  var xe, ye;

  for (i=0;i<6;i++) {
    ax[i] = 4 * (random() - 0.5);
    ay[i] = 4 * (random() - 0.5);
  }
  var   ax0 = ax[0],
    ax1 = ax[1],
    ax2 = ax[2],
    ax3 = ax[3],
    ax4 = ax[4],
    ax5 = ax[5],
    ay0 = ay[0],
    ay1 = ay[1],
    ay2 = ay[2],
    ay3 = ay[3],
    ay4 = ay[4],
    ay5 = ay[5];

  var x = [random() - 0.5];
  var y = [random() - 0.5];
  var hxy = [0];

  lyapunov = 0;
  xmin =  1e32;
  xmax = -1e32;
  ymin =  1e32;
  ymax = -1e32;

  hxy = [];

  do {
    xe = x[0] + (random() - 0.5) / 1000.0;
    ye = y[0] + (random() - 0.5) / 1000.0;
    dx = x[0] - xe;
    dy = y[0] - ye;
    d0 = sqrt(dx * dx + dy * dy);
  } while (d0 <= 0);

  var i=1;
  var batchcalc = 2500;

  var calcdone = function(bailout) {
    if (!fixed) {
      /* Classify the series according to lyapunov */
      if (!bailout) {
        if (abs(lyapunov) < 10) {
          printLog("Found neutrally stable, cancelling.", true);
          bailout = true;
        } else if (lyapunov < 0) {
          printLog("Found periodic " + lyapunov + ", cancelling", true);
          bailout = true;
        } else {
          printLog("Found chaotic " + lyapunov, true);
        }
      }
    }

    if (!bailout || fixed) {
      printLog("Drawing attractor ", true);
      setTimeout(function() {
        draw(x, y, xmin, xmax, ymin, ymax, hxy);
      }, 1);
    } else {
      setTimeout(function() {nextAttractor();}, 1);
    }
  };

  var nextcalc = function() {
    var bailout = false;
    var xenew, yenew;
    for (var j = 0;j < batchcalc && i < maxIterations; i++, j++) {
      var i1 = i-1;
      var x1 = x[i1], y1 = y[i1];
      var xx = x1*x1, yy = y1*y1, xy = x1*y1;
      var xi, yi;
      if (options.formula === 0) { // Quadratic
        xi = ax0 + ax1*x1 + ax2*xx + ax3*xy + ax4*y1 + ax5*yy;
        yi = ay0 + ay1*x1 + ay2*xx + ay3*xy + ay4*y1 + ay5*yy;
      } else if (options.formula === 1) { // Trig
        xi = ax0 * sin(ax1*y1) + ax2 * cos(ax3*x1);
        yi = ay0 * sin(ay1*x1) + ay2 * cos(ay4*y1);
      } else if (options.formula === 2) { // Henon
        xi = y1 + 1 - 1.4 * xx;
        yi = 0.3 * x1;
      } else if (options.formula === 3) { // de Jong
        /* ax1 = 1.40; ax2 = 1.56; ay0 = 1.40; ax0 = -6.56; */
        xi = ax0 * sin(ax1*y1) - cos(ax2*x1);
        yi = ay0 * sin(ax1*x1) - cos(ax2*y1);
      }

      x[i] = xi;
      y[i] = yi;

      /* Update the bounds */
      if (xi < xmin) xmin = xi;
      if (yi < ymin) ymin = yi;
      if (xi > xmax) xmax = xi;
      if (yi > ymax) ymax = yi;

      if (options.compositing) {
        dx = (xi - x1) / (xmax - xmin);
        dy = (yi - y1) / (ymax - ymin);
        hxy[i] = dx*dx + dy*dy;
      }

      if (!fixed) {
        /* Does the series tend to infinity */
        if (xmin < -1e10 || ymin < -1e10 || xmax > 1e10 || ymax > 1e10) {
          //printLog("(Wow, infinity is huge!)", false);
          bailout = true;
          break;
        }

        var xexe = xe*xe, xeye = xe*ye, yeye = ye*ye;

        if (options.formula === 0) {
          xenew = ax0 + ax1*xe + ax2*xexe + ax3*xeye + ax4*ye + ax5*yeye;
          yenew = ay0 + ay1*xe + ay2*xexe + ay3*xeye + ay4*ye + ay5*yeye;
        } else if (options.formula === 1) {
          xenew = ax0 * sin(ax1*ye) + ax2 * cos(ax3*xe);
          yenew = ay0 * sin(ay1*xe) + ay2 * cos(ay4*ye);
        } else if (options.formula === 2) {
          xenew = y1 + 1 - 1.4 * xexe;
          yenew = 0.3 * xe;
        } else if (options.formula === 3) {
          xenew = ax0 * sin(ax1*ye) - cos(ax2*xe);
          yenew = ay0 * sin(ax1*xe) - cos(ax2*ye);
        }

        /* Does the series tend to a point */
        dx = x[i] - x[i-1];
        dy = y[i] - y[i-1];
        var absdx = dx < 0 ? -dx : dx;
        var absdy = dy < 0 ? -dy : dy;
        if (absdx < 1e-10 && absdy < 1e-10) {
          //printLog("(A point, that's no good)", false);
          bailout = true;
          break;
        }

        /* Calculate the lyapunov exponents */
        if (i > 1000) {
          dx = x[i] - xenew;
          dy = y[i] - yenew;
          dd = sqrt(dx * dx + dy * dy);
          var absddd0 = dd / d0;
          if (absddd0 < 0) absddd0 = -absddd0;
          lyapunov += log(absddd0);
          xe = x[i] + d0 * dx / dd;
          ye = y[i] + d0 * dy / dd;
        }
      }
    }
    if (i<maxIterations && !bailout) {
      printLog(".");
      setTimeout(nextcalc, 1);
    } else {
      calcdone(bailout);
    }
  }

  nextcalc();


}

// generate a name and start the silly animated text under the image
function createTitle() {
  var name, names, twopart, n1, n2, RNG, l;
  if (options.formula === 2) {
    name = "Hénon";
  } else {
    names = StrangeGenerator.names;
    RNG = new MersenneTwister19937();
    RNG.init_genrand(seed);
    twopart = (RNG.genrand_real1() < 0.5);
    l = names.length;
    if (twopart) {
      n1 = (l * RNG.genrand_real1()) >> 0;
      n2 = (l * RNG.genrand_real1()) >> 0;
      name = names[n1] + " " + names[n2];
    } else {
      n1 = (l * RNG.genrand_real1()) >> 0;
      name = names[n1];
    }
  }

  if (options.formula !== 2) {
    name += " (" + seed + ")";
  }

  $("piece-title").innerHTML = name;
}

function resetTitle() {
  $("piece-title").innerHTML = "...";
}

function draw(x, y, xmin, xmax, ymin, ymax, hxy) {
  ctx.fillStyle = options.compositing ? background : "rgb(21,29,41)";
  ctx.fillRect(0,0,w,h);

  // canvas used for compositing effects
  var   blur = document.createElement("canvas"),
    blurctx = blur.getContext("2d");

  blur.width = w;
  blur.height = h;
  blurctx.fillStyle = background;
  blurctx.fillRect(0,0,w,h);

  var fx, fy, ix, iy;

  var finish = function() {
    printLog("All done!", true);
    setTimeout(fadeoutLog, 500);
    running = false;
    if (doneCallback)
      doneCallback();
  };

  var composite = function() {
    printLog("(1/3)", false);

    setTimeout(function() {
      var blur1 = Pixastic.process(canvas, "blurfast", {amount : 1, leaveDOM : true});
      var res = Pixastic.process(canvas, "blend", {image : blur1, mode : "normal", amount : 0.2, leaveDOM : true});
      ctx.drawImage(res, 0, 0);

      printLog("Compositing...(2/3)", true);

      setTimeout(function() {

        var blur2 = Pixastic.process(blur, "blurfast", {amount : 2, leaveDOM : true})
        var res = Pixastic.process(canvas, "blend", {image : blur2, mode : "lineardodge", leaveDOM : true, amount : 0.4});
        ctx.drawImage(res, 0, 0, w, h);

        printLog("Compositing...(3/3)", true);

        setTimeout(function() {
          var glow = Pixastic.process(canvas, "glow", {amount : 0.4, radius : 0.3, leaveDOM : true});
          ctx.drawImage(glow, 0, 0, w, h);

          finish();
        },50);
      },50);
    },50);
  };

  var drawdone = function() {
    ctx.putImageData(data, 0, 0);
    if (options.compositing) {
      printLog("Compositing...", true);
      setTimeout(composite, 100);
    } else {
      finish();
    }
  };


  var   xrange = (xmax - xmin) / 0.8,
    yrange = (ymax - ymin) / 0.8;

  if (!options.stretch) {
    if (yrange > xrange) {
      xmin -= (yrange - xrange) / 2;
      xmax -= (yrange - xrange) / 2;
      xrange = yrange;
    } else if (xrange > yrange) {
      ymin -= (xrange - yrange) / 2;
      ymax -= (xrange - yrange) / 2;
      yrange = xrange;
    }
  }


  blurctx.beginPath();
  var hue = ((random() * 360 * 4)) % 360 >> 0;
  blurctx.fillStyle = "hsla(" + hue + ",100%,60%,0.05)";

  createTitle();

  var data = ctx.getImageData(0,0,w,h),
      batchcalc = 2000,
      dc = 0,
      i = 0;

  var nextdraw = function() {
    var c = 1.5 / options.quality;
    dc++;
    for (var j = 0; j < batchcalc && i < maxIterations; i++, j++) {
      fx = (x[i] - xmin) / xrange + 0.1;
      fy = (y[i] - ymin) / yrange + 0.1;
      ix = (fx * w) >> 0;
      iy = (fy * h) >> 0;
      if (i > 100) {
        var p = (w*iy + ix) * 4;

        var   r = data.data[p] + c,
          g = data.data[p+1] + c,
          b = data.data[p+2] + c;
        if (r > 255) r = 255;
        if (g > 255) g = 255;
        if (b > 255) b = 255;

        data.data[p] = r;
        data.data[p+1] = g;
        data.data[p+2] = b;

        if (options.compositing) {
          if (i < batchcalc*25) {
            var bhue = ((hue + hxy[i] * 120) % 360) >> 0;

            blurctx.fillStyle = "hsla(" + bhue + ",100%,60%,0.075)";

            var   off = 5,
              bx = (ix - off)>>0,
              by = (iy - off)>>0;
            blurctx.fillRect(bx, by, 10, 10);
          }
        }
      }
    }

    if ((dc % 5) === 0)
      ctx.putImageData(data, 0, 0);

    if (i<maxIterations) {
      printLog(".");
      setTimeout(nextdraw, 1);
    } else {
      blurctx.fill();
      drawdone();
    }
  };

  nextdraw();
}


return {
  isRunning : function() {
    return running;
  },
  makeAttractor : function(seed, opt, callback) {
    options = opt;
    w = options.width;
    h = options.height;
    canvas.width = w;
    canvas.height = h;
    //background = "rgb(10,15,20)";
    background = "rgb(11,15,21)";
    maxIterations = 2000000 * options.quality;
    numAttractors = 0;

    resetLog();
    resetTitle();

    doneCallback = callback;

    nextAttractor(seed);
  }
};

};
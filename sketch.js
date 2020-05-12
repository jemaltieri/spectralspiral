/*
The following section constants determine the look and behavior of the spiral
 */

// NUM_OCTAVES sets the number of octaves / loops of the spiral to display
const NUM_OCTAVES = 5;

// FFT_SIZE here is a little misleading. The actual size of the FFT window is twice this number,
// but this is the amount of useable bins that will be returned by fft.analyze(), since the
// p5.js implemenation of the FFT throws out the bins above the nyquist.
// As with all FFTs (and like, all particles TBH), frequency resolution and time resolution
// are inversely proportional. See Heisenberg et al. 😜
const FFT_SIZE = 4096;
const FFT_SMOOTHING = 0.8;

// DAMPING is a number from 0 - 255 that sets the opacity of the black overlay at the beginning of each frame
const DAMPING = 30;

// WIGGLE_AMPLITUDE is a multiplier for the signal that alters the spiral
const WIGGLE_AMPLITUDE = 1.5;

// FREQUENCY_AT_ZERO_THETA is a frequency that you want lined up at theta=0, which is 3 o'clock on our grid
const FREQUENCY_AT_ZERO_THETA = 110;

// MIN_FREQ is the minimum frequency that will be displayed on the spiral
const MIN_FREQ = 110;

// STROKE_WEIGHT determines the weight of the lines drawn for the spiral
const STROKE_WEIGHT = 4;

// COLOR_OFFSET is a number from 0 - 255 that sets the color at the inside of the spiral. The entire
// spectrum of Hue will be traversed over the course of the spiral
const COLOR_OFFSET = 236;

const NUDGE_X = -80;
const NUDGE_Y = -15;


/*
The following section constants derived from the above constants
 */

const MAX_FREQ = MIN_FREQ * Math.pow(2, NUM_OCTAVES);

// In this program the term pitch just means the log (base 2) of the frequency.
// Thanks to the magic of logarithms, that means that an difference of 1 in pitch
// represents a 2x difference in frequency (1 octave)
const MIN_PITCH = Math.log2(MIN_FREQ);
const MAX_PITCH = Math.log2(MAX_FREQ);
const PITCH_AT_ZERO_THETA = Math.log2(FREQUENCY_AT_ZERO_THETA);


/*
Let's give ourselves some convenience classes and functions
for dealing with converting between representations of points
 */

function CarPoint(x, y) {
  this.x = x;
  this.y = y;

  this.toPol = function() {
    // returns the polar equivalent of this Cartesian point
    // unused at this point, but we'll prolly need it at some point, right?
    let x = this.x;
    let y = this.y;
    let theta = Math.atan2(y, x);
    let r = Math.sqrt((x * x) + (y * y));
    return new PolPoint(r, theta);
  }

  this.transformOrigin = function(newOrigin) {
    // returns a new Cartesian point which represents this point transformed into a new origin system
    let x = this.x + newOrigin.x;
    let y = this.y + newOrigin.y;
    return new CarPoint(x, y);
  }
}

function PolPoint(r, theta) {
  this.r = r;
  this.theta = theta;

  this.toCar = function() {
    // returns the Cartesian equivalent of this polar point
    let r = this.r;
    let theta = this.theta;
    let x = r * Math.cos(theta);
    let y = r * Math.sin(theta);
    return new CarPoint(x, y);
  }
}

function polarLine(polPoint1, polPoint2, origin) {
  // equivalent of the builtin line() function, but instead accepting two polar coordinates and an optional origin point
  let rawCarPoint1 = polPoint1.toCar();
  let rawCarPoint2 = polPoint2.toCar();
  origin = origin || new CarPoint(0,0);
  let carPoint1 = rawCarPoint1.transformOrigin(origin);
  let carPoint2 = rawCarPoint2.transformOrigin(origin);
  line(carPoint1.x, carPoint1.y, carPoint2.x, carPoint2.y);
}

// declaring variables that we'd like to keep in scope across draw cycles
var mic;
var fft;
var hzPerBin;
var minBin;
var maxBin;
var canvasWidth;
var canvasHeight;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);

  // click on the screen in order to let the audio context run
  cnv.mousePressed(userStartAudio);

  background(0);

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(FFT_SMOOTHING, FFT_SIZE);
  fft.setInput(mic);

  // see note above next to FFT_SIZE declaration about the confusion of the FFT window size,
  // that's why we're doubling it here to calculate hzPerBin
  hzPerBin = sampleRate() / (FFT_SIZE * 2);
  minBin = Math.round(MIN_FREQ / hzPerBin);
  maxBin = Math.round(MAX_FREQ / hzPerBin);
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
}

function draw() {
  let spectrum = fft.analyze();
  colorMode(HSB, 255);
  background(0, DAMPING);
  strokeWeight(STROKE_WEIGHT);

  let margin = canvasHeight/25;
  let maxR = canvasHeight/2 - margin;
  let minR = canvasHeight/60;
  // a represents the normal meaning of "a" in the archimede's spiral equation of r = a * theta
  let a = (maxR - minR) / NUM_OCTAVES;
  let origin = new CarPoint((canvasWidth/2) + NUDGE_X, canvasHeight/2 + NUDGE_Y);

  // scope lastPoint outside bin loop
  let lastPoint;

  for (let i = minBin; i <= maxBin; i++) {
    let freq = i * hzPerBin;

    // see above for explanation of the meaning of the word "pitch"
    let pitch = Math.log2(freq);

    // in order to logarithmize the spiral - to make octaves line up - base theta and r off of pitch.
    let theta = Math.PI * 2 * (pitch - PITCH_AT_ZERO_THETA);
    let spiralR = (a * (pitch - MIN_PITCH)) + minR;

    // mix in the signal from the fft into the spiral
    let wiggle = (spectrum[i] / 255) * WIGGLE_AMPLITUDE * a;
    let r = spiralR + wiggle;

    // now that both r and theta have been calculated, we know where the point for this frequency should be
    let newPoint = new PolPoint(r, theta);
    // if it's our first point on the spiral, make lastPoint overlap with it to allow it to float
    lastPoint = lastPoint || newPoint;

    // set the color based on where we are in the course of the spiral
    let percentWayThroughSpiral = (pitch - MIN_PITCH) / (MAX_PITCH - MIN_PITCH);
    let h = (COLOR_OFFSET + (percentWayThroughSpiral * 255)) % 255;
    stroke(h, 255, 255);

    // draw this segment of the spiral
    polarLine(lastPoint, newPoint, origin);
    lastPoint = newPoint;
  }
}

// a couple of listeners for browser events

function mousePressed() {
  let fs = fullscreen();
  fullscreen(!fs);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
}

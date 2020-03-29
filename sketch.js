const NUM_OCTAVES = 5;
const FFT_SIZE = 16384;
const DAMPING = 50;
const WIGGLE_AMPLITUDE = 1.5;
const FREQUENCY_AT_ZERO_THETA = 87.3;
const MIN_FREQ = 87.3;
const COLOR_OFFSET = 236;
const MAX_FREQ = MIN_FREQ * Math.pow(2, NUM_OCTAVES);
const MIN_PITCH = Math.log2(MIN_FREQ);
const MAX_PITCH = Math.log2(MAX_FREQ);
const PITCH_AT_ZERO_THETA = Math.log2(FREQUENCY_AT_ZERO_THETA);
const FFT_SMOOTHING = 0.8;

function CarPoint(x, y) {
  this.x = x;
  this.y = y;
}

function PolPoint(r, theta) {
  this.r = r;
  this.theta = theta;
}

function carToPol(carPoint) {
  let x = carPoint.x;
  let y = carPoint.y;
  let theta = Math.atan2(y, x);
  let r = Math.sqrt((x * x) + (y * y));
  return new PolPoint(r, theta);
}

function polToCar(polPoint) {
  let r = polPoint.r;
  let theta = polPoint.theta;
  let x = r * Math.cos(theta);
  let y = r * Math.sin(theta);
  return new CarPoint(x, y);
}

function transformOrigin(carPoint, newOrigin) {
  let x = carPoint.x + newOrigin.x;
  let y = carPoint.y + newOrigin.y;
  return new CarPoint(x, y);
}

function polarLine(polPoint1, polPoint2, origin) {
  let rawCarPoint1 = polToCar(polPoint1);
  let rawCarPoint2 = polToCar(polPoint2);
  origin = origin || new CarPoint(0,0);
  let carPoint1 = transformOrigin(rawCarPoint1, origin);
  let carPoint2 = transformOrigin(rawCarPoint2, origin);
  line(carPoint1.x, carPoint1.y, carPoint2.x, carPoint2.y);
}

var mic;
var fft;

var hzPerBin;
var minBin;
var maxBin;
var canvasWidth;
var canvasHeight;

function setup() {
  fullscreen();
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.mousePressed(userStartAudio);
  background(0);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(FFT_SMOOTHING, FFT_SIZE);
  fft.setInput(mic);
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
  strokeWeight(4);
  let minTheta = Math.PI * 3 / 2;
  let maxR = canvasHeight/2 - canvasHeight/30;
  let minR = canvasHeight/60;
  let origin = new CarPoint(canvasWidth/2, canvasHeight/2);
  let lastPoint;

  for (let i = minBin; i <= maxBin; i++) {
    let freq = i * hzPerBin;
    let pitch = Math.log2(freq);
    let theta = Math.PI * 2 * (pitch - PITCH_AT_ZERO_THETA);
    let A = (maxR - minR) / NUM_OCTAVES;
    let spiralR = (A * (pitch - MIN_PITCH)) + minR;
    let wiggle = (spectrum[i] / 255) * WIGGLE_AMPLITUDE * A;
    let r = spiralR + wiggle;
    let percentWayThroughSpiral = (pitch - MIN_PITCH) / (MAX_PITCH - MIN_PITCH);
    let newPoint = new PolPoint(r, theta);
    lastPoint = lastPoint || newPoint; // if it's our first point, let's just make it a single point
    let h = (COLOR_OFFSET + percentWayThroughSpiral * 255) % 255;
    stroke(h, 255, 255);
    polarLine(lastPoint, newPoint, origin);
    lastPoint = newPoint;
  }
}

function mousePressed() {
  let fs = fullscreen();
  fullscreen(!fs);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
}

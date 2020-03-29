const CANVAS_WIDTH = screen.width;
const CANVAS_HEIGHT = screen.height;
const NUM_OCTAVES = 5;
const SAMPLE_RATE = 192000
const FFT_SIZE = 16384;
const DAMPING = 50;
const WIGGLE_AMPLITUDE = 0.4;
const FREQUENCY_AT_ZERO_THETA = 120;

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

function setup() {
  fullscreen();
  let cnv = createCanvas(screen.width, screen.height);
  cnv.mousePressed(userStartAudio);
  background(0);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.8, FFT_SIZE);
  fft.setInput(mic);
}

function draw() {
  let spectrum = fft.analyze();
  const HZ_PER_BIN = SAMPLE_RATE / (FFT_SIZE * 2);
  const MIN_FREQ = 120.;
  const MAX_FREQ = MIN_FREQ * Math.pow(2, NUM_OCTAVES);
  const MIN_BIN = Math.round(MIN_FREQ / HZ_PER_BIN);
  const MAX_BIN = Math.round(MAX_FREQ / HZ_PER_BIN);
  let colorOffset = 240;
  colorMode(HSB, 255);
  background(0, DAMPING);
  strokeWeight(4);
  let minTheta = Math.PI * 3 / 2;
  let maxR = CANVAS_HEIGHT/2;
  let minR = CANVAS_HEIGHT/60;
  let origin = new CarPoint(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  let lastPoint = new PolPoint(minR, minTheta);

  for (let i = MIN_BIN; i <= MAX_BIN; i++) {
    let freq = i * HZ_PER_BIN;
    let note = Math.log2(freq / MIN_FREQ);
    let percentWayThroughSpiral = note / NUM_OCTAVES;
    let theta = minTheta + (note * Math.PI * 2);
    let sprialR = minR + ((maxR - minR) * (note / NUM_OCTAVES))
    let r = sprialR + (spectrum[i]*WIGGLE_AMPLITUDE*(percentWayThroughSpiral + 1));
    let newPoint = new PolPoint(r, theta);
    let h = (colorOffset + percentWayThroughSpiral * 255) % 255;
    stroke(h, 255, 255);
    polarLine(lastPoint, newPoint, origin);
    lastPoint = newPoint;
  }
}

function mousePressed() {
  let fs = fullscreen();
  fullscreen(!fs);
}

const CANVAS_WIDTH = screen.width;
const CANVAS_HEIGHT = screen.height;
const NUM_POINTS = 14;
const NUM_ROUNDS = 7;
const FFT_SIZE = 16384;
const DAMPING = 100;


function CarPoint(x, y) {
  this.x = x;
  this.y = y;
}

function PolPoint(r, theta) {
  this.r = r;
  this.theta = theta;
}

function carToPol(carPoint) {
  x = carPoint.x
  y = carPoint.y
  theta = Math.atan2(y, x)
  r = Math.sqrt((x * x) + (y * y))
  return new PolPoint(r, theta);
}

function polToCar(polPoint) {
  r = polPoint.r
  theta = polPoint.theta
  x = r * Math.cos(theta)
  y = r * Math.sin(theta)
  return new CarPoint(x, y);
}

function transformOrigin(carPoint, newOrigin) {
  x = carPoint.x + newOrigin.x
  y = carPoint.y + newOrigin.y
  return new CarPoint(x, y);
}


function polarLine(polPoint1, polPoint2, origin) {
  rawCarPoint1 = polToCar(polPoint1);
  rawCarPoint2 = polToCar(polPoint2);
  origin = origin || new CarPoint(0,0);
  carPoint1 = transformOrigin(rawCarPoint1, origin);
  carPoint2 = transformOrigin(rawCarPoint2, origin);
  line(carPoint1.x, carPoint1.y, carPoint2.x, carPoint2.y);
}

// function shapedPolarLine(polPoint1, polPoint2, shape, maxWidth, origin) {
// // shape is an array with values from 0. to 1.
//     for (let i = 0; i < shape.length - 1; i++) {
//         let startFrac = i / shape.length;
//         let endFrac = (i + 1) / shape.length;
//         let startVal = shape[i];
//         let endVal = shape[(i + 1)];

//     }
// }


let mic;
let fft;

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
//   let numPoints = 1000 * mouseX / CANVAS_WIDTH;
  let spectrum = fft.analyze();
  // console.log("spectrum length: "+spectrum.length)
  const HZ_PER_BIN = 44100 / FFT_SIZE;
  const MIN_FREQ = 60.;
  const MAX_FREQ = MIN_FREQ * Math.pow(2, NUM_ROUNDS);
  const MIN_BIN = Math.round(MIN_FREQ / HZ_PER_BIN);
  // console.log("min: "+ MIN_BIN);
  const MAX_BIN = Math.round(MAX_FREQ / HZ_PER_BIN);
  // console.log("max: "+ MAX_BIN);
  const MAX_WEIGHT = 10;
  let numPoints = 32768;
  let colorOffset = 128;
  colorMode(HSB, 255);
  background(0, DAMPING);
  strokeWeight(4);
  let minTheta = Math.PI * 3 / 2;
  let maxR = CANVAS_HEIGHT/2;
  let minR = CANVAS_HEIGHT/20;
  let origin = new CarPoint(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  let lastPoint = new PolPoint(minR, minTheta);

  for (let i = MIN_BIN; i <= MAX_BIN; i++) {
    // if (spectrum[i] != 0) {
    //   console.log(spectrum[i]);
    // }
    let freq = i * HZ_PER_BIN;
    let note = Math.log2(freq / MIN_FREQ);
    let percentWayThroughSpiral = note / NUM_ROUNDS;
    let theta = minTheta + (note * Math.PI * 2);
    let r = minR + ((maxR - minR) * (note / NUM_ROUNDS)) + (spectrum[i]/4.);
    let newPoint = new PolPoint(r, theta);
    let h = (colorOffset + percentWayThroughSpiral * 255) % 255;
  //   if (i % 100 == 0) {
  //     console.log(i);
  //     console.log(freq);
  //     console.log(h);
  //   }
    stroke(h, 255, 255);
    // strokeWeight(MAX_WEIGHT * (spectrum[i] / 10));
    polarLine(lastPoint, newPoint, origin);
    lastPoint = newPoint;

    if (i % 100 == 0) {
      // console.log(percentWayThroughSpiral);
      // console.log(h);
    }

  }
  // for (let i = 0; i < numPoints; i++) {

  //   let freq = MIN_FREQ * Math.pow(2, (i * NUM_ROUNDS / numPoints));

  //   let
  //   if (i % 1000 == 0) {
  //       console.log(freq);
  //       console.log(energy);
  //   }
  //   // console.log(energy);
  //   strokeWeight(MAX_WEIGHT * (energy / 255));
  //   let h = (colorOffset + (i * 255 / numPoints)) % 255;
  //   stroke(h, 255, 255);
  //   r = minR + rScale * (i / numPoints);
  //   theta = START_THETA + (NUM_ROUNDS * i * Math.PI * 2 / numPoints);
  //   newPoint = new PolPoint(r, theta);
  //   polarLine(lastPoint, newPoint, origin);
  //   lastPoint = newPoint;
  // }



}


// function userStartAudio() {
//   getAudioContext().resume()
// }

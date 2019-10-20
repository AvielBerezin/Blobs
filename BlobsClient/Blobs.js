var socket

var add = p5.Vector.add
var sub = p5.Vector.sub
var mult = p5.Vector.mult
var div = p5.Vector.div

var worldRadious = 600
var viewRadious = 250

var view
var worldview
var intention

var mainHue = 312
var mainSat = 33
var mainBri = 100

function relativeHsb(rh, rs, rb) {
  return color('hsb('+(mainHue+rh+360)%360+', '+mainSat*rs+'%, '+mainBri*rb+'%)')
}

function randomizeMainColor() {
  mainHue = Math.floor(map(Math.random(),0,1,0,360))
  mainSat = Math.floor(map(Math.random(),0,1,0,100))
  mainBri = Math.floor(map(Math.random(),0,1,20,100))
}

var adress ='http://25.69.150.211:3003'//'http://[2a02:ed3:2da:d00:1114:1e92:c36:d35c]:3000'
function setup() {
  socket = io.connect(adress)
  randomizeMainColor()
  createCanvas(700, 700);
  view = createVector(width/2, height/2)
}

function draw() {
  socket.emit('intention', { 'intention': intention })
  socket.on('worldview', updateWorldview)
  function updateWorldview(fromServer) {
    fromServer.forEach(b => b.pos = createVector(b.pos.x, b.pos.y))
    worldview = fromServer
  }
  if (!worldview) return;
  background(relativeHsb(0,0.6,1))
  drawWorldEdge()
  mouseIntentifier()
  function shower(b) {
    return blobShower(p => camToView(worldview[0].pos, view, p), relativeHsb(b.hue,1,1),relativeHsb(b.hue,1,0.6), b)
  }
  [...worldview].sort((b2, b1) => b1.area - b2.area).forEach(shower)
  hideOverview()
}

var hider

function hideOverview() {
  let pink = relativeHsb(0, 0.43, 0.8)
  let d = pixelDensity();
  if (!hider) {    
    hider = createImage(width, height)
    hider.loadPixels()
    
    var length = 4*(d*width)*(d*height)
    for (let i = 0; i < length; i += 4) {
      var x = (i / 4) % (width * d)
      var y = (i / 4) / (width * d)
      
      hider.pixels[i] = red(pink)
      hider.pixels[i+1] = green(pink)
      hider.pixels[i+2] = blue(pink)
      if (createVector(x, y).sub(view).mag() < viewRadious)
        hider.pixels[i+3] = 0
      else
        hider.pixels[i+3] = 255
    }
    
    hider.updatePixels()
  }
  
  image(hider, 0, 0)
}

function mouseIntentifier() {
  var intentionVec = camToView(view, worldview[0].pos, createVector(mouseX, mouseY))
  intention = { x: intentionVec.x, y: intentionVec.y }
}

function drawWorldEdge() {
  var centerOfWorldOnView = camToView(worldview[0].pos, view, createVector(0,0))
  var diameter = 2 * worldRadious
  noFill()
  stroke(relativeHsb(0, 0.7, 0.6))
  
  ellipse(centerOfWorldOnView.x, centerOfWorldOnView.y, diameter, diameter)
}


function camToView(cam, view, pos) {
  return add(view, pos).sub(cam)
}

function blobShower(realToScrean, fillcolor, strokecolor, blob) {
  fill(fillcolor)
  stroke(strokecolor)
  var view = realToScrean(blob.pos)
  ellipse(view.x, view.y, sqrt(blob.area/PI)*2, sqrt(blob.area/PI)*2)
}

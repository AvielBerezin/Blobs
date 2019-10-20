var vec = require('./vector.js')

var express = require('express')

var synaptic = require('synaptic')

var app = express()
var server = app.listen(3003)
app.use(express.static('BlobsClient'))
console.log("server is running")

var socket = require('socket.io')

var io = socket(server)
io.sockets.on('connection', newConnection)

var serverBlobs = new Map()
var worldRadious = 600
var viewRadious = 250
var lowerIntentionBound = viewRadious * 0.2
var upperIntentionBound = viewRadious * 0.7

var eatingRatio = 0.8
var notFairRatio = 0.05
var suckingRatio = 0.6
var feedingRate = 0.002


function max(a, b) {
    if (a > b) return a
    return b
}
function min(a, b) {
    if (a < b) return a
    return b
}
function map(val, lowVal, highVal, lowRes, highRes) {
    return lowRes + (highRes-lowRes) * (val-lowVal) / (highVal-lowVal)
}

const feeder = (function(foodDeficit, previousTime) {
    return function() {
        var currentTime = Date.now()
        foodDeficit += (currentTime - previousTime) * feedingRate
        while (foodDeficit >= 1) {
            createNewFood(-Math.random())
            foodDeficit -= 1
        }
        previousTime = currentTime
    }
})(10, Date.now())

const aiIntentify = function() {
    var inputBlobs = 4

    var trainData = []

    var learningRate = 0.3

    var inputLayer = new synaptic.Layer(1+inputBlobs*3)
    var hidenLayer = new synaptic.Layer(inputBlobs*2)
    var outputLayer = new synaptic.Layer(2)

    inputLayer.project(hidenLayer)
    hidenLayer.project(outputLayer)

    var neuralNet = new synaptic.Network({
        input: inputLayer,
        hidden: [hidenLayer],
        output: outputLayer
    });

    trainData.forEach(function(entry) {
        neuralNet.activate(entry[0])
        neuralNet.propagate(learningRate, entry[1])
    })

    var standalone = neuralNet.standalone()

    return function(sb, id) {
        if (isNaN(id) || id > 0) return;
    
        var b0 = sb.worldview[0]
        var others = sb.worldview.slice(1, inputBlobs+1)
        function toData(b) {
            return [
                angleToData(vec.angle(vec.sub(b.pos, b0.pos))),
                distToData(vec.dist(b.pos, b0.pos)),
                areaToData(b.area)
            ]
        }
        function angleToData(a) { return map(a, -Math.PI,Math.PI, 0,1) }
        function distToData(d) { return map(d, 0,viewRadious*2, 0,1) }
        function areaToData(a) { return map(a, 0,viewRadious**2*Math.PI, 0,1) }
        function dataToAngle(d) { return map(d, 0,1, -Math.PI,Math.PI) }
        function dataToDist(d) { return map(d, 0,1, 0,viewRadious*2) }

        var data = others.map(toData).reduce((a,b)=>a.concat(b), [b0.area])
        while (data.length < 1+inputBlobs*3) {
            data.push(map(Math.random(),0,1,-Math.PI,Math.PI))
            data.push(viewRadious*2)
        }

        // console.log('ai with input length '+data.length+' of input '+data)
        var result = standalone(data)
        console.log('ai results '+result)
        sb.intention = vec.add(b0.pos, vec.fromAD(dataToAngle(result[0]), dataToDist(result[1])))
    }
}()

setInterval(updateBlobs, 10)
function updateBlobs() {
    serverBlobs.forEach(blobMover)
    function blobMover(sb) {
        var speedIntention = vec.dist(sb.intention, sb.worldview[0].pos)
        speedIntention = max(speedIntention, lowerIntentionBound)
        speedIntention = min(speedIntention, upperIntentionBound)
        var speed = map(speedIntention, lowerIntentionBound, upperIntentionBound, 0, 2)
        var velocity = vec.magTo(vec.sub(sb.intention, sb.worldview[0].pos), speed)
        vec.addTo(sb.worldview[0].pos, velocity)
        vec.limitTo(sb.worldview[0].pos, worldRadious)
    }
    serverBlobs.forEach(blobEater)
    function blobEater(sb1, id1) {
        serverBlobs.forEach(dualEater)
        function dualEater(sb2, id2) {
            if (id1 == id2) return;
            var b1 = sb1.worldview[0]
            var b2 = sb2.worldview[0]
            if (!eatable(b1, b2)) return;
            if (!suckable(b1, b2)) return;
            b1.hue = Math.round((b1.hue*b1.area + b2.hue*b2.area)/(b1.area+b2.area))
            b1.area += b2.area
            removePlayer(id2)
        }
    }
    function eatable(b1, b2) {
        return b1.area * eatingRatio > b2.area && b1.area * notFairRatio < b2.area
    }
    function suckable(b1, b2) {
        return vec.dist(b1.pos, b2.pos) - blobRadious(b1) < blobRadious(b2) * suckingRatio
    }
    feeder()
    serverBlobs.forEach(foodIntentify)
    function foodIntentify(sb, id) {
        if (isNaN(id) || id > 0) return;
        sb.intention = towardsClosestEatable()

        function towardsClosestEatable() {
            var blob = sb.worldview[0]
            var others = sb.worldview.slice(1)
            var eatableOthers = others.filter(b => eatable(blob, b))
            if (eatableOthers.length == 0) return blob.pos;
            var closestPos = eatableOthers.reduce(closerBlob).pos
            return vec.add(sb.worldview[0].pos, vec.magTo(vec.sub(closestPos, sb.worldview[0].pos), viewRadious));
            function closerBlob(b1, b2) {
                if (vec.dist(b1.pos, blob.pos) < vec.dist(b2.pos, blob.pos)) {
                    return b1
                }
                else {
                    return b2
                }
            }
        }
    }
    serverBlobs.forEach(killTheFat)
    function killTheFat(sb) {
        if (blobRadious(sb.worldview[0]) > viewRadious) {
            removePlayer(sb.id)
            console.log('blob was too fat '+sb.id)
        }
    }
    serverBlobs.forEach((sb, id) => updateWorldview(id))
    Array.from(serverBlobs.values()).filter(sb => isNaN(sb.id)).forEach(sendWorldviesToClients)
    function sendWorldviesToClients(sb) {
        sb.socket.emit('worldview', sb.worldview)
    }
}

function newConnection(socket) {
    console.log('new connection ' + socket.id)
    socket.on('intention', intentionMsg)
    function intentionMsg(intention) {
        if (!serverBlobs.get(socket.id)) {
            createNewPlayer(socket.id, socket)
        }
        if (vec.isVec(intention.intention)) {
            serverBlobs.get(socket.id).intention = vec.clone(intention.intention)
        }
    }
}

function blobRadious(b) {
    return Math.sqrt(b.area/Math.PI)
}

function blobsDistance(b1, b2) {
    return vec.dist(b1.pos, b2.pos)
}

function createNewPlayer(id, socket) {
    var clientBlob = new ClientBlob(randomPos(), map(Math.random(),0,1,2**7,2**8), Math.floor(360*Math.random()))
    var serverBlob = new ServerBlob(id, [clientBlob])
    serverBlob.socket = socket
    serverBlobs.set(id, serverBlob)
}
function createNewFood(id) {
    var clientBlob = new ClientBlob(randomPos(), map(Math.random(),0,1,2**4,2**8), Math.floor(360*Math.random()))
    serverBlobs.set(id, new ServerBlob(id, [clientBlob]))
}

function removePlayer(id) {
    serverBlobs.delete(id)
}

function updateWorldview(id) {
    if (!serverBlobs.has(id)) return;

    worldview = serverBlobs.get(id).worldview
    var mainblob = worldview[0]
    
    function visibleBlob(b) {
        return blobsDistance(mainblob, b)-blobRadious(b) < viewRadious
    }
    
    worldview.length = 1
    for (var [id_, sb] of serverBlobs) {
        if (id_ != id) {
            var blob = sb.worldview[0]
            if (visibleBlob(blob)) {
                worldview.push(blob)
            }
        }
    }

    return worldview
}

function randomPos() {
    var a = Math.random()*Math.PI*2
    var d = Math.sqrt(Math.random())*worldRadious
    return vec.fromAD(a, d)
}

function ServerBlob(id, worldview) {
    this.id = id
    this.worldview = worldview
    this.intention = worldview[0].pos
}

function ClientBlob(pos, area, hue) {
    this.pos = pos
    this.area = area
    this.hue = hue
}
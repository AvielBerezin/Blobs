const gen = require('random-seed');
const vec = require('vector.js');

const viewRadious = 250;

// const aiIntentify = function() {
//     var inputBlobs = 2

//     var data = fs.readFileSync('.\\BlobsProcessing\\BlobsTrainer\\training data.json')
//     var trainData = JSON.parse(data)
//     var learningRate = 0.1

//     var inputLayer = new synaptic.Layer(1+inputBlobs*3)
//     var hidenLayers = [
//         new synaptic.Layer(inputBlobs*4),
//         new synaptic.Layer(inputBlobs*3),
//         new synaptic.Layer(inputBlobs*2),
//         new synaptic.Layer(inputBlobs*1)
//     ]
//     var outputLayer = new synaptic.Layer(2)

//     inputLayer.project(hidenLayers[0])
//     for (var i = 0; i < 3; i++) hidenLayers[i].project(hidenLayers[i+1])
//     hidenLayers[3].project(outputLayer)

//     var neuralNet = new synaptic.Network({
//         input: inputLayer,
//         hidden: hidenLayers,
//         output: outputLayer
//     });

//     console.log("training started")
//     for (var i = 0; i < 2**23; i++) {
//         var entry = trainData[Math.floor(Math.random(trainData.length))]
//         neuralNet.activate(entry[0])
//         neuralNet.propagate(learningRate, entry[1])
//     }
//     console.log("training finished")

//     var standalone = neuralNet.standalone()

//     return function(sb, id) {
//         if (isNaN(id) || id > 0) return;
    
//         var b0 = sb.worldview[0]
//         var others = sb.worldview.slice(1, inputBlobs+1)
//         function toData(b) {
//             return [
//                 angleToData(vec.angle(vec.sub(b.pos, b0.pos))),
//                 distToData(vec.dist(b.pos, b0.pos)),
//                 areaToData(b.area)
//             ]
//         }
//         function angleToData(a) { return map(a, -Math.PI,Math.PI, 0,1) }
//         function distToData(d) { return map(d, 0,viewRadious*2, 0,1) }
//         function areaToData(a) { return map(a, 0,viewRadious**2*Math.PI, 0,1) }
//         function dataToAngle(d) { return map(d, 0,1, -Math.PI,Math.PI) }
//         function dataToDist(d) { return map(d, 0,1, 0,viewRadious*2) }

//         var data = others.map(toData).reduce((a,b)=>a.concat(b), [b0.area])
//         while (data.length < 1+inputBlobs*3) {
//             data.push(map(Math.random(),0,1,-Math.PI,Math.PI))
//             data.push(viewRadious*2)
//         }

//         var result = standalone(data)
//         sb.intention = vec.add(b0.pos, vec.fromAD(dataToAngle(result[0]), dataToDist(result[1])))
//     }
// }()

function botifyIntentifier(intentifier) {
    return function(...args) {
        if (isNaN(id) || id > 0) return;
        return intentifier(...args);
    }
}

function closestEatableIntentify(sb, id) {
    if (isNaN(id) || id > 0) return;
    sb.intention = towardsClosestEatable().pos

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

function wondererIntentify(sb, id) {
    sb.intention = randomIntention();
    function randomIntention() {
        var rand = gen(id);
        var angle = rand.floatBetween(-Math.PI,Math.PI);
        angle += Date.now()*rand()*Math.PI/100;
        return vec.add(sb.worldview[0].pos, vec.fromAD(angle, viewRadious));
    }
}

// TODO: more functions and functions combiners and stuff
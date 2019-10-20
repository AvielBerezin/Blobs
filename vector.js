function isVec(v) {
    if (!v) {
        return false;
    }
    if (!v.x && v.x != 0) {
        return false
    }
    if (!v.y && v.y != 0) {
        return false
    }
    return true
}
function clone(v) {
    return { x: v.x, y: v.y }
}
function add(v1, v2) {
    return {x: v1.x+v2.x, y: v1.y+v2.y}
}
function addTo(v1, v2) {
    v1.x += v2.x
    v1.y += v2.y
    return v1
}
function sub(v1, v2) {
    return { x: v1.x-v2.x, y: v1.y-v2.y }
}
function subTo(v1, v2) {
    v1.x -= v2.x
    v1.y -= v2.y
    return v1
}
function mult(v, s) {
    return {x: v.x*s, y: v.y*s}
}
function multTo(v, s) {
    v.x *= s
    v.y *= s
    return v
}
function div(v, s) {
    return {x: v.x/s, y: v.y/s}
}
function divTo(v, s) {
    v.x /= s
    v.y /= s
    return v
}
function cros(v1, v2) {
    return v1.x*v2.x + v1.y*v2.y
}
function magSq(v) {
    return cros(v, v)
}
function mag(v) {
    return Math.sqrt(magSq(v))
}
function angle(v) {
    var a = Math.atan(v.y/v.x)
    while (a < 0) a += Math.PI
    while (a > Math.PI) a -= Math.PI

    if (v.y < 0) a -= Math.PI
    return a
}
function norm(v) {
    return div(v, mag(v))
}
function normTo(v) {
    return divTo(v, mag(v))
}
function limit(v, s) {
    if (mag(v) > s) {
        return mult(norm(v), s)
    }
    return clone(v)
}
function limitTo(v, s) {
    if (mag(v) > s) {
        return multTo(normTo(v), s)
    }
    return v
}
function dist(v1, v2) {
    return mag(sub(v1, v2))
}
function fromXY(x_, y_) {
    return { x: x_, y: y_}
}
function fromAD(a, d) {
    return { x: Math.cos(a)*d, y: Math.sin(a)*d }
}
function rotate(v, a) {
    var s = Math.sin(a)
    var c = Math.cos(a)

    return { x: c*v.x - s*v.y, y: s*v.x + c*v.y }
}
function magTo(v, m) {
    if (m == 0) return multTo(v, 0)
    return multTo(v, m/mag(v))
}
function angleTo(v, a) {
    var m = mag(v)
    v.x = Math.cos(a)*x
    v.y = Math.sin(a)*y
    return v
}

module.exports.isVec = isVec
module.exports.clone = clone 
module.exports.add = add
module.exports.addTo = addTo
module.exports.sub = sub
module.exports.subTo = subTo
module.exports.mult = mult
module.exports.multTo = multTo
module.exports.div = div
module.exports.divTo = divTo
module.exports.cros = cros
module.exports.magSq = magSq
module.exports.mag = mag
module.exports.magTo = magTo
module.exports.dist = dist, 
module.exports.angle = angle
module.exports.angleTo = angleTo
module.exports.norm = norm
module.exports.normTo = normTo
module.exports.limit = limit
module.exports.limitTo = limitTo
module.exports.fromXY = fromXY
module.exports.fromAD = fromAD
module.exports.rotate = rotate
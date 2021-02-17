/**
 * A linear interpolator for hexadecimal colors
 * @param {String} a
 * @param {String} b
 * @param {Number} amount
 * @example
 * // return #7F7F7F
 * lerpColor('#000000','#ffffff', 0.5)
 * @returns {String}
 */
function lerpColor(a, b, amount) {
  var ah = parseInt(a.replace(/#/g, ""), 16),
    ar = ah >> 16,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ""), 16),
    br = bh >> 16,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return (
    "#" + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1)
  );
}

function lerpColorRGB(a, b, amount) {
  return hexToRGB(this.lerpColor(a, b, amount));
}

/**
 * @param {String} hex
 * @example
 * hexToRGB("#0033ff")
 * @returns {Object}
 */
function hexToRGB(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function interpolateColor(c1, c2, amount) {
  var result = [...c1];
  for (var i = 0; i < 3; i++) {
    result[i] = result[i] + amount * (c2[i] - c1[i]);
  }
  return result;
}

function interpolateGradient(grad, amount) {
  if (grad.length <= 1) return grad[0];
  if (grad.length == 2) return interpolateColor(grad[0], grad[1], amount);
  if (amount >= 1) return grad[grad.length - 1];
  // split evenly
  let split = 1 / (grad.length - 1);
  let start = Math.floor(amount / split);
  let newAmount = (amount - start * split) / split;
  //console.log(start, start + 1, newAmount);
  return interpolateColor(grad[start], grad[start + 1], newAmount);
}

export {
  lerpColor,
  lerpColorRGB,
  hexToRGB,
  interpolateColor,
  interpolateGradient
};

export const greyscale = [
  [0, 0, 0],
  [255, 255, 255]
];
export const invertedgreyscale = [
  [255, 255, 255],
  [0, 0, 0]
];
export const cividis = [
  [255, 234, 70],
  [135, 132, 121],
  [0, 32, 77]
];
export const viridis = [
  [68, 1, 84],
  [72, 36, 117],
  [65, 68, 135],
  [53, 95, 141],
  [42, 120, 142],
  [33, 144, 141],
  [34, 168, 132],
  [66, 190, 113],
  [112, 209, 81],
  [189, 223, 38],
  [189, 223, 38]
].reverse();
export const inferno = [
  [0, 0, 4],
  [22, 11, 57],
  [66, 10, 104],
  [106, 23, 110],
  [147, 38, 103],
  [186, 54, 85],
  [221, 81, 58],
  [243, 118, 27],
  [252, 165, 10],
  [246, 215, 70],
  [246, 215, 70]
].reverse();
export const spectral = [
  [158, 1, 66],
  [209, 59, 75],
  [240, 112, 74],
  [252, 171, 99],
  [254, 220, 140],
  [251, 248, 176],
  [224, 243, 161],
  [170, 221, 162],
  [105, 189, 169],
  [66, 136, 181],
  [66, 136, 181]
];

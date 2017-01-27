import _first from 'lodash/first';
import _isNumber from 'lodash/isNumber';
import _last from 'lodash/last';
import _without from 'lodash/without';

import { mapInRange, revToRad } from './utils';

export const CurveType = {
  Polygon: 'Polygon',
  Star: 'Star',
  Ellipse: 'Ellipse',
  Other: 'Other',
};

export function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export class Point {

  /**
   * @constructor
   * @param {Number} [x]
   * @param {Number} [y]
   */
  constructor(x = 0, y) {
    this.x = Math.round(x);
    this.y = Math.round(y || x);
  }

  /**
   * Get the Point that is `radius` distance from this point at `angle`
   *
   * @param {number} angle
   * @param {number|Point} radius
   * @returns {Point}
   */
  getRelativePoint(angle, radius) {
    const dist = (_isNumber(radius)) ? new Point(radius) : radius;
    const xDistance = Math.cos(revToRad(angle)) * dist.x;
    const yDistance = Math.sin(revToRad(angle)) * dist.y;
    return new Point(
      this.x + xDistance,
      this.y + yDistance
    );
  }

  /**
   * Create a new point with the same coordinates
   * @returns {Point}
   */
  clone() {
    return new Point(this.x, this.y);
  }

  /**
   * Compare to another Point-like object
   * @param {Point} p2
   * @returns {boolean}
   */
  equals(p2) {
    if (p2.x !== undefined && p2.y !== undefined) {
      return p2.x === this.x && p2.y === this.y;
    }
    return false;
  }

  /**
   * Create a string in the form `(x, y)`
   * @returns {string}
   */
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

export class Line {
  /**
   * @constructor
   * @param {Point} start
   * @param {Point} end
   */
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  /**
   * Returns an array of `resolution` points evenly spaced along this line,
   * excluding points in `excluded`.
   *
   * @param {number} resolution - The number of intermediate points to include
   * @param {Point[]} excluded - Points to skip
   * @returns {Point[]}
   */
  getPoints(resolution, excluded = []) {
    const rangeX = this.end.x - this.start.x;
    const rangeY = this.end.y - this.start.y;
    const stepX = rangeX / resolution;
    const stepY = rangeY / resolution;

    const range = mapInRange(resolution, (stepNum) => {
      const x = this.start.x + (stepNum * stepX);
      const y = this.start.y + (stepNum * stepY);
      return new Point(x, y);
    });

    return _without(range, ...excluded);
  }

  toString() {
    return `${this.start} -> ${this.end}`;
  }
}

export class Color {

  constructor(red = 0, green = 0, blue = 0, alpha = 1) {
    this.red = red;
    this.grn = green;
    this.blu = blue;
    this.alf = alpha;
  }

  rgbaStr() {
    return rgba(this.red, this.grn, this.blu, this.alf);
  }

  clone() {
    return new Color(this.red, this.grn, this.blu, this.alf);
  }

  toString() {
    return `Color (${this.red}, ${this.grn}, ${this.blu}, ${this.alf})`;
  }

  /**
   * Scale this Color closer to rgba(0,0,0,0) by `factor`
   * @param {number} factor
   * @returns {Color}
   */
  scaleDown(factor) {
    this.red = Math.round(this.red / factor);
    this.grn = Math.round(this.grn / factor);
    this.blu = Math.round(this.blu / factor);
    this.alf /= factor;
    return this;
  }

  /**
   * Get the "distance" to `otherColor` in each dimension
   * @param {Color} otherColor
   * @returns {Color}
   */
  distanceTo(otherColor) {
    const rDist = otherColor.red - this.red;
    const gDist = otherColor.grn - this.grn;
    const bDist = otherColor.blu - this.blu;
    const aDist = otherColor.alf - this.alf;
    return new Color(rDist, gDist, bDist, aDist);
  }

  /**
   * Get the array of all the colors between this and `otherColor`
   * @param {Color} otherColor
   * @param {number} resolution
   * @returns {Color[]}
   */
  stepsToward(otherColor, resolution) {
    const colors = [];
    const colorStep = this.distanceTo(otherColor).scaleDown(resolution);

    // Handle all the colors between the start and end
    for (let i = 1; i < resolution; i++) {
      const red = this.red + (colorStep.red * i);
      const green = this.grn + (colorStep.grn * i);
      const blue = this.blu + (colorStep.blu * i);
      const alpha = this.alf + (colorStep.alf * i);
      colors.push(new Color(red, green, blue, alpha));
    }
    colors.unshift(this.clone());
    colors.push(otherColor.clone());
    return colors;
  }
}

export class Spectrum {

  constructor(...args) {
    // TODO: test plotting through more than 2 initial colors

    debugger;
    this._colors = Array.from(args) || [];
    this._nextIndex = 0;
  }

  clone() {
    return new Spectrum(this._colors.map(color => color.clone()));
  }

  /**
   * Get the first color in this Spectrum
   * @returns {Color}
   */
  firstColor() {
    return _first(this._colors);
  }

  /**
   * Get the last color in this Spectrum
   * @returns {Color}
   */
  lastColor() {
    return _last(this._colors);
  }

  /**
   * Get the next color in the sequence.
   * Will repeat through colors if _nextIndex is greater
   * than the number of colors.
   * @returns {Color}
   */
  nextColor() {
    const next = this._colors[this._nextIndex % this._colors.length];
    this._nextIndex += 1;
    return next;
  }

  /**
   * Add `resolution` colors between each existing color in the spectrum
   * @param {number} resolution
   * @returns {Spectrum}
   */
  segmentColors(resolution) {
    if (this._colors.length < 2) {
      // You can't segment a single color
      return this;
    }

    const start = this.firstColor();
    const end = this.lastColor();
    this._colors = start.stepsToward(end, resolution);

    return this;
  }

  reverse() {
    // Reverse the spectrum
    this._colors.reverse();
    this._nextIndex = 0;
    return this;
  }
}

export class CurveConfig {

  /**
   * @constructor
   * @param {number} numVertices
   * @param {number} resolution
   * @param {number} layerCount
   * @param {number} layerSepFactor
   * @param {number} width
   * @param {number} height
   * @param {Point} center
   * @param {number} startAngle
   * @param {boolean} showSpines
   * @param {Spectrum} spectrum
   * @param {string} curveType
   */
  constructor({
    numVertices = 4,
    resolution = 2,
    layerCount = 1,
    layerSepFactor = 1,
    width = 800,
    height = 800,
    center = new Point(400, 400),
    startAngle = 0,
    showSpines = false,
    spectrum = new Spectrum(new Color()),
  }, curveType) {
    this.curveType = curveType;
    this.numVertices = numVertices;
    this.resolution = resolution;
    this.layerCount = layerCount;
    this.layerSepFactor = layerSepFactor;
    this.width = width;
    this.height = height;
    this.center = center.clone();
    this.startAngle = startAngle;
    this.showSpines = showSpines;
    this.spectrum = spectrum.clone();
    this.points = null;
  }

}

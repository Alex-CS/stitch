import _first from 'lodash/first';
import _flatten from 'lodash/flatten';
import _floor from 'lodash/floor';
import _forEach from 'lodash/forEach';
import _isNumber from 'lodash/isNumber';
import _last from 'lodash/last';
import _round from 'lodash/round';
import _without from 'lodash/without';
import _uniq from 'lodash/uniq';

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
  constructor(x = 0, y = 0) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  static get origin() {
    if (!Point._origin) {
      Point._origin = new Point(0);
    }
    return Point._origin;
  }

  /**
   * Get the Point that is `radius` distance from this point at `angle`
   *
   * @param {number} angle
   * @param {number|Object} radius
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

    const range = mapInRange(1, resolution + 1, (stepNum) => {
      const x = this.start.x + (stepNum * stepX);
      const y = this.start.y + (stepNum * stepY);
      return new Point(x, y);
    });

    return _without(range, ...excluded);
  }

  toString() {
    return `${this.start}->${this.end}`;
  }
}

export class Group {

  /**
   * An arbitrary collection of Points or Lines that all share attributes
   * @constructor
   * @param {Point[]|Line[]} [members]
   * @param {Object} [attributes]
   */
  constructor(members = [], attributes = {}) {
    this.members = Array.from(members);
    this._attributes = Object.assign({}, attributes);
  }

  get attributes() {
    return Object.assign({}, this._attributes);
  }

  set attributes(newAttributes) {
    _forEach(newAttributes, (value, key) => {
      this.setAttr(key, value);
    });
  }

  get size() {
    return this.members.length;
  }

  /**
   * Set an attribute to all members
   * @param {String} attrName
   * @param {*} attrValue
   */
  setAttr(attrName, attrValue) {
    this._attributes[attrName] = attrValue;
    // this.members.forEach((member) => {
    //   member[attrName] = attrValue;
    // });
  }

  forEach(callback) {
    this.members.forEach(callback);
  }

  map(callback) {
    return new Group(this.members.map(callback), this.attributes);
  }

  toString() {
    return 'Group';
  }

  /**
   * Create a Group from an array
   * @param {Array} array
   * @returns {Group}
   */
  static from(array) {
    return new Group(array);
  }

  /**
   * Turn an array of arrays into an array of Groups
   * @param {Array[]} arrays
   * @return {Group[]}
   */
  static fromEach(arrays) {
    return arrays.map(array => Group.from(array));
  }
}

export class Color {

  constructor(red = 0, green = 0, blue = 0, alpha = 1) {
    this.red = red;
    this.grn = green;
    this.blu = blue;
    this.alf = alpha;
  }

  toRGBAString() {
    return `rgba(${this.red},${this.grn},${this.blu},${this.alf})`;
  }

  clone() {
    return new Color(this.red, this.grn, this.blu, this.alf);
  }

  toString() {
    return `Color (${this.red},${this.grn},${this.blu},${this.alf})`;
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
    const colorStep = this.distanceTo(otherColor).scaleDown(resolution);

    // Handle all the colors between the start and end
    const colors = mapInRange(1, resolution, (i) => {
      const red = this.red + (colorStep.red * i);
      const green = this.grn + (colorStep.grn * i);
      const blue = this.blu + (colorStep.blu * i);
      const alpha = this.alf + (colorStep.alf * i);
      return new Color(red, green, blue, alpha);
    });
    colors.unshift(this.clone());
    colors.push(otherColor.clone());
    return colors;
  }
}

export class Spectrum {

  constructor(color1, color2) {
    // TODO: test plotting through more than 2 initial colors

    this._colors = [color1, color2 || color1] || [new Color(0, 0, 0)];
    this._nextIndex = 0;
  }

  clone() {
    return new Spectrum(...this._colors.map(color => color.clone()));
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
   * Will repeat through colors if `_nextIndex` is greater
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

  toString() {
    return `Spectrum [${this._colors}]`;
  }
}


export class BaseCurve {

  defaults = {
    numVertices: 4,
    resolution: 2,
    layerCount: 1,
    layerSepFactor: 1,
    width: 800,
    height: 800,
    center: { x: 400, y: 400 },
    rotation: 0,
    showSpines: false,
    spectrum: new Spectrum(new Color()),
  };

  /**
   * @constructor
   * @param {number} [numVertices] The number of vertices in this shape
   * @param {number} [resolution] The number of points per spine
   * @param {number} [layerCount] The number of layers to draw
   * @param {number} [layerSepFactor] How many points to separate each layer by
   * @param {number} [width] The size in the x dimension
   * @param {number} [height] The size in the y dimension
   * @param {Point} [center] The point to center the curve on
   * @param {number} [rotation] The rotation angle of the shape
   * @param {boolean} [showSpines] Whether to render the spines with the curve
   * @param {Spectrum} [spectrum] The spectrum of colors to go through
   * @param {string} [curveType]
   */
  constructor({
    numVertices = 4,
    resolution = 2,
    layerCount = 1,
    layerSepFactor = 1,
    width = 800,
    height = 800,
    center = new Point(400, 400),
    rotation = 0,
    showSpines = false,
    spectrum = new Spectrum(new Color()),
  }, curveType = CurveType.Other) {
    this.curveType = curveType;
    this.numVertices = numVertices;
    this.resolution = resolution;
    this.layerCount = layerCount;
    this.layerSepFactor = layerSepFactor;
    this.width = width;
    this.height = height;
    this.center = center;
    this.rotation = rotation;
    this.showSpines = showSpines;
    this.spectrum = spectrum.clone();
    this.points = null;
  }

  /**
   * The radial distance from the center in the x and y dimensions
   * @returns {{x: number, y: number}}
   */
  get radius() {
    if (!this._radius) {
      this._radius = {
        x: this.width / 2,
        y: this.height / 2,
      };
    }
    return this._radius;
  }

  /**
   * Do all the work of stitching the spines together
   *
   * @returns {Group}
   */
  stitch() {
    const { resolution, layerCount, layerSepFactor } = this;
    const spines = this.getSpines();
    const spectrum = this.spectrum.segmentColors(layerCount);

    this.points = this.points || this.getAllPoints(spines);

    // Layering constant
    // TODO: tweak this
    const layerRatio = _floor(resolution / layerCount) * layerSepFactor;

    const layers = Group.fromEach(this.getLayers(this.points, layerRatio));
    layers.forEach((layer) => {
      const nextColor = spectrum.nextColor();
      if (nextColor && nextColor.toRGBAString) {
        layer.setAttr('stroke', nextColor.toRGBAString());
      }
    });
    if (this.showSpines) {
      const spineGroup = Group.from(spines);
      spineGroup.setAttr('stroke', rgba(0, 0, 0, 1));
      layers.unshift(spineGroup);
    }
    return Group.from(layers);
  }

  // Methods that need to be implemented by children
  /* eslint-disable no-unused-vars */

  /**
   * Get each layer
   *
   * @param {Point[]} points
   * @param {Number} layerRatio
   * @return {Line[][]}
   */
  getLayers(points, layerRatio) {
    throw Error('This must be implemented in a child class');
  }

  /**
   * Get all the points along each spine in an array of them
   *
   * @abstract
   * @param {Line[]|Line[][]} spines
   * @returns {Point[]}
   */
  getAllPoints(spines) {
    throw Error('This must be implemented in a child class');
  }

  /**
   * The "spines" between which the curve will be stitched
   * @abstract
   * @returns {Line[]}
   */
  getSpines() {
    throw Error('This must be implemented in a child class');
  }

  /* eslint-enable no-unused-vars */

}

class BaseInwardCurve extends BaseCurve {

  /**
   * Draw a line from each Point in `points` to the one `separation` ahead of it.
   *
   * @private
   * @param {Point[]} points
   * @param {number} separation
   * @returns {Line[]}
   */
  _followCurve(points, separation) {
    const len = points.length;
    return points.map((pointB, i) => {
      const indexA = ((len - separation) + i) % len;
      const pointA = points[indexA];
      return new Line(pointA, pointB);
    });
  }

  /**
   * "Stitch" a continuous curve between the list of lines given,
   * with `resolution` points per line, and a given number of points of `separation`
   *
   * @param {Point[]} points
   * @param {number} resolution
   * @param {number} [separation]
   * @returns {Line[]}
   */
  _stitchInward(points, resolution, separation = 0) {
    const followDistance = _round(resolution + separation + 1);
    return this._followCurve(points, followDistance);
  }

  /**
   * TODO
   *
   * @param {Point[]} points
   * @param {Number} layerRatio
   * @returns {Line[][]}
   */
  getLayers(points, layerRatio) {
    const { resolution, layerCount } = this;
    return mapInRange(this.layerCount, (i) => {
      // TODO: figure out & explain this math
      const layerNum = layerCount - i;
      const separation = (layerNum * layerRatio) % points.length;
      return this._stitchInward(points, resolution, separation / 2);
    });
  }

  /**
   * Get all the points along each spine in an array of them
   *
   * @param {Line[]} spines
   * @returns {Point[]}
   */
  getAllPoints(spines) {
    const nestedPoints = spines.map(
      spine => spine.getPoints(this.resolution)
    );
    return _uniq(_flatten(nestedPoints));
  }
}

export class PolygonCurve extends BaseInwardCurve {

  constructor(config) {
    super(config, CurveType.Polygon);
  }

  /**
   * Get the edges of the polygon
   * @return {Line[]}
   */
  getSpines() {
    const vertCount = this.numVertices;
    const vertices = [Point.origin.getRelativePoint(0, this.radius)];

    const spines = mapInRange(1, vertCount, (i) => {
      const point = Point.origin.getRelativePoint(i / vertCount, this.radius);
      vertices.push(point);
      return new Line(vertices[i - 1], point);
    });

    spines.push(new Line(vertices[vertices.length - 1], vertices[0]));

    return spines;
  }
}

export class StarCurve extends BaseCurve {

  constructor(config) {
    super(config, CurveType.Star);
  }

  /**
   * Given 2 equal-sized arrays of points, connect them (draw lines) in order.
   *
   * @private
   * @param {Point[]} spineA
   * @param {Point[]} spineB
   * @param {number} shave
   * @returns {Line[]}
   */
  _bridgeSpines(spineA, spineB, shave) {
    // console.info(`spineA: ${spineA}, spineB: ${spineB}, shave: ${shave}`);
    const maxIndex = spineA.length - shave - 1;
    if (spineA.length !== spineB.length) {
      return [];
    }
    const _connectPointsByIndex = (i) => {
      const a = spineA[maxIndex - i];
      const b = spineB[i];
      return new Line(a, b);
    };
    const lines = mapInRange(maxIndex + 1, _connectPointsByIndex);
    // console.info(`_bridgeSpines:\n ${lines.map(line => `  ${line}\n`)}`);
    return lines;
  }

  /**
   * "Stitch" a curve between the given arrays of points,
   * not using the `shave` number of points at the end (used for layering)
   *
   * @param {Point[][]} points
   * @param {Number} shave
   * @returns {Line[]}
   */
  _stitchOutward(points, shave) {
    const connectAlongSpine = (spineA, i) => {
      const spineB = points[(i + 1) % points.length];
      return this._bridgeSpines(spineA, spineB, _round(shave));
    };

    const lines = _flatten(points.map(connectAlongSpine));
    // console.info(`_stitchOutward:\n ${lines.map(line => `  ${line}\n`)}`);
    return lines;
  }

  /**
   *
   * @param {Point[][]} points
   * @param {Number} layerRatio
   * @return {Line[][]}
   */
  getLayers(points, layerRatio) {
    const { resolution, layerCount } = this;
    const layers = mapInRange(layerCount, (i) => {
      // TODO: figure out & explain this math
      const shave = (i * layerRatio) % resolution/* (3 / 4)*/;
      return this._stitchOutward(points, shave);
    });
    return layers;
  }

  getSpines() {
    // TODO: explain why this is different than rect
    const starPointNum = this.numVertices;

    // rotate through all the angles drawing a spine for each
    return mapInRange(starPointNum, (i) => {
      const tipPoint = Point.origin.getRelativePoint(i / starPointNum, this.radius);

      return new Line(Point.origin, tipPoint);
    });
  }

  getAllPoints(spines) {
    return spines.map(
      spine => spine.getPoints(this.resolution, [Point.origin])
    );
  }
}

export class EllipseCurve extends BaseInwardCurve {

  constructor(config) {
    super(config, CurveType.Ellipse);
  }

  getSpines() {
    const vertices = [Point.origin.getRelativePoint(0, this.radius)];
    const vertCount = this.resolution * this.numVertices;

    const spines = mapInRange(vertCount, (i) => {
      const point = Point.origin.getRelativePoint(i / vertCount, this.radius);
      const spine = new Line(vertices[i - 1], point);
      vertices.push(point);
      return spine;
    });
    spines.push(new Line(_last(vertices), _first(vertices)));

    this.points = vertices;

    return new Group(spines);
  }
}

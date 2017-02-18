import first from 'lodash/first';
import flatten from 'lodash/flatten';
import floor from 'lodash/floor';
import last from 'lodash/last';
import round from 'lodash/round';
import uniq from 'lodash/uniq';

import { mapInRange } from '../utils';
import { rgba } from './Color';
import Group from './Group';
import Line from './Line';
import Point from './Point';
import Spectrum from './Spectrum';

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
    spectrum: [],
  };

  /**
   * @constructor
   * @param {number} [numVertices] - The number of vertices in this shape
   * @param {number} [resolution] - The number of points per spine
   * @param {number} [layerCount] - The number of layers to draw
   * @param {number} [layerSepFactor] - How many points to separate each layer by
   * @param {number} [width] - The size in the x dimension
   * @param {number} [height] - The size in the y dimension
   * @param {number} [rotation] - The rotation angle of the shape
   * @param {boolean} [showSpines] - Whether to render the spines with the curve
   * @param {Point|{x: number, y: number}} [center] - The point to center the curve on
   * @param {Color[]} [colors] - The colors to create a spectrum between
   */
  constructor({
    numVertices = 4,
    resolution = 2,
    layerCount = 1,
    layerSepFactor = 1,
    width = 800,
    height = 800,
    center = null,
    rotation = 0,
    showSpines = false,
    colors = [],
  }) {
    this.numVertices = numVertices;
    this.resolution = resolution;
    this.layerCount = layerCount;
    this.layerSepFactor = layerSepFactor;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.showSpines = showSpines;
    this.spectrum = new Spectrum(...colors);
    this.center = center ? Point.from(center) : Point.from(this.radius);
    this.points = null;
  }

  /**
   * The radial distance from the center in the x and y dimensions
   * @property
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
    const layerRatio = floor((resolution / layerCount) * layerSepFactor);

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
   * @param {number} layerRatio
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

export class BaseInwardCurve extends BaseCurve {

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
    const followDistance = round(resolution + separation + 1);
    return this._followCurve(points, followDistance);
  }

  /**
   * TODO
   *
   * @param {Point[]} points
   * @param {number} layerRatio
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
    return uniq(flatten(nestedPoints));
  }
}

export class PolygonCurve extends BaseInwardCurve {

  /**
   * Get the edges of the polygon
   * @return {Line[]}
   */
  getSpines() {
    const { numVertices } = this;
    const vertices = [Point.origin.getRelativePoint(0, this.radius)];

    const spines = mapInRange(1, numVertices, (i) => {
      const point = Point.origin.getRelativePoint(i / numVertices, this.radius);
      vertices.push(point);
      return new Line(vertices[i - 1], point);
    });

    spines.push(new Line(vertices[vertices.length - 1], vertices[0]));

    return spines;
  }
}

export class StarCurve extends BaseCurve {

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
   * @param {number} shave
   * @returns {Line[]}
   */
  _stitchOutward(points, shave) {
    const connectAlongSpine = (spineA, i) => {
      const spineB = points[(i + 1) % points.length];
      return this._bridgeSpines(spineA, spineB, round(shave));
    };

    const lines = flatten(points.map(connectAlongSpine));
    // console.info(`_stitchOutward:\n ${lines.map(line => `  ${line}\n`)}`);
    return lines;
  }

  /**
   *
   * @param {Point[][]} points
   * @param {number} layerRatio
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
    const { numVertices } = this;

    // rotate through all the angles drawing a spine for each
    return mapInRange(numVertices, (i) => {
      const tipPoint = Point.origin.getRelativePoint(i / numVertices, this.radius);

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

  getSpines() {
    const vertices = [Point.origin.getRelativePoint(0, this.radius)];
    const vertCount = this.resolution * this.numVertices;

    const spines = mapInRange(1, vertCount, (i) => {
      const point = Point.origin.getRelativePoint(i / vertCount, this.radius);
      const spine = new Line(vertices[i - 1], point);
      vertices.push(point);
      return spine;
    });
    spines.push(new Line(last(vertices), first(vertices)));

    this.points = vertices;

    return spines;
  }
}

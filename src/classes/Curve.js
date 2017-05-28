import flatten from 'lodash/flatten';
import floor from 'lodash/floor';
import round from 'lodash/round';
import uniq from 'lodash/uniq';

import { CURVE_TYPES } from '../constants';
import { mapInRange } from '../utils';
import Group from './Group';
import Line from './Line';
import Point from './Point';

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
   * @param {number} numVertices - The number of vertices in this shape
   * @param {number} resolution - The number of points per spine
   * @param {number} width - The size in the x dimension
   * @param {number} height - The size in the y dimension
   * @param {Point|{x: number, y: number}} [center] - The point to center the curve on
   * @param {number} [layerCount] - The number of layers to draw
   * @param {number} [layerSepFactor] - How many points to separate each layer by
   * @param {number} [rotation] - The rotation angle of the shape
   * @param {boolean} [showSpines] - Whether to render the spines with the curve
   */
  constructor({
    numVertices,
    resolution,
    width,
    height,
    center = null,
    layerCount = 1,
    layerSepFactor = 1,
    rotation = 0,
    showSpines = false,
  }) {
    this.numVertices = numVertices;
    this.resolution = resolution;
    this.layerCount = layerCount;
    this.layerSepFactor = layerSepFactor;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.showSpines = showSpines;
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
    console.time(`${this.constructor.name}#stitch()`);
    const { resolution, layerCount, layerSepFactor } = this;
    const spines = this.getSpines();

    this.points = this.points || this.getAllPoints(spines);

    // Layering constant
    // TODO: tweak this
    const layerRatio = floor((resolution / layerCount) * layerSepFactor);

    const layers = this.getLayers(this.points, layerRatio);
    if (this.showSpines) {
      layers.unshift(spines);
    }
    console.timeEnd(`${this.constructor.name}#stitch()`);
    return Group.from(layers);
  }

  /**
   * Get a point relative to the center of the shape
   *
   * @param {number} rotation - The rotation of the point
   * @return {Point}
   */
  getSpinePoint(rotation) {
    return this.center.getRelativePoint(rotation, this.radius);
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
   * @param {Point[]} points - The points to connect
   * @param {number} separation - How many points to separate by
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
   *
   * @param {Point[]} points - The points to connect
   * @param {number} resolution - The number of points to create per line
   * @param {number} [separation] - How many points to separate by
   * @returns {Line[]}
   */
  _stitchInward(points, resolution, separation = 0) {
    const followDistance = round(resolution + separation + 1);
    return this._followCurve(points, followDistance);
  }

  /**
   * Get the layers of the curve
   *
   * @param {Point[]} points - The points in the curve
   * @param {number} layerRatio - How much to separate each layer by
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
   * Divide each spine into `this.resolution` points
   *
   * @param {Line[]} spines - The lines that define the backbone of the curve
   * @returns {Point[]}
   */
  getAllPoints(spines) {
    const nestedPoints = spines.map(
      spine => spine.getPoints(this.resolution),
    );
    return uniq(flatten(nestedPoints));
  }
}

export class PolygonCurve extends BaseInwardCurve {

  /**
   * Get the edges of the polygon
   *
   * @return {Line[]}
   */
  getSpines() {
    const { numVertices } = this;
    const vertices = mapInRange(numVertices,
      i => this.getSpinePoint(i / numVertices),
    );

    return vertices.map(
      (vertex, i) => new Line(vertex, vertices[(i + 1) % numVertices]),
    );
  }
}

export class EllipseCurve extends BaseInwardCurve {

  getSpines() {
    const pointCount = this.resolution * this.numVertices;
    this.points = mapInRange(pointCount,
      i => this.getSpinePoint(i / pointCount),
    );

    return this.points.map(
      (point, i) => new Line(point, this.points[(i + 1) % pointCount]),
    );
  }
}

export class BaseOutwardCurve extends BaseCurve {

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
      const shave = ((i + 1) * layerRatio) % resolution/* (3 / 4)*/;
      return this._stitchOutward(points, shave);
    });
    return layers;
  }

  getAllPoints(spines) {
    return spines.map(
      spine => spine.getPoints(this.resolution, [this.center]),
    );
  }

}

export class StarCurve extends BaseOutwardCurve {

  getSpines() {
    // TODO: explain why this is different than rect
    const { numVertices } = this;

    // rotate through all the angles drawing a spine for each
    return mapInRange(numVertices, (i) => {
      const tipPoint = this.getSpinePoint(i / numVertices);

      return new Line(this.center, tipPoint);
    });
  }
}

export function makeCurve(curveType, options) {
  switch (curveType) {
    case CURVE_TYPES.Elli:
      return new EllipseCurve(options);
    case CURVE_TYPES.Star:
      return new StarCurve(options);
    case CURVE_TYPES.Poly:
    default:
      return new PolygonCurve(options);
  }
}

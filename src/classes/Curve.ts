import _flatten from 'lodash/flatten';
import _floor from 'lodash/floor';
import _round from 'lodash/round';
import _uniq from 'lodash/uniq';

import { CURVE_TYPES } from '@/constants';
import {
  type Pair,
} from '@/types/utility';
import {
  mapInRange,
} from '@/utils';

import Group from './Group';
import Line from './Line';
import Point, { type PointLike } from './Point';


export interface ICurveOptions {
  numVertices: number;
  resolution: number;
  width: number;
  height: number;
  center: Point | null;
  layerCount: number;
  layerSepFactor: number;
  rotation: number;
  showSpines: boolean;
}
export type ICurveOptionsStrict = ICurveOptions & { center: Point };

export type Curve = BaseCurve<Point[] | Point[][]>;
export type LinePair = Pair<Line>;
type Spine = Point[];
type SpinePair = Pair<Spine>;

/**
 * Reorder the lines for aesthetics.
 *
 * Order the lines to make all stitches roughly the same length.
 * In practice, where L1 and L2 are the correctly-ordered output lines, we want:
 * - L1's `end` should be closer to L2's `start`
 * - The distance between the two lines' `start` points should be roughly equal
 *   to the distance between their `end` points (or at least closer than it would've been for any alternate arrangement)
 *
 * NOTE: This could probably be tweaked to also work for parallel mode if that's ever desired
 *
 * @param {LinePair} linePair
 * @returns {LinePair} A modified line pair, or the original if no change was needed
 */
export function arrangeLines(linePair: LinePair): {
  lines: LinePair,
  intersectPoint: Point | null,
} {
  const intersectPoint = Line.getIntersectionPoint(...linePair);

  // If the lines are parallel, just assume they're already in the order that the user intends
  if (intersectPoint === null) {
    return { lines: linePair, intersectPoint };
  }
  const [lineA, lineB] = linePair;
  const closerEndOfA = intersectPoint.closest(lineA.end, lineA.start); // `end` is first because if they're equidistant, `closest` will preference whichever is first
  const closerEndOfB = intersectPoint.closest(lineB.start, lineB.end);

  if (closerEndOfA === lineA.end && closerEndOfB === lineB.start) {
    return { lines: linePair, intersectPoint };
  }

  // Flip A if its `start` is closer to the intersection
  // Flip B if its `end` is closer to the intersection
  const newA = closerEndOfA === lineA.start ? Line.inverseOf(lineA) : lineA;
  const newB = closerEndOfB === lineB.end ? Line.inverseOf(lineB) : lineB;

  return { lines: [newA, newB], intersectPoint };
}

/**
 * Get the stitch endpoints along each line
 * @param {LinePair} linePair
 * @param {number} resolution
 * @returns {SpinePair}
 */
function getSpinePoints(linePair: LinePair, resolution: number): SpinePair {
  const { lines: [lineA, lineB], intersectPoint } = arrangeLines(linePair);
  const includeClosest = !intersectPoint || !lineA.goesThrough(intersectPoint);

  const spineAPoints: Point[] = lineA.getPoints(resolution, {
    includeStart: true,
    includeEnd: includeClosest,
  });
  const spineBPoints: Point[] = lineB.getPoints(resolution, {
    includeStart: includeClosest,
    includeEnd: true,
  });

  return [spineAPoints, spineBPoints];
}

/**
 * Given two Spines, create the Lines stitching between them
 * @param {Spine} spineA
 * @param {Spine} spineB
 * @returns {Line[]}
 */
function connectSpines(spineA: Spine, spineB: Spine): Line[] {
  return spineA.map((pointA, index) => (
    new Line(pointA, spineB[index])
  ));
}

/**
 * Given two lines, stitch them together
 * @param {LinePair} spineLines
 * @param {number} resolution
 * @returns {Line[]}
 */
export function stitch(spineLines: LinePair, resolution: number): Line[] {

  // Get `resolution` points along each line
  const [spineA, spineB] = getSpinePoints(spineLines, resolution);

  // Connect the points between two spineLines
  return connectSpines(spineA, spineB);
}


/**
 * @property {number} numVertices - The number of vertices in this shape
 * @property {number} resolution - The number of points per spine
 * @property {number} width - The size in the x dimension
 * @property {number} height - The size in the y dimension
 * @property {PointLike} [center] - The point to center the curve on
 * @property {number} [layerCount] - The number of layers to draw
 * @property {number} [layerSepFactor] - How many points to separate each layer by
 * @property {number} [rotation] - The rotation angle of the shape
 * @property {boolean} [showSpines] - Whether to render the spines with the curve
 *
 * @property {PointLike} radius - The radial distance from the center in the x and y dimensions
 */
export class BaseCurve<PointList extends Point[] | Point[][]> {
  // TODO: actually use these defaults for something
  static defaults = {
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

  numVertices: number;
  resolution: number;
  layerCount: number;
  layerSepFactor: number;
  width: number;
  height: number;
  rotation: number;
  showSpines: boolean;
  center: Point;
  radius: PointLike;

  // Note: having `points` as a property may be a bigger headache than just passing it through the few places needed
  protected points: PointList | null;

  /**
   * @constructor
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
  }: ICurveOptions) {
    this.numVertices = numVertices;
    this.resolution = resolution;
    this.layerCount = layerCount;
    this.layerSepFactor = layerSepFactor;
    this.width = width;
    this.height = height;
    this.radius = {
      x: this.width / 2,
      y: this.height / 2,
    };
    this.rotation = rotation;
    this.showSpines = showSpines;
    this.center = Point.from(center ?? this.radius);

    this.points = null;
  }

  /**
   * Do all the work of stitching the spines together
   *
   * @returns {Group}
   */
  stitch(): Group<Line[]> {
    console.time(`${this.constructor.name}#stitch()`);
    const { resolution, layerCount, layerSepFactor } = this;
    const spines = this.getSpines();

    if (this.points === null) {
      this.points = this.getAllPoints(spines);
    }

    // Layering constant
    // TODO: tweak this
    const layerRatio = _floor((resolution / layerCount) * layerSepFactor);

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
  protected getSpinePoint(rotation: number): Point {
    return this.center.getRelativePoint(rotation, this.radius);
  }

  // Methods that need to be implemented by children
  /* eslint-disable @typescript-eslint/no-unused-vars */

  /**
   * Get each layer
   *
   * @param {Point[] | Point[][]} points
   * @param {number} layerRatio
   * @return {Line[][]}
   */
  protected getLayers(points: PointList, layerRatio: number): Line[][] {
    throw Error('This must be implemented in a child class');
  }

  /**
   * Get all the points along each spine in an array of them
   *
   * @abstract
   * @param {Line[]|Line[][]} spines
   * @returns {Point[] | Point[][]}
   */
  protected getAllPoints(spines: Line[] | Line[][]): PointList {
    throw Error('This must be implemented in a child class');
  }

  /**
   * The "spines" between which the curve will be stitched
   * @abstract
   * @returns {Line[]}
   */
  protected getSpines(): Line[] {
    throw Error('This must be implemented in a child class');
  }

  /* eslint-enable @typescript-eslint/no-unused-vars */

}

/**
 * Any curve where the spines are an enclosed shape. The stitching then occurs within that shape
 */
export class BaseInwardCurve extends BaseCurve<Point[]> {

  /**
   * Draw a line from each Point in `points` to the one `separation` ahead of it.
   *
   * @private
   * @param {Point[]} points - The points to connect
   * @param {number} separation - How many points to separate by
   * @returns {Line[]}
   */
  private followCurve(points: Point[], separation: number): Line[] {
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
  private stitchInward(points: Point[], resolution: number, separation = 0): Line[] {
    const followDistance = _round(resolution + separation + 1);
    return this.followCurve(points, followDistance);
  }

  /**
   * Get the layers of the curve
   *
   * @param {Point[]} points - The points in the curve
   * @param {number} layerRatio - How much to separate each layer by
   * @returns {Line[][]}
   */
  protected getLayers(points: Point[], layerRatio: number): Line[][] {
    const { resolution, layerCount } = this;
    return mapInRange(this.layerCount, (i) => {
      // TODO: figure out & explain this math
      const layerNum = layerCount - i;
      const separation = (layerNum * layerRatio) % points.length;
      return this.stitchInward(points, resolution, separation / 2);
    });
  }

  /**
   * Divide each spine into `this.resolution` points
   *
   * @param {Line[]} spines - The lines that define the backbone of the curve
   * @returns {Point[]}
   */
  protected getAllPoints(spines: Line[]): Point[] {
    const nestedPoints = spines.map(
      spine => spine.getPoints(this.resolution),
    );
    return _uniq(_flatten(nestedPoints));
  }
}

export class PolygonCurve extends BaseInwardCurve {

  /**
   * Get the edges of the polygon
   *
   * @return {Line[]}
   */
  protected getSpines() {
    const { numVertices } = this;
    const vertices = mapInRange(numVertices,
      i => this.getSpinePoint(i / numVertices),
    );

    return vertices.map((vertex, i) => (
      new Line(vertex, vertices[(i + 1) % numVertices])
    ));
  }
}

export class EllipseCurve extends BaseInwardCurve {

  /**
   * Get all the points around the perimeter to use as "spines"
   *
   * @return {Line[]}
   */
  protected getSpines() {
    const pointCount = this.resolution * this.numVertices;
    this.points = mapInRange(pointCount,
      i => this.getSpinePoint(i / pointCount),
    );

    return this.points.map((point, i, points) => (
      new Line(point, points[(i + 1) % pointCount])
    ));
  }
}

/**
 * Any curve where the spines radiate outward from the center and aren't enclosed
 */
export class BaseOutwardCurve extends BaseCurve<Point[][]> {

  /**
   * Given 2 equal-sized arrays of points, connect them (draw lines) in order.
   *
   * @private
   * @param {Point[]} spineA
   * @param {Point[]} spineB
   * @param {number} shave
   * @returns {Line[]}
   */
  private bridgeSpines(spineA: Point[], spineB: Point[], shave: number): Line[] {
    // console.info(`spineA: ${spineA}, spineB: ${spineB}, shave: ${shave}`);
    const maxIndex = spineA.length - shave - 1;
    if (spineA.length !== spineB.length) {
      return [];
    }

    // Connect the dots between the two spines,
    // stepping backwards through `spineA` and forwards through `spineB`
    // NOTE: This reverse order might be the biggest difference between inward & outward curves?
    const lines = mapInRange(maxIndex + 1, function connectPointsByIndex(i) {
      const a = spineA[maxIndex - i];
      const b = spineB[i];
      return new Line(a, b);
    });
    // console.info(`bridgeSpines:\n ${lines.map(line => `  ${line}\n`)}`);
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
  private stitchOutward(points: Point[][], shave: number): Line[] {
    const connectAlongSpine = (spineA: Point[], i: number) => {
      const spineB = points[(i + 1) % points.length];
      return this.bridgeSpines(spineA, spineB, _round(shave));
    };

    const lines = _flatten(points.map(connectAlongSpine));
    // console.info(`stitchOutward:\n ${lines.map(line => `  ${line}\n`)}`);
    return lines;
  }

  /**
   *
   * @param {Point[][]} points
   * @param {number} layerRatio
   * @return {Line[][]}
   */
  protected getLayers(points: Point[][], layerRatio: number): Line[][] {
    const { resolution, layerCount } = this;
    const layers = mapInRange(layerCount, (i) => {
      // TODO: figure out & explain this math
      const shave = ((i + 1) * layerRatio) % resolution/* (3 / 4)*/;
      return this.stitchOutward(points, shave);
    });
    return layers;
  }

  protected getAllPoints(spines: Line[]): Point[][] {
    return spines.map((spine) => (
      // @ts-ignore TODO: fix this
      spine.getPoints(this.resolution, [this.center])
    ));
  }

}

export class StarCurve extends BaseOutwardCurve {

  protected getSpines(): Line[] {
    // TODO: explain why this is different than rect
    const { numVertices } = this;

    // rotate through all the angles drawing a spine for each
    return mapInRange(numVertices, (i) => {
      const tipPoint = this.getSpinePoint(i / numVertices);

      return new Line(this.center, tipPoint);
    });
  }
}

// TODO: There's probably a way for Typescript to be aware of specifically which class is returned
export function makeCurve(curveType: string, options: ICurveOptions): Curve {
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

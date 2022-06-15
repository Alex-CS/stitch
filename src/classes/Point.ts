import _isNumber from 'lodash/isNumber';

import {
  RADIANS_PER_TURN,
} from '@/constants';


export type PointLike = Point | { x: number, y: number };

export default class Point {
  x: number;
  y: number;

  /**
   * @constructor
   * @param {number} [x]
   * @param {number} [y]
   */
  constructor(x = 0, y = 0) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  // Static methods -----------------------------------------------------------

  /**
   * Create a new point from a point-like object
   *
   * @param {PointLike} pointLike - Any object with x and y properties
   */
  static from(pointLike: PointLike): Point {
    const { x, y } = pointLike;
    return new Point(x, y);
  }

  /**
   * Determine if a given object is functionally a point
   * @param candidate
   * @returns {candidate is PointLike}
   */
  static isPointLike(candidate: any): candidate is PointLike {
    return _isNumber(candidate?.x) && _isNumber(candidate?.y);
  }

  /**
   * Determine if two points occupy the same coordinates
   * @param pointA
   * @param pointB
   * @returns {boolean}
   */
  static areEqual(pointA: PointLike | any, pointB: PointLike | any): boolean {
    if (Point.isPointLike(pointA) && Point.isPointLike(pointB)) {
      return pointA.x === pointB.x
        && pointA.y === pointB.y;
    }
    return false;
  }

  // Instance methods ---------------------------------------------------------

  /**
   * Get the Point that is `radius` distance from this point at `rotation`
   *
   * Imagine that `radius` defines an ellipse centered on this point.
   * This method gives you the point on the ellipse which is `rotation` revolutions
   * _clockwise_ of the _"3:00"_ point on the ellipse.
   *
   * - Why clockwise of 3:00?
   *   In the JS coordinate system, `(0, 0)` is the top-left corner of the page.
   *   Which means that the positive-x/positive-y quadrant is down and to the right (aka 3:00-6:00)
   *
   * @param {number} rotation - The proportion of one full turn, i.e. `0.5` is 180 degrees TODO: "revolutions" might be a better term for this
   * @param {number|PointLike} radius - pass a number for circular rotation or a `PointLike` for elliptical
   * @return {Point}
   */
  getRelativePoint(rotation: number, radius: number | PointLike): Point {
    const scale = Point.isPointLike(radius) ? radius : { x: radius, y: radius };
    const angle = rotation * RADIANS_PER_TURN;
    const xDistance = Math.cos(angle) * scale.x;
    const yDistance = Math.sin(angle) * scale.y;
    return new Point(
      this.x + xDistance,
      this.y + yDistance,
    );
  }

  /**
   * Create a new point with the same coordinates
   * @returns {Point}
   */
  clone(): Point {
    return Point.from(this);
  }

  /**
   * Compare to another Point-like object
   * @param {PointLike} p2 - The other point
   * @returns {boolean}
   */
  equals(p2: PointLike): boolean {
    return Point.areEqual(this, p2);
  }

  /**
   * Create a string in the form `(x, y)`
   * @returns {string}
   */
  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

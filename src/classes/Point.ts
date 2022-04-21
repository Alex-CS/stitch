import _isUndefined from 'lodash/isUndefined';

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
   * Get the (0,0) point
   *
   * @return {Point}
   */
  static get origin(): Point {
    return new Point(0, 0);
  }

  static isPointLike(candidate: any): candidate is PointLike {
    return !_isUndefined(candidate?.x) && !_isUndefined(candidate?.y);
  }

  static areEqual(pointA: PointLike | any, pointB: PointLike | any): boolean {
    if (Point.isPointLike(pointA) && Point.isPointLike(pointB)) {
      return pointA.x === pointB.x
        && pointA.y === pointB.y;
    }
    return false;
  }

  static distance(pointA: PointLike, pointB: PointLike): number {
    const xDist = Math.abs(pointB.x - pointA.x);
    const yDist = Math.abs(pointB.y - pointA.y);

    return Math.sqrt(xDist ** 2 + yDist ** 2);
  }

  /**
   * Get the Point that is `radius` distance from this point at `rotation`
   *
   * @param {number} rotation - The proportion of one full turn, i.e. `0.5` is 180 degrees TODO: "revolutions" might be a better term for this
   * @param {number|PointLike} radius - pass a number for circular rotation or a `PointLike` for elliptical
   * @TODO: consider removing or spinning out the PointLike behavior?
   * @return {Point}
   */
  getRelativePoint(rotation: number, radius: number | PointLike): Point {
    const dist = Point.isPointLike(radius) ? radius : new Point(radius, radius);
    const angle = rotation * RADIANS_PER_TURN;
    const xDistance = Math.cos(angle) * dist.x;
    const yDistance = Math.sin(angle) * dist.y;
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

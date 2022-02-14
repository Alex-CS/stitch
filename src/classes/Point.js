import isNumber from 'lodash/isNumber';
import isUndefined from 'lodash/isUndefined';

import {
  RADIANS_PER_TURN,
} from '@/constants';


export default class Point {

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
   * @param {Point|{x: number, y: number}} pointLike - Any object with x and y properties
   */
  static from(pointLike) {
    const { x, y } = pointLike;
    return new Point(x, y);
  }

  /**
   * Get the (0,0) point
   *
   * @return {Point}
   */
  static get origin() {
    return new Point(0, 0);
  }

  /**
   * Get the Point that is `radius` distance from this point at `rotation`
   *
   * @param {number} rotation - The proportion of one full turn
   * @param {number|{x: number, y: number}} radius
   * @returns {Point}
   */
  getRelativePoint(rotation, radius = 0) {
    const dist = !isNumber(radius) ? radius : new Point(radius, radius);
    const angle = rotation * RADIANS_PER_TURN;
    const xDistance = Math.cos(angle) * dist.x;
    const yDistance = Math.sin(angle) * dist.y;
    return new Point(
      this.x + xDistance,
      this.y + yDistance,
    );
  }

  /**
   * Move the point
   *
   * @param {number} [x] - How much to move it horizontally
   * @param {number} [y] - How much to move it vertically
   * @return {Point} - The point after translation (for chaining)
   */
  translate(x = 0, y = 0) {
    this.x = this.x + x;
    this.y = this.y + y;
    return this;
  }

  /**
   * Create a new point with the same coordinates
   * @returns {Point}
   */
  clone() {
    return Point.from(this);
  }

  /**
   * Compare to another Point-like object
   * @param {Point|{x: number, y: number}} p2 - The other point
   * @returns {boolean}
   */
  equals(p2) {
    if (p2 && !isUndefined(p2.x) && !isUndefined(p2.y)) {
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

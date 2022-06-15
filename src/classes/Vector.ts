import {
  type PointLike,
} from './Point';


/**
 * A Vector is essentially a geometric offset. It's like a Point,
 * but intended for indicating _direction_ and _magnitude_ rather than position
 */
export default class Vector {
  x: number;
  y: number;

  constructor({ x, y }: { x: number, y: number }) {
    this.x = x;
    this.y = y;
  }

  // Static methods -----------------------------------------------------------

  /**
   * Get the Vector from one point to another
   * @param {PointLike} tail
   * @param {PointLike} tip
   * @returns {Vector}
   */
  static between(tail: PointLike, tip: PointLike): Vector {
    return new Vector({
      x: tip.x - tail.x,
      y: tip.y - tail.y,
    });
  }

  // Getters ------------------------------------------------------------------

  /**
   * The vector's y-delta relative to its x-delta
   * @returns {number}
   */
  get slope(): number {
    return this.y / this.x;
  }

  // Instance methods ---------------------------------------------------------
}

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

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Static methods -----------------------------------------------------------

  /**
   * Get the Vector from one point to another
   * @param {PointLike} startPoint
   * @param {PointLike} endPoint
   * @returns {Vector}
   */
  static between(startPoint: PointLike, endPoint: PointLike): Vector {
    return new Vector(
      endPoint.x - startPoint.x,
      endPoint.y - startPoint.y,
    );
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

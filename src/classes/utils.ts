import {
  type PointLike,
} from '.';


/**
 * Get the absolute distance between two points
 * @param {PointLike} pointA
 * @param {PointLike} pointB
 * @returns {number}
 */
export function distance(pointA: PointLike, pointB: PointLike): number {
  const xDist = pointB.x - pointA.x;
  const yDist = pointB.y - pointA.y;

  return Math.hypot(xDist, yDist); // Math.sqrt(xDist ** 2 + yDist ** 2);
}

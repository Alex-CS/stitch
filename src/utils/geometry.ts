import {
  type PointLike,
} from '@/classes';


/**
 * Get the average between any number of points
 * @param {PointLike} points
 * @return {PointLike}
 */
export function averagePoint(...points: PointLike[]): PointLike {
  const midPoint = { x: 0, y: 0 };
  points.forEach(({ x, y }) => {
    midPoint.x += x;
    midPoint.y += y;
  });
  midPoint.x /= points.length;
  midPoint.y /= points.length;

  return midPoint;
}

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

/**
 * Round a PointLike object's coordinates to integers
 * @param {PointLike} rawPoint
 * @return {PointLike}
 */
export function roundCoordinates(rawPoint: PointLike): PointLike {
  return {
    x: Math.round(rawPoint.x),
    y: Math.round(rawPoint.y),
  };
}

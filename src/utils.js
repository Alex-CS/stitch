import _flatten from 'lodash/flatten';
import _isNumber from 'lodash/isNumber';
import _range from 'lodash/range';
import _without from 'lodash/without';
import _uniq from 'lodash/uniq';

import { CurveType, Point } from './classes';


// Calculated constants
export const root2 = Math.sqrt(2);
export const root3 = Math.sqrt(3);
export const CENTER = new Point(0, 0);

/**
 * Build an array by running `callback` for each number from `start` to `end`
 *
 * @param {number} start - The number to start from
 * @param {number} end - The number to iterate up to (not including)
 * @param {Function} callback - The function to run on each number
 * @returns {Array}
 */
export function mapInRange(start, callback, end) {
  return _range(start, end).map(callback);
}

/**
 * Converts a number of revolutions into radians (1 rev = 2pi radians)
 *
 * @param {number} rev
 * @returns {number}
 */
export function revToRad(rev) {
  return 2 * Math.PI * rev;
}

/**
 * Get the Point that is `radius` distance from `center` at `angle`
 *
 * @param {number} angle
 * @param {number|Point} radius
 * @param {Point} center
 * @returns {Point}
 */
export function getPositions(angle, radius, center = CENTER) {
  const dist = (_isNumber(radius)) ? { x: radius, y: radius } : radius;
  return new Point(
    center.x + (Math.cos(revToRad(angle)) * dist.x),
    center.y + (Math.sin(revToRad(angle)) * dist.y)
  );
}

/**
 * Rotates a Two.Polygon about a point, "orbiting" that point.
 *
 * Derived from this example: http://code.tutsplus.com/tutorials/drawing-with-twojs--net-32024
 * @param {Point} cen - The point to rotate about
 * @param {Two.Polygon} poly - The polygon to rotate
 * @param {number} angle - The angle to rotate by
 * @param {number} radius
 */
export function rotateAbout(cen, poly, angle, radius) {
  // TODO: extend Two.Polygon with this
  poly.rotation = (poly.rotation + angle) % (2 * Math.PI);
  var pos = getPositions(poly.rotation, radius, cen);
  poly.translation.x = cen.x + (pos.x / 2);
  poly.translation.y = cen.y + (pos.y / 2);
}

/**
 * Take a Two.Vector positioned relative to center,
 * and change it to be relative to top-left corner
 *
 * @param {Point} point
 * @param trans
 */
export function decenter(point, trans) {
  // TODO: extend Two.Vector with this
  return point.clone().set(trans.x - point.x, trans.y + point.y);
}

/**
 * Returns an array of `resolution` points evenly spaced along `line`,
 * excluding points in `excluded`.
 *
 * @param {Two.Polygon} line
 * @param {number} resolution - The number of intermediate points to include
 * @param {Point[]} excluded - Points to skip
 * @returns {Point[]}
 */
export function getPoints(line, resolution, excluded = []) {
  // TODO: test with Polygons
  // TODO: extend Two.Polygon with this

  const vertexA = line.startPoint;
  const vertexB = line.endPoint;
  const rangeX = vertexB.x - vertexA.x;
  const rangeY = vertexB.y - vertexA.y;
  const stepX = rangeX / resolution;
  const stepY = rangeY / resolution;

  const range = mapInRange((stepNum) => {
    const x = vertexA.x + (stepNum * stepX);
    const y = vertexA.y + (stepNum * stepY);
    const curPoint = new Point(x, y);
    // plot(curPoint);
    return curPoint;
  });

  return _without(range, ...excluded);
}

/**
 * Get all the points along each spine in an array of them
 *
 * @param {Two.Polygon[]} spines
 * @param {object} opts
 * @returns {Array}
 */
export function getAllPoints(spines, opts) {
  if (opts.curveType === CurveType.Star) {
    return spines.map(
      spine => getPoints(spine, opts.resolution, [CENTER])
    );
  }
  const nestedPoints = spines.map(
    spine => getPoints(spine, opts.resolution)
  );
  return _uniq(_flatten(nestedPoints));
}

import _flatten from 'lodash/flatten';
import _isFunction from 'lodash/isFunction';
import _range from 'lodash/range';
import _uniq from 'lodash/uniq';

import { CurveType, Point } from './classes';

/**
 * Build an array by running `callback` for each number from `start` to `end`
 * If the second argument is a function, the first argument is used as `end`
 *
 * @param {number} [start] - The number to start from
 * @param {number} end - The number to iterate up to (not including)
 * @param {Function} callback - The function to run on each number
 * @returns {Array}
 */
export function mapInRange(start, end, callback) {
  if (_isFunction(end)) {
    return _range(start).map(end);
  }
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
  var pos = cen.getRelativePoint(poly.rotation, radius);
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
 * Get all the points along each spine in an array of them
 *
 * @param {Line[]} spines
 * @param {Curve} opts
 * @returns {Point[]}
 */
export function getAllPoints(spines, opts) {
  if (opts.curveType === CurveType.Star) {
    return spines.map(
      spine => spine.getPoints(opts.resolution, [Point.origin])
    );
  }
  const nestedPoints = spines.map(
    spine => spine.getPoints(opts.resolution)
  );
  return _uniq(_flatten(nestedPoints));
}

import _isFunction from 'lodash/isFunction';
import _range from 'lodash/range';


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

// TODO: keeping this here just as an example for the math
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
  const pos = cen.getRelativePoint(poly.rotation, radius);
  poly.translation.x = cen.x + (pos.x / 2);
  poly.translation.y = cen.y + (pos.y / 2);
}

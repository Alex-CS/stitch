import _isFunction from 'lodash/isFunction';
import _range from 'lodash/range';


type ArrayIteratorCallback<ItemType, ResultType> = (
  value: ItemType,
  index: number,
  array: ItemType[]
) => ResultType;

/**
 * Build an array by running `callback` for each number from `start` to `end`
 * If the second argument is a function, the first argument is used as `end`
 *
 * @param {number} [start] - The number to start from
 * @param {number} end - The number to iterate up to (not including)
 * @param {Function} callback - The function to run on each number
 * @returns {Array}
 */
export function mapInRange<ResultItem>(
  start: number,
  end: number | ArrayIteratorCallback<number, ResultItem>,
  callback?: ArrayIteratorCallback<number, ResultItem>,
): ResultItem[] {
  if (_isFunction(end)) {
    return _range(start).map(end);
  }
  if (_isFunction(callback)) {
    return _range(start, end).map(callback);
  }
  throw TypeError('callback must be provided as either the second or third argument');
}

/**
 * Rotates a Two.Polygon about a point, "orbiting" that point.
 * TODO: keeping this here just as an example for the math
 *
 * Derived from this example: http://code.tutsplus.com/tutorials/drawing-with-twojs--net-32024
 * @param {Point} cen - The point to rotate about
 * @param {Two.Polygon} poly - The polygon to rotate
 * @param {number} angle - The angle to rotate by
 * @param {number} radius
 */
// export function rotateAbout(cen, poly, angle, radius) {
//   poly.rotation = (poly.rotation + angle) % (2 * Math.PI);
//   const pos = cen.getRelativePoint(poly.rotation, radius);
//   poly.translation.x = cen.x + (pos.x / 2);
//   poly.translation.y = cen.y + (pos.y / 2);
// }

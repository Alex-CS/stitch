import _isFunction from 'lodash/isFunction';
import _isNumber from 'lodash/isNumber';
import _partition from 'lodash/partition';
import _range from 'lodash/range';

import {
  type Pair,
} from '@/types/utility';


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
 * Given two items, determine which one matches a given function and which doesn't.
 * If neither or both of them match, this will just return an empty array
 *
 * Note: Use this when:
 *     (a) you've got exactly two items,
 *     (b) there's some condition you can use to differentiate between them,
 *     (c) you need both the matching and the non-matching one
 *     If any of the above AREN'T true, there's better approaches (with clearer names)
 *
 * @template Item
 * @param {Pair<Item>} items
 * @param {(item: Item) => boolean} matchFn
 * @returns {Pair<Item | null>}
 */
export function differentiate<Item>(
  items: Pair<Item>,
  matchFn: (item: Item) => boolean,
): Pair<Item> | readonly [] {
  const [matches, nonmatches] = _partition(items, matchFn);

  // Only get results if there's exactly one match and one non-match
  if (matches.length === 1 && nonmatches.length === 1) {
    return [matches[0], nonmatches[0]];
  }
  return [];
}

/**
 * Checks if `value` falls within the inclusive `lower` and `upper` bounds.
 * If `lower` is greater than `upper`, the bounds will be swapped.
 *
 * @param {number} value - The value to test
 * @param {Object|number} bounds - The upper bound or an object defining both bounds
 * @param {number} bounds.upper - The upper bound
 * @param {number} [bounds.lower=0] - The lower bound. Defaults to 0 if not provided
 */
export function inBounds(
  value: number,
  bounds: { lower: number, upper: number } | number,
): boolean {
  // Default `upper` to `bounds` if that's a number, and `lower` to 0 if not provided
  const { upper, lower = 0 } = _isNumber(bounds) ? { upper: bounds } : bounds;
  //Flip the bounds if they wouldn't overlap
  const [lowerBound, upperBound] = lower > upper ? [upper, lower] : [lower, upper];

  return lowerBound <= value && value <= upperBound;
}

/**
 * Get an index that is "looped around" if it falls outside a given `length`.
 * @param {number} length
 * @param {number} rawIndex
 * @returns {number}
 */
export function getLoopedIndex(length: number, rawIndex: number): number {
  if (!Number.isInteger(length)) {
    throw TypeError(`length must be an integer! got ${length}`);
  }
  if (!Number.isInteger(rawIndex)) {
    throw TypeError(`rawIndex must be an integer! got ${rawIndex}`);
  }

  return (length + rawIndex) % length;
}

/**
 * Get a version of `getLoopedIndex` with `length` baked in
 * @param {number} length
 * @returns {(rawIndex: number) => number}
 */
export function makeIndexLooper(length: number): (rawIndex: number) => number {
  return (rawIndex: number) => getLoopedIndex(length, rawIndex);
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

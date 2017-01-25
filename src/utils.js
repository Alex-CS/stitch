import _first from 'lodash/first';
import _last from 'lodash/last';
import _some from 'lodash/some';

import { CurveType, Point } from './classes';

// Math shortcuts
export const round = Math.round;
export const floor = Math.floor;
export const sqrt = Math.sqrt;
export const pi = Math.PI;

// Calculated constants
export const root2 = sqrt(2);
export const root3 = sqrt(3);
export const CENTER = new Point(0, 0);

/**
 * Converts a number of revolutions into radians (1 rev = 2pi radians)
 * @param {number} rev
 * @returns {number}
 */
export function revToRad(rev) {
  return 2 * pi * rev;
}

/**
 * Get the Point that is `radius` distance from `center` at `angle`
 * @param {number} angle
 * @param {number|Point} radius
 * @param {Point} center
 * @returns {Point}
 */
export function getPositions(angle, radius, center = CENTER) {
  radius = (typeof radius === 'number') ? { x: radius, y: radius } : radius;
  return new Point(
    center.x + (Math.cos(revToRad(angle)) * radius.x),
    center.y + (Math.sin(revToRad(angle)) * radius.y)
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
  poly.rotation = (poly.rotation + angle) % (2 * pi);
  var pos = getPositions(poly.rotation, radius, cen);
  poly.translation.x = cen.x + (pos.x / 2);
  poly.translation.y = cen.y + (pos.y / 2);
}

export function pointStr(vector) {
  // TODO: extend Two.Vector with this
  return `(${vector.x}, ${vector.y})`;
}

export function decenter(point, trans) {
  // Take a Two.Vector positioned relative to center,
  // and change it to be relative to top-left corner
  // TODO: extend Two.Vector with this
  return point.clone().set(trans.x - point.x, trans.y + point.y);
}

export function getPoints(line, resolution, excluded) {
  // Returns an array of `resolution` points
  // evenly spaced along `line`, excluding points in `excluded`.
  // TODO: test with Polygons
  // TODO: extend Two.Polygon with this
  var points = [];

  var vertexA = line.startPoint,
    vertexB = line.endPoint,
    rangeX = vertexB.x - vertexA.x,
    rangeY = vertexB.y - vertexA.y,
    stepX = rangeX / resolution,
    stepY = rangeY / resolution;

  for (var stepNum = 0; stepNum <= resolution; stepNum++) {
    var curX = vertexA.x + stepNum * stepX,
      curY = vertexA.y + stepNum * stepY,
      curPoint = new Point(curX, curY);
    // plot(curPoint);
    points.push(curPoint);
  }

  // Remove excluded points
  points = points.filter(function (point) {
    return !_some(excluded, function (exPoint) {
      return exPoint.equals(point);
    });
  });

  return points;
}

export function getAllPoints(spines, opts) {
  var points = [];

  for (var i = 0; i < spines.length; i++) {
    var excluded,
      newPoints;
    if (opts.curveType === CurveType.Star) {
      excluded = [CENTER];
      newPoints = getPoints(spines[i], opts.resolution, excluded);
      points.push(newPoints);
    } else {
      excluded = (points.length > 1) ? [_first(points), _last(
          points)] : [];
      newPoints = getPoints(spines[i], opts.resolution, excluded);
      points = points.concat(newPoints);
    }
  }

  return points;
}

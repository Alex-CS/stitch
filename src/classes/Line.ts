import {
  mapInRange,
} from '@/utils';

import Point, { type PointLike } from './Point';
import {
  distance,
} from './utils';
import Vector from './Vector';


export interface LineLike {
  start: PointLike,
  end: PointLike,
}

export interface EndpointInclusion {
  includeStart: boolean,
  includeEnd: boolean,
}

export default class Line {
  start: Point;
  end: Point;

  /**
   * @constructor
   * @param {Point} start
   * @param {Point} end
   */
  constructor(start: Point, end: Point) {
    this.start = start;
    this.end = end;
  }

  // Static methods -----------------------------------------------------------

  /**
   * Create a new line from a line-like object
   *
   * @param {LineLike} line - Any object with point-like `start` and `end` properties
   */
  static from(line: LineLike): Line {
    return new Line(
      Point.precise(line.start.x, line.start.y),
      Point.precise(line.end.x, line.end.y),
    );
  }

  /**
   * Determine if a given object is functionally a line
   * @param candidate
   * @returns {candidate is LineLike}
   */
  static isLineLike(candidate: any): candidate is LineLike {
    return Point.isPointLike(candidate?.start)
      && Point.isPointLike(candidate?.end);
  }

  /**
   * Determine if two lines start and end at the same points
   * @param {LineLike} lineA
   * @param {LineLike} lineB
   * @returns {boolean}
   */
  static areEqual(lineA: LineLike, lineB: LineLike): boolean {
    if (!Line.isLineLike(lineA) || !Line.isLineLike(lineB)) {
      return false;
    }

    // `lineA.start` is either endpoint of `lineB` AND `lineA.end` is the other one
    return (Point.areEqual(lineA.start, lineB.start) && Point.areEqual(lineA.end, lineB.end))
      || (Point.areEqual(lineA.start, lineB.end) && Point.areEqual(lineA.end, lineB.start));
  }

  /**
   * Get a new Line with the start and end points swapped
   * @param {LineLike} line
   * @returns {Line}
   */
  static inverseOf(line: LineLike): Line {
    return Line.from({
      start: line.end,
      end: line.start,
    });
  }

  /**
   * Get the point where two lines would intersect if both were to extend that far
   * @param {Line} lineA
   * @param {Line} lineB
   * @returns {Point|null} the intersection point, if it exists
   */
  static getIntersectionPoint(lineA: Line, lineB: Line): Point | null {
    const spanA = lineA.span;
    const spanB = lineB.span;

    const divisor = (spanA.x * spanB.y) - (spanA.y * spanB.x);

    // The lines will be parallel in this case
    if (divisor === 0) {
      return null;
    }
    // The delta between the two start points
    const startSpan = Vector.between(lineB.start, lineA.start);

    const totalA = spanB.x * startSpan.y - spanB.y * startSpan.x;
    const scaledPositionAlongA = totalA / divisor;

    const x = lineA.start.x + (scaledPositionAlongA * spanA.x);
    const y = lineA.start.y + (scaledPositionAlongA * spanA.y);

    return Point.precise(x, y);
  }

  // Getters ------------------------------------------------------------------

  /**
   * Get the Vector between the start and end points of this line
   * @returns {Vector}
   */
  get span(): Vector {
    // TODO: this should probably be cached rather than created every time
    return Vector.between(this.start, this.end);
  }

  /**
   * Get the distance between the start and end points
   * @returns {number}
   */
  get length(): number {
    return distance(this.start, this.end);
  }

  // Instance methods ---------------------------------------------------------

  /**
   * Determine if a given point is along this line
   * @param {Point} point
   * @returns {boolean}
   */
  goesThrough(point: PointLike | null): boolean {
    if (!Point.isPointLike(point)) {
      return false;
    }
    const distanceFromStart = distance(point, this.start);
    const distanceFromEnd = distance(point, this.end);

    // If the sum of the distances from the two endpoints is the same as the length of the line,
    // the point must be somewhere along the line
    return this.length === (distanceFromStart + distanceFromEnd);
  }

  /**
   * Returns an array of `segmentCount` points evenly spaced along this line,
   * excluding points in `excluded`.
   *
   * @param {number} segmentCount - The number of segments to split the line into
   * @param {EndpointInclusion} config?
   * @returns {Point[]}
   */
  getPoints(segmentCount: number, config: Partial<EndpointInclusion> = {}): Point[] {
    const range = this.span;
    const stepX = range.x / segmentCount;
    const stepY = range.y / segmentCount;

    // Get the points in-between the two ends
    const points = mapInRange(1, segmentCount, (stepIndex) => {
      const x = this.start.x + (stepIndex * stepX);
      const y = this.start.y + (stepIndex * stepY);
      return Point.precise(x, y);
    });

    // Add the necessary endpoints
    const { includeStart = true, includeEnd = false } = config;
    if (includeStart) points.unshift(this.start);
    if (includeEnd) points.push(this.end);

    return points;
  }

  toString(): string {
    return `${this.start}->${this.end}`;
  }
}

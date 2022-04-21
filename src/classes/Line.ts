import _without from 'lodash/without';

import { mapInRange } from '@/utils';

import Point, { type PointLike } from './Point';


export interface LineLike {
  start: PointLike,
  end: PointLike,
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
    return new Line(Point.from(line.start), Point.from(line.end));
  }

  /**
   * Determine if a given object is functionally a line
   * @param candidate
   * @returns {candidate is LineLike}
   */
  static isLineLike(candidate: any): candidate is LineLike {
    return Point.isPointLike(candidate.start)
      && Point.isPointLike(candidate.end);
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

  // Getters ------------------------------------------------------------------

  /**
   * Get the distance between the start and end points
   * @returns {number}
   */
  get length(): number {
    return Point.distance(this.start, this.end);
  }

  // Instance methods ---------------------------------------------------------

  /**
   * Returns an array of `resolution` points evenly spaced along this line,
   * excluding points in `excluded`.
   *
   * @param {number} resolution - The number of total points to include
   * @param {Point[]} excluded - Points to skip
   * @returns {Point[]}
   */
  getPoints(resolution: number, excluded: Point[] = []): Point[] {
    const rangeX = this.end.x - this.start.x;
    const rangeY = this.end.y - this.start.y;
    const stepX = rangeX / resolution;
    const stepY = rangeY / resolution;

    const range = mapInRange(1, resolution + 1, (stepNum) => {
      const x = this.start.x + (stepNum * stepX);
      const y = this.start.y + (stepNum * stepY);
      return new Point(x, y);
    });

    // FIXME: the exclusions won't work because the Point Objects don't match.
    //  This will need some noodling to find the best solution
    return _without(range, ...excluded);
  }

  toString(): string {
    return `${this.start}->${this.end}`;
  }
}

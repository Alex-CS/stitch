import {
  differentiate,
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
   * Determine if two lines are parallel
   * @param {Line} line1
   * @param {Line} line2
   * @returns {boolean}
   */
  static areParallel(line1: Line, line2: Line): boolean {
    // For the sake of determining parallel-ness, slope direction doesn't matter
    return Math.abs(line1.slope) === Math.abs(line2.slope);
  }

  /**
   * Get the point where two lines would intersect if both were to extend that far
   * @param {Line} line1
   * @param {Line} line2
   * @returns {Point|null} the intersection point, if it exists
   */
  static intersection(line1: Line, line2: Line): Point | null {
    if (Line.areParallel(line1, line2)) {
      return null;
    }

    // Vertical lines have no slope or usable y-intercept, and their x value is constant
    // In that case, the intersection is just wherever the other line has that x value
    // Because the lines cannot be parallel, we know that no more than one will be vertical
    const [verticalLine, slopedLine = line1] = differentiate(
      [line1, line2],
      (line) => line.isVertical,
    );

    const x = verticalLine
      ? verticalLine.start.x
      // This formula can be derived by taking two `y = mx + b` equations & solving for x when y is equal
      : (line2.slope - line1.slope) / (line1.yIntercept - line2.yIntercept);

    // Plug x into the equation for one of the lines to get y
    const y = (slopedLine.slope * x) + slopedLine.yIntercept;

    return new Point(x, y);
  }

  // Getters ------------------------------------------------------------------

  /**
   * Determine if the line is completely vertical
   * @returns {boolean}
   */
  get isVertical(): boolean {
    return this.start.x === this.end.x;
  }

  /**
   * Get the Vector between the start and end points of this line
   * @returns {Vector}
   */
  get vector(): Vector {
    // TODO: this should probably be cached rather than created every time
    return Vector.between(this.start, this.end);
  }

  get slope(): number {
    return this.vector.slope;
  }

  /**
   * The point where this line would cross the y-axis (if it were an infinite line)
   * @returns {number}
   */
  get yIntercept(): number {
    const { x, y } = this.start;
    return y - this.slope * x;
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
   * Returns an array of `resolution` points evenly spaced along this line,
   * excluding points in `excluded`.
   *
   * @param {number} resolution - The number of total points to include
   * @param {number} offset - How many initial points to skip
   * @returns {Point[]}
   */
  getPoints(resolution: number, offset = 0): Point[] {
    const rangeX = this.end.x - this.start.x;
    const rangeY = this.end.y - this.start.y;
    const stepX = rangeX / resolution;
    const stepY = rangeY / resolution;

    return mapInRange(offset, resolution + offset, (stepNum) => {
      const x = this.start.x + (stepNum * stepX);
      const y = this.start.y + (stepNum * stepY);
      return new Point(x, y);
    });
  }

  toString(): string {
    return `${this.start}->${this.end}`;
  }
}

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

  static from(line: LineLike): Line {
    return new Line(Point.from(line.start), Point.from(line.end));
  }

  static areEqual(lineA: LineLike, lineB: LineLike): boolean {
    const equalsOneOf = (p1: PointLike, otherPoints: PointLike[]) => {
      return otherPoints.some(p2 => Point.areEqual(p1, p2));
    };
    return equalsOneOf(lineA.start, [lineB.start, lineB.end])
      && equalsOneOf(lineA.end, [lineB.start, lineB.end]);
  }

  get length(): number {
    return Point.distance(this.start, this.end);
  }

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

import _without from 'lodash/without';

import { mapInRange } from '@/utils';

import Point from './Point';


export default class Line implements Object {
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

  /**
   * Returns an array of `resolution` points evenly spaced along this line,
   * excluding points in `excluded`.
   *
   * @param {number} resolution - The number of intermediate points to include
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

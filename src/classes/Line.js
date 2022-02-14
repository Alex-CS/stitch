import without from 'lodash/without';

import { mapInRange } from '@/utils';

import Point from './Point';


export default class Line {
  /**
   * @constructor
   * @param {Point} start
   * @param {Point} end
   */
  constructor(start, end) {
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
  getPoints(resolution, excluded = []) {
    const rangeX = this.end.x - this.start.x;
    const rangeY = this.end.y - this.start.y;
    const stepX = rangeX / resolution;
    const stepY = rangeY / resolution;

    const range = mapInRange(1, resolution + 1, (stepNum) => {
      const x = this.start.x + (stepNum * stepX);
      const y = this.start.y + (stepNum * stepY);
      return new Point(x, y);
    });

    return without(range, ...excluded);
  }

  toString() {
    return `${this.start}->${this.end}`;
  }
}

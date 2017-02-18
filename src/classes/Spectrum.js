import first from 'lodash/first';
import last from 'lodash/last';

import Color from './Color';

export default class Spectrum {

  constructor(color1, color2) {
    // TODO: test plotting through more than 2 initial colors

    this._colors = [color1, color2 || color1] || [new Color(0, 0, 0)];
    this._nextIndex = 0;
  }

  clone() {
    return new Spectrum(...this._colors.map(color => color.clone()));
  }

  /**
   * Get the first color in this Spectrum
   * @returns {Color}
   */
  firstColor() {
    return first(this._colors);
  }

  /**
   * Get the last color in this Spectrum
   * @returns {Color}
   */
  lastColor() {
    return last(this._colors);
  }

  /**
   * Get the next color in the sequence.
   * Will repeat through colors if `_nextIndex` is greater
   * than the number of colors.
   * @returns {Color}
   */
  nextColor() {
    const next = this._colors[this._nextIndex % this._colors.length];
    this._nextIndex += 1;
    return next;
  }

  /**
   * Add `resolution` colors between each existing color in the spectrum
   * @param {number} resolution
   * @returns {Spectrum}
   */
  segmentColors(resolution) {
    if (this._colors.length < 2) {
      // You can't segment a single color
      return this;
    }

    const start = this.firstColor();
    const end = this.lastColor();
    this._colors = start.stepsToward(end, resolution);

    return this;
  }

  reverse() {
    // Reverse the spectrum
    this._colors.reverse();
    this._nextIndex = 0;
    return this;
  }

  toString() {
    return `Spectrum [${this._colors}]`;
  }
}

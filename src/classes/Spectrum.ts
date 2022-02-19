import _first from 'lodash/first';
import _last from 'lodash/last';

import Color from './Color';


export default class Spectrum {
  _colors: Color[];
  _nextIndex: number;

  constructor(...colors: Color[]) {
    const [color1, color2] = colors;
    // TODO: test plotting through more than 2 initial colors

    this._colors = [color1, color2 || color1];
    this._nextIndex = 0;
  }

  clone(): Spectrum {
    return new Spectrum(...this.colors);
  }

  /**
   * Get copies of all the colors
   * @property
   * @readonly
   * @return {Color[]}
   */
  get colors(): Color[] {
    return this._colors.map(color => color.clone());
  }

  /**
   * Get the first color in this Spectrum
   * @returns {Color}
   */
  get firstColor(): Color {
    return _first(this._colors) ?? Color.BLACK;
  }

  /**
   * Get the last color in this Spectrum
   * @returns {Color}
   */
  get lastColor(): Color {
    return _last(this._colors) ?? Color.BLACK;
  }

  /**
   * Get the next color in the sequence.
   * Will repeat through colors if `_nextIndex` is greater
   * than the number of colors.
   * @returns {Color}
   */
  nextColor(): Color {
    const next = this._colors[this._nextIndex % this._colors.length];
    this._nextIndex += 1;
    return next;
  }

  /**
   * Generate `resolution` colors, going from the Spectrum's first color to its last color and back again
   * @param {number} resolution
   * @returns {Spectrum} TODO return a new Spectrum rather than mutating
   */
  segmentColors(resolution: number): Spectrum {
    if (this._colors.length < 2) {
      // You can't segment a single color
      return this;
    }

    const start = this.firstColor;
    const end = this.lastColor;
    const colors = start.stepsToward(end, Math.floor(resolution / 2));
    this._colors = [start, ...colors, ...colors.reverse()];

    return this;
  }

  reverse(): Spectrum {
    // Reverse the spectrum
    this._colors.reverse();
    this._nextIndex = 0;
    return this;
  }

  toString(): string {
    return `Spectrum [${this._colors}]`;
  }
}

import { mapInRange } from '../utils';

export function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default class Color {

  constructor(red = 0, green = 0, blue = 0, alpha = 1) {
    this.red = red;
    this.grn = green;
    this.blu = blue;
    this.alf = alpha;
  }

  clone() {
    return new Color(this.red, this.grn, this.blu, this.alf);
  }

  toRGBAString() {
    return `rgba(${this.red},${this.grn},${this.blu},${this.alf})`;
  }

  toString() {
    return `Color (${this.red},${this.grn},${this.blu},${this.alf})`;
  }

  /**
   * Scale this Color closer to rgba(0,0,0,0) by `factor`
   * @param {number} factor
   * @returns {Color}
   */
  scaleDown(factor) {
    this.red = Math.round(this.red / factor);
    this.grn = Math.round(this.grn / factor);
    this.blu = Math.round(this.blu / factor);
    this.alf /= factor;
    return this;
  }

  /**
   * Get the "distance" to `otherColor` in each dimension
   * @param {Color} otherColor
   * @returns {Color}
   */
  distanceTo(otherColor) {
    const rDist = otherColor.red - this.red;
    const gDist = otherColor.grn - this.grn;
    const bDist = otherColor.blu - this.blu;
    const aDist = otherColor.alf - this.alf;
    return new Color(rDist, gDist, bDist, aDist);
  }

  /**
   * Get the array of all the colors between this and `otherColor`
   * @param {Color} otherColor
   * @param {number} resolution
   * @returns {Color[]}
   */
  stepsToward(otherColor, resolution) {
    const colorStep = this.distanceTo(otherColor).scaleDown(resolution);

    // Handle all the colors between the start and end
    const colors = mapInRange(1, resolution, (i) => {
      const red = this.red + (colorStep.red * i);
      const green = this.grn + (colorStep.grn * i);
      const blue = this.blu + (colorStep.blu * i);
      const alpha = this.alf + (colorStep.alf * i);
      return new Color(red, green, blue, alpha);
    });
    colors.unshift(this.clone());
    colors.push(otherColor.clone());
    return colors;
  }
}

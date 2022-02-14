import { mapInRange } from '@/utils';


export default class Color {

  constructor(red = 0, green = 0, blue = 0, alpha = 1) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
  }

  /**
   * Create a new Color from a color-like object
   * @param {number} red
   * @param {number} green
   * @param {number} blue
   * @param {number} alpha
   * @return {Color}
   */
  static from({ red, green, blue, alpha }) {
    return new Color(red, green, blue, alpha);
  }

  clone() {
    return new Color(this.red, this.green, this.blue, this.alpha);
  }

  toRGBAString() {
    return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
  }

  toString() {
    return `Color (${this.red},${this.green},${this.blue},${this.alpha})`;
  }

  /**
   * Scale this Color closer to rgba(0,0,0,0) by `factor`
   * @param {number} factor
   * @returns {Color}
   */
  scaleDown(factor) {
    this.red = Math.round(this.red / factor);
    this.green = Math.round(this.green / factor);
    this.blue = Math.round(this.blue / factor);
    this.alpha /= factor;
    return this;
  }

  /**
   * Get the "distance" to `otherColor` in each dimension
   * @param {Color} otherColor
   * @returns {Color}
   */
  distanceTo(otherColor) {
    const rDist = otherColor.red - this.red;
    const gDist = otherColor.green - this.green;
    const bDist = otherColor.blue - this.blue;
    const aDist = otherColor.alpha - this.alpha;
    return new Color(rDist, gDist, bDist, aDist);
  }

  /**
   * Get the array of `resolution` colors between this and `otherColor`
   * @param {Color} otherColor
   * @param {number} resolution
   * @returns {Color[]}
   */
  stepsToward(otherColor, resolution) {
    const colorStep = this.distanceTo(otherColor).scaleDown(resolution);

    // Handle all the colors between the start and end
    const colors = mapInRange(1, resolution, (i) => {
      const red = this.red + (colorStep.red * i);
      const green = this.green + (colorStep.green * i);
      const blue = this.blue + (colorStep.blue * i);
      const alpha = this.alpha + (colorStep.alpha * i);
      return new Color(red, green, blue, alpha);
    });
    colors.push(otherColor.clone());
    return colors;
  }
}

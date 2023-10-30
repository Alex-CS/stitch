import { mapInRange } from '@/utils';


export interface ColorLike {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/**
 * @property {number} red - A number between 0 and 255 representing the RGB red value
 * @property {number} green - A number between 0 and 255 representing the RGB green value
 * @property {number} blue - A number between 0 and 255 representing the RGB blue value
 * @property {number} alpha - A decimal between 0 and 1 representing the opacity
 */
export default class Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;

  static RGB_RANGE = {
    min: 0,
    max: 255,
  };

  static ALPHA_RANGE = {
    min: 0,
    max: 1,
  };

  static get BLACK() {
    return new Color(0, 0, 0, 1);
  }

  constructor(red: number, green: number, blue: number, alpha = 1) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
  }

  static from({ red, green, blue, alpha }: ColorLike): Color {
    return new Color(red, green, blue, alpha);
  }

  static fromHexString(hexString: string): Color {
    if (!hexString.startsWith('#') || hexString.length !== 7) {
      throw new TypeError(`"${hexString}" isn't properly formatted`);
    }
    const red = parseInt(hexString.substring(1, 3), 16);
    const green = parseInt(hexString.substring(3, 5), 16);
    const blue = parseInt(hexString.substring(5, 7), 16);

    return new Color(red, green, blue);
  }

  clone(): Color {
    return Color.from(this);
  }

  toRGBAString(): string {
    return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
  }

  toHexString(): string {
    const hexCodes = [
      this.red,
      this.green,
      this.blue,
    ].map((color) => color.toString(16).padStart(2, '0'));
    return `#${hexCodes.join('')}`;
  }

  toString(): string {
    return `Color (${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
  }

  // NOTE: it's questionable whether the methods below really semantically _belong_ as instance methods...

  /**
   * Scale this Color closer to rgba(0,0,0,0) by `factor`
   * @param {number} factor
   * @returns {Color}
   */
  scaleDown(factor: number): Color {
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
  distanceTo(otherColor: ColorLike): Color {
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
  stepsToward(otherColor: Color, resolution: number): Color[] {
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

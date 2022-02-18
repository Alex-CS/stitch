import { type Point, type Line } from '.';


export type OneOrMore<T> = T | T[];
export type Groupable = OneOrMore<Point> | OneOrMore<Line>;


export default class Group<Member extends Groupable> {
  members: Member[];
  private readonly _attributes: Record<string, any>;

  /**
   * An arbitrary collection of Points or Lines that all share attributes
   * @constructor
   * @param {Point[]|Line[]} [members] The entities to collect
   * @param {Object} [attributes] The attributes to be applied to all members
   */
  constructor(members: Member[] = [], attributes: Record<string, any> = {}) {
    this.members = Array.from(members);
    this._attributes = { ...attributes };
  }

  get size() {
    return this.members.length;
  }

  get attributes() {
    return { ...this._attributes };
  }

  set attributes(newAttributes) {
    Object.entries(newAttributes).forEach(([key, value]) => {
      this.setAttr(key, value);
    });
  }

  /**
   * Set an attribute to all members
   * @param {string} attrName
   * @param {*} attrValue
   */
  setAttr(attrName: string, attrValue: any) {
    this._attributes[attrName] = attrValue;
    // this.members._forEach((member) => {
    //   member[attrName] = attrValue;
    // });
  }

  forEach(callback: (member: Member, index: number) => void) {
    this.members.forEach(callback);
  }

  map<T extends Groupable>(callback: (member: Member, index: number) => T): Group<T> {
    return new Group(this.members.map(callback), this.attributes);
  }

  toString(): string {
    return 'Group';
  }

  /**
   * Create a Group from an array
   * @param {Array} array
   * @returns {Group}
   */
  static from<T extends Groupable>(array: T[]): Group<T> {
    return new Group(array);
  }

  /**
   * Turn an array of arrays into an array of Groups
   * @param {Array[]} arrays
   * @return {Group[]}
   */
  static fromEach<T extends Groupable>(arrays: T[][]): Group<T>[] {
    return arrays.map((array) => Group.from(array));
  }
}

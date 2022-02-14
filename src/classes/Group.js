import forEach from 'lodash/forEach';


export default class Group {

  /**
   * An arbitrary collection of Points or Lines that all share attributes
   * @constructor
   * @param {Point[]|Line[]} [members] The entities to collect
   * @param {Object} [attributes] The attributes to be applied to all members
   */
  constructor(members = [], attributes = {}) {
    this.members = Array.from(members);
    this._attributes = { ...attributes };
  }

  get attributes() {
    return { ...this._attributes };
  }

  set attributes(newAttributes) {
    forEach(newAttributes, (value, key) => {
      this.setAttr(key, value);
    });
  }

  get size() {
    return this.members.length;
  }

  /**
   * Set an attribute to all members
   * @param {string} attrName
   * @param {*} attrValue
   */
  setAttr(attrName, attrValue) {
    this._attributes[attrName] = attrValue;
    // this.members.forEach((member) => {
    //   member[attrName] = attrValue;
    // });
  }

  forEach(callback) {
    this.members.forEach(callback);
  }

  map(callback) {
    return new Group(this.members.map(callback), this.attributes);
  }

  toString() {
    return 'Group';
  }

  /**
   * Create a Group from an array
   * @param {Array} array
   * @returns {Group}
   */
  static from(array) {
    return new Group(array);
  }

  /**
   * Turn an array of arrays into an array of Groups
   * @param {Array[]} arrays
   * @return {Group[]}
   */
  static fromEach(arrays) {
    return arrays.map(array => Group.from(array));
  }
}


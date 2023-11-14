import {
  Line,
} from '@/classes';
import {
  type Pair,
} from '@/types/utility';


/**
 * A pair of spines for a curve
 */
export type SpinePair = Pair<Line>;
/**
 * A unique key for a pair of spines
 */
type SpineKey = string;
/**
 * A collection of lines comprising a single curve
 */
export type CurveStitches = Line[];

interface StitchCurveMapInternalValue {
  spines: SpinePair;
  stitches: CurveStitches;
}

export default class StitchCurveMap extends Map<SpinePair, CurveStitches> {
  #map = new Map<SpineKey, StitchCurveMapInternalValue>();

  #makeKey(spines: SpinePair): SpineKey {
    // FIXME this could probably just use `toSorted`, but I can't get TS to recognize that for some reason
    const orderedSpines = [...spines].sort(Line.compareFn);
    return orderedSpines.join(' :: '); // TODO: maybe come up with a better joiner?
  }

  set(spines: SpinePair, stitches: CurveStitches) {
    const key = this.#makeKey(spines);
    this.#map.set(key, { spines, stitches });
    return this;
  }

  has(spines: SpinePair): boolean {
    return this.#map.has(this.#makeKey(spines));
  }

  get(spines: SpinePair): CurveStitches | undefined {
    return this.#map.get(this.#makeKey(spines))?.stitches;
  }

  delete(spines: SpinePair) {
    const key = this.#makeKey(spines);
    return this.#map.delete(key);
  }

  clear() {
    this.#map.clear();
  }

  get spines(): Line[] {
    const spinePairs = Array.from(this.keys());
    const uniqueSpines = new Set(spinePairs.flat());
    return Array.from(uniqueSpines);
  }

  get stitches(): Line[] {
    const curves = Array.from(this.values());
    const uniqueStitches = new Set(curves.flat());
    return Array.from(uniqueStitches);
  }

  // Iterators

  keys(): IterableIterator<SpinePair> {
    const iterator = this.#map.values();
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        const internalResult = iterator.next();
        if (internalResult.done) {
          // Value is always undefined here
          return internalResult;
        }

        return {
          done: internalResult.done,
          value: internalResult.value.spines,
        };
      },
    };
  }

  values(): IterableIterator<CurveStitches> {
    const iterator = this.#map.values();
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        const internalResult = iterator.next();
        if (internalResult.done) {
          // Value is always undefined here
          return internalResult;
        }

        return {
          done: internalResult.done,
          value: internalResult.value.stitches,
        };
      },
    };
  }

  entries(): IterableIterator<[SpinePair, CurveStitches]> {
    const iterator = this.#map.values();
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        const internalResult = iterator.next();
        if (internalResult.done) {
          // Value is always undefined here
          return internalResult;
        }

        const {
          spines,
          stitches,
        } = internalResult.value as StitchCurveMapInternalValue;

        return {
          done: internalResult.done,
          value: [spines, stitches] as [SpinePair, CurveStitches],
        };
      },
    };
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

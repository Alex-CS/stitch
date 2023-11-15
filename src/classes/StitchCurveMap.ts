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

/**
 * Create a new IterableIterator that wraps another and performs some transform on its values
 * @template TValueInitial, TValueTransformed
 * @param {IterableIterator<TValueInitial>} innerIterator
 * @param {(innerYieldValue: TValueInitial) => TValueTransformed} valueTransformFn
 * @return {IterableIterator<TValueTransformed>}
 */
function wrapIterator<TValueInitial, TValueTransformed>(
  innerIterator: IterableIterator<TValueInitial>,
  valueTransformFn: (innerYieldValue: TValueInitial) => TValueTransformed,
): IterableIterator<TValueTransformed> {
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const internalResult = innerIterator.next();
      if (internalResult.done) {
        // Value is always undefined here
        return internalResult;
      }

      const value = valueTransformFn(internalResult.value);

      return {
        done: internalResult.done,
        value,
      };
    },
  };
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
    return wrapIterator(this.#map.values(), (innerValue) =>  {
      return innerValue.spines;
    });
  }

  values(): IterableIterator<CurveStitches> {
    return wrapIterator(this.#map.values(), (innerValue) => {
      return innerValue.stitches;
    });
  }

  entries(): IterableIterator<[SpinePair, CurveStitches]> {
    return wrapIterator(this.#map.values(), (innerValue) => {
      const {
        spines,
        stitches,
      } = innerValue;

      return [spines, stitches] as [SpinePair, CurveStitches];
    });
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

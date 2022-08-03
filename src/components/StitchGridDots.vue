<script lang="ts">
import _range from 'lodash/range';

import {
  defineComponent,
  type PropType,
} from 'vue';

import {
  Point,
} from '@/classes';


const DEFAULT_INNER_RADIUS = 2;
const DEBUG_INNER_RADIUS = 5;
// The space to leave between the edge of the grid and the outer points
// as a multiple of the space between the grid points
const DEFAULT_GUTTER_WIDTH = 0.5;

export default defineComponent({
  name: 'StitchGridDots',
  props: {
    gridSize: {
      type: Number,
      required: true,
    },
    gridDensity: {
      type: Number,
      required: true,
    },
    selectedPoint: {
      type: [Point, null] as PropType<Point | null>,
      required: true,
    },
    stitchedPoints: {
      type: Set as PropType<Set<ReturnType<Point['toString']>>>,
      required: true,
    },
    debugMode: Boolean,
  },
  emits: {
    selectPoint(payload: Point) {
      return Point.isPointLike(payload);
    },
  },
  data() {
    return {
      gutterWidth: DEFAULT_GUTTER_WIDTH,
    };
  },
  computed: {

    gridDots(): Point[] {
      const getGridPosition = (index: number, unit: number) => (
        (index + this.gutterWidth) * unit
      );
      const makePointFromCoords = (xIndex: number, yIndex: number) => {
        return Point.precise(
          getGridPosition(xIndex, this.gridStep.x),
          getGridPosition(yIndex, this.gridStep.y),
        );
      };
      // FIXME There's gotta be a better way to get points
      return _range(this.gridDensity ** 2).map((index) => makePointFromCoords(
        index % this.gridDensity,
        Math.floor(index / this.gridDensity),
      ));
    },

    gridStep(): { x: number, y: number } {
      // TODO: `width` & `height` might be better return names
      // The distance between adjacent points
      const getGridSpace = (max: number) => {
        // Adjustment factor to keep points evenly-spaced regardless of margin
        // `2 * this.gutterWidth` because there's gutter on both sides
        // `- 1` TODO
        const spaceFactor = (2 * this.gutterWidth) - 1;
        return max / (this.gridDensity + spaceFactor);
      };

      return {
        x: getGridSpace(this.gridSize),
        y: getGridSpace(this.gridSize),
      };
    },

    /**
     * The radius of the inner circle that isn't covered by the stroke.
     *
     * @property
     * @return {Number}
     */
    innerRadius(): number {
      if (this.debugMode) return DEBUG_INNER_RADIUS;

      return DEFAULT_INNER_RADIUS;
    },

    /**
     * The radius of each dot's SVG circle.
     *
     * This number is more implicitly than explicitly relevant.
     * @see `dotStrokeWidth` and `outerRadius`
     * I did the math for those first in order to solve for this,
     * so it may be easier to understand this by reading them first.
     *
     * We want `outerRadius` to be half of `gridSize`, so:
     * Let r = dotRadius, r_ = innerRadius, w = dotStrokeWidth.
     *   gridSize = 2 * outerRadius = 2 * (r + w/2)
     *   gridSize = 2r + w = 2r + (2r - 2r_)
     *   4r = gridSize + 2r_
     *   r = (gridSize + 2r_) / 4
     *
     * @property
     * @return {Number}
     */
    dotRadius(): number {
      const gridSeparation = Math.min(this.gridStep.x, this.gridStep.y);
      // We want `outerRadius` to be half of gridSeparation, so:
      // gridSeparation = 2 * outerRadius = 2 * (r + w/2)
      // gridSeparation = 2r + (w = 2r - 2r_)
      // gridSeparation = 2r + 2r - 2r_
      // gridSeparation + 2r_ = 4r
      // (gridSeparation + 2r_) / 4 = r
      const innerDiameter = 2 * this.innerRadius;
      return (gridSeparation + innerDiameter) / 4;
    },

    /**
     * The width of the 'stroke' (aka border) of each dot.
     *
     * SVG stroke-width, `w`, is half outside the shape and half inside.
     * So the inner radius, `r_`, of the inner circle is (r_ = r - w/2).
     * => (r = r_ + w/2)
     * => (2r = 2r_ + w)
     * => (w = 2r - 2r_)
     *
     * @property
     * @return {Number}
     */
    dotStrokeWidth(): number {
      return (2 * this.dotRadius) - (2 * this.innerRadius);
    },

    /**
     * The final radius with stroke width included.
     *
     * This should be half the distance between two center points
     * to prevent any overlap.
     *
     * @property
     * @return {Number}
     */
    outerRadius(): number {
      return this.dotRadius + (this.dotStrokeWidth / 2);
    },

  },
  methods: {

    isSelected(point: Point) {
      return Point.areEqual(this.selectedPoint, point);
    },

    getCoordsFromIndex(index: number): string {
      const dotsPerRow = this.gridDensity;
      const yIndex = Math.floor(index / dotsPerRow);
      const xIndex = index % dotsPerRow;
      return `(${xIndex}, ${yIndex})`;
    },

  },
});
</script>

<template>
  <g id="circles">
    <circle
      v-for="(point, i) in gridDots"
      :key="point.toString()"
      :class="{
        active: isSelected(point),
        stitched: debugMode && stitchedPoints.has(point.toString()),
      }"
      :cx="point.x"
      :cy="point.y"
      :r="dotRadius"
      :stroke-width="dotStrokeWidth"
      @click.stop="$emit('selectPoint', point)"
    ><title v-if="debugMode">{{ getCoordsFromIndex(i) }}</title></circle>
    <!-- TODO Add hover event that makes the inner circle bigger -->
  </g>
</template>

<style lang="scss" scoped>
@use '@/styles/tools';

circle {
  @include tools.color-states(fill);
  cursor: pointer;
  stroke: var(--color-background);
  opacity: .25;

  &.stitched {
    fill: cyan;
  }
}

</style>
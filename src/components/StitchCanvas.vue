<!-- NOTES:
  *  Clarification of point terminology:
  *  - A _point_ is a 0-dimension shape at given coordinates
  *  - _Point_ is a javascript class that describes _point_s.
  *    *A* Point is an instance of such.
  *  - A _circle_ is a two-dimensional shape with a _point_ at its center
  *  - A _dot_ is a small circle to visually represent a point
-->

<script lang="ts">
import _flatMap from 'lodash/flatMap';
import _range from 'lodash/range';

import {
  defineComponent,
} from 'vue';


import {
  Point,
  Line,
  type PointLike,
} from '@/classes';

import StitchLine from './StitchLine.vue';


const DEFAULT_INNER_RADIUS = 2;
// The space to leave between the edge of the grid and the outer points
// as a multiple of the space between the grid points
const DEFAULT_GUTTER_WIDTH = 0.5;

export default defineComponent({
  name: 'StitchCanvas',
  components: {
    StitchLine,
  },
  props: {
    // How many dots to show per row/column
    resolution: {
      type: Number,
      required: true,
    },
    // How big the canvas should be
    size: {
      type: Number,
      required: true,
    },
    // Whether to show the dots or not
    hideDots: Boolean,
  },
  data() {
    return {
      gutterWidth: DEFAULT_GUTTER_WIDTH,
      width: this.size,
      height: this.size,
      selected: null as PointLike | null,
      lines: [] as Line[],
    };
  },
  computed: {
    gridDots(): PointLike[] {
      // FIXME There's gotta be a better way to get points
      return _flatMap(_range(this.resolution),
        yIndex => _range(this.resolution).map(
          xIndex => this.getPosition(xIndex, yIndex),
        ));
      // for (const yIndex = 0; yIndex < this.resolution; yIndex++) {
      //   for (const xIndex = 0; xIndex < this.resolution; xIndex++)) {
      //     yield this.getPosition(xIndex, yIndex);
      //   }
      // }
    },

    gridSize(): { x: number, y: number } { // TODO: `width` & `height` might be better
      // The distance between adjacent points
      const getGridSpace = (max: number) => {
        // Adjustment factor to keep points evenly-spaced regardless of margin
        // `2 * this.gutterWidth` because there's gutter on both sides
        // `- 1` TODO
        const spaceFactor = (2 * this.gutterWidth) - 1;
        return max / (this.resolution + spaceFactor);
      };

      return {
        x: getGridSpace(this.width),
        y: getGridSpace(this.height),
      };
    },

    /**
     * The radius of the inner circle that isn't covered by the stroke.
     *
     * @property
     * @return {Number}
     */
    innerRadius(): number {
      return this.hideDots ? 0 : DEFAULT_INNER_RADIUS;
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
      const gridSize = Math.min(this.gridSize.x, this.gridSize.y);
      // We want `outerRadius` to be half of gridSize, so:
      // gridSize = 2 * outerRadius = 2 * (r + w/2)
      // gridSize = 2r + (w = 2r - 2r_)
      // gridSize = 2r + 2r - 2r_
      // gridSize + 2r_ = 4r
      // (gridSize + 2r_) / 4 = r
      const innerDiameter = 2 * this.innerRadius;
      return (gridSize + innerDiameter) / 4;
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
    getPosition(xIndex: number, yIndex: number): PointLike {
      const getPos = (index: number, axis: 'x' | 'y') => {
        return this.gridSize[axis] * (index + this.gutterWidth);
      };

      // TODO: For some (probably good) reason, past Alex
      // TODO: made the Point constructor rounds its input,
      // TODO: which is why it can't be used here
      return {
        x: getPos(xIndex, 'x'),
        y: getPos(yIndex, 'y'),
      };
    },
    isSelected(point: PointLike): boolean {
      if (this.selected) {
        return Point.prototype.equals.call(this.selected, point);
      }
      return false;
    },
    select(point: PointLike) {
      const { x, y } = point;
      // TODO order these better
      if (this.selected === null) {
        // Select first point
        console.log(`Select { x: ${x}, y: ${y} }`);
        this.selected = { x, y };
      } else if (this.isSelected(point)) {
        // Deselect
        console.log(`Deselect { x: ${x}, y: ${y} }`);
        this.selected = null;
      } else {
        // Draw line
        this.lines.push(new Line(
          Point.from(this.selected),
          Point.from(point)),
        );
        this.selected = null;
      }
    },
  },
});
</script>

<template>
  <svg :width="width" :height="height">
    <g id="circles">
      <circle
        v-for="point in gridDots"
        :key="point.toString()"
        :class="{
          active: isSelected(point),
        }"
        :cx="point.x"
        :cy="point.y"
        :r="dotRadius"
        :stroke-width="dotStrokeWidth"
        @click.stop="select(point)"
      />
      <!-- TODO Add hover event that makes the inner circle bigger -->
    </g> <!-- end #circles -->

    <g id="lines">
      <StitchLine
        v-for="(line, i) in lines"
        :key="line.toString()"
        :class="{ active: i === lines.length - 1 }"
        :line="line"
      />
    </g> <!-- end #lines -->
  </svg>
</template>

<style lang="scss" scoped>
$default-color: #aaaaaa;
$active-color: royalblue;
$hover-color: darken($active-color, 10%);
$trans-props: .2s ease-in-out;

@mixin color-states($prop) {
  transition: $prop $trans-props;
  #{$prop}: $default-color;

  &:hover {
    #{$prop}: $hover-color;
  }

  &.active {
    #{$prop}: $active-color;
  }
}

circle {
  @include color-states(fill);
  cursor: pointer;
  stroke: var(--color-background);
}

line {
  @include color-states(stroke);
}

</style>

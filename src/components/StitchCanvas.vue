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
  Color,
  Point,
  Line,
  stitch,
  type PointLike,
} from '@/classes';

import {
  makeIndexLooper,
} from '@/utils';

import StitchLine from './StitchLine.vue';


type CurveStitches = Line[];

const DEFAULT_INNER_RADIUS = 2;
const DEBUG_INNER_RADIUS = 5;
// The space to leave between the edge of the grid and the outer points
// as a multiple of the space between the grid points
const DEFAULT_GUTTER_WIDTH = 0.5;


// Dummy lines for testing
const DEBUG_LINES = [

  { start: [0, 5], end: [0, 0] },
  { start: [0, 0], end: [5, 0] },

  { start: [-6, 0], end: [-2, 0] },
  { start: [-1, 1], end: [-1, 5] },

  { start: [0, -6], end: [0, -1] },
  { start: [1, -1], end: [5, -4] },

  { start: [-1, -6], end: [-2, -1] },
  { start: [-1, -2], end: [-6, -1] },

  { start: [4, 4], end: [4, -5] },
  { start: [-5, -5], end: [-5, 4] },

  // { start: [8, 0], end: [3, 0] },
  // { start: [3, 0], end: [0, 4] },
  //
  // { start: [14, 0], end: [9, 0] },
  // { start: [9, 0], end: [6, 4] },
  //
  // { start: [4, 9], end: [8, 9] },
  // { start: [9, 4], end: [9, 8] },
  //
  // { start: [0, 8], end: [4, 8] },
  // { start: [1, 9], end: [1, 5] },
  //
  // { start: [2, 3], end: [5, 3] },
  // { start: [4, 4], end: [4, 7] },
  //
  // { start: [8, 2], end: [5, 1] },
  // { start: [7, 1], end: [8, 4] },
  //
  // { start: [10, 5], end: [11, 0] },
  // { start: [10, 1], end: [15, 0] },
  //
  // { start: [1, 2], end: [1, 9] },
  // { start: [9, 1], end: [2, 1] },
  //
  // { start: [2, 9], end: [9, 8] },
  // { start: [9, 2], end: [8, 9] },
];

function getDebugLines(
  resolution: number,
  gridSize: { x: number, y: number },
  outerRadius: number,
): Line[] {
  const getIndex = makeIndexLooper(resolution);
  const { x: xScale, y: yScale } = gridSize;
  const scaleUp = ([x, y]: number[]) => ({
    x: getIndex(x) * xScale + outerRadius,
    y: getIndex(y) * yScale + outerRadius,
  });

  return  DEBUG_LINES.map((line) => {
    const start = scaleUp(line.start);
    const end = scaleUp(line.end);
    return Line.from({ start, end });
  });
}

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
    debugMode: Boolean,
  },
  data() {
    return {
      gutterWidth: DEFAULT_GUTTER_WIDTH,
      width: this.size,
      height: this.size,
      selectedPoint: null as PointLike | null,
      selectedLine: null as Line | null,
      lines: [] as Line[],
      stitches: [] as CurveStitches,
      // Debug mode things
      stitchColors: new WeakMap<Line, Color>(),
      firstLineColor: new Color(0, 127, 255),
      lastLineColor: new Color(180, 15, 127),
    };
  },
  computed: {
    gridDots(): PointLike[] {
      // FIXME There's gotta be a better way to get points
      const range = _range(this.resolution);
      return _flatMap(range,
        yIndex => range.map(
          xIndex => this.getPosition(xIndex, yIndex),
        ),
      );
      // for (const yIndex = 0; yIndex < this.resolution; yIndex++) {
      //   for (const xIndex = 0; xIndex < this.resolution; xIndex++)) {
      //     yield this.getPosition(xIndex, yIndex);
      //   }
      // }
    },

    gridSize(): { x: number, y: number } {
      // TODO: `width` & `height` might be better return names
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
      if (this.hideDots) return 0;
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
  mounted() {
    if (this.debugMode) {
      this.initDebugMode();
    }
  },
  methods: {
    initDebugMode() {
      this.lines.push(...getDebugLines(
        this.resolution,
        this.gridSize,
        this.outerRadius,
      ));

      const stop = this.lines.length;
      const stitchNext = (i = 0) => {
        this.selectLine(this.lines[i]);
        if (i + 1 >= stop) return;
        this.$nextTick(() => {
          stitchNext(i + 1);
        });
      };
      stitchNext();
    },

    getCoords(index: number): string {
      const dotsPerRow = this.resolution;
      const y = Math.floor(index / dotsPerRow);
      const x = index % dotsPerRow;
      return `(${x}, ${y})`;
    },

    getPosition(xIndex: number, yIndex: number): PointLike {
      const getPos = (index: number, axis: 'x' | 'y') => (
        this.gridSize[axis] * (index + this.gutterWidth)
      );

      // TODO: For some (probably good) reason, past Alex
      // TODO: made the Point constructor rounds its input,
      // TODO: which is why it can't be used here
      return {
        x: getPos(xIndex, 'x'),
        y: getPos(yIndex, 'y'),
      };
    },

    isSelected(item: PointLike | Line): boolean {
      if (Point.isPointLike(item)) {
        return Point.areEqual(this.selectedPoint, item);
      } else if (this.selectedLine) {
        return Line.areEqual(this.selectedLine, item);
      }
      return false;
    },

    selectPoint(point: PointLike) {
      const { x, y } = point;
      // TODO order these better
      if (this.selectedPoint === null) {
        // Select first point
        console.log(`Select { x: ${x}, y: ${y} }`);
        this.selectedPoint = { x, y };
      } else if (this.isSelected(point)) {
        // Deselect
        console.log(`Deselect { x: ${x}, y: ${y} }`);
        this.selectedPoint = null;
      } else {
        // Draw line
        this.lines.push(Line.from({
          start: this.selectedPoint,
          end: point,
        }));
        this.selectedPoint = null;
      }
    },

    selectLine(line: Line) {
      if (this.selectedLine === null) {
        // Select first line
        console.log(`Selected spine1: ${line}`);
        this.selectedLine = line;
      } else if (this.isSelected(line)) {
        // Deselect
        console.log(`Deselect spine1: ${line}`);
        this.selectedLine = null;
      } else {
        // Stitch
        console.log(`Stitching spine1: ${this.selectedLine}, spine2: ${line}`);

        this.stitches.push(...this.getStitches(this.selectedLine, line));

        this.selectedLine = null;
      }
    },

    getStitches(lineA: Line, lineB: Line): CurveStitches {
      // NOTE: This only works for horizontal and vertical lines
      // Get the number of grid dots along this line to make it easier to eyeball if the lines are right
      const dynamicResolution = Math.round(lineB.length / (this.outerRadius * 2));
      const stitches = stitch([lineA, lineB], dynamicResolution);
      if (this.debugMode) {
        this.stitchColors.set(stitches[0], this.firstLineColor);
        this.stitchColors.set(stitches[stitches.length - 1], this.lastLineColor);
      }

      return stitches;
    },
  },
});
</script>

<template>
  <svg
    :width="width"
    :height="height"
    class="svg-canvas"
  >
    <g id="circles">
      <circle
        v-for="(point, i) in gridDots"
        :key="point.toString()"
        :class="{
          active: isSelected(point),
        }"
        :cx="point.x"
        :cy="point.y"
        :r="dotRadius"
        :stroke-width="dotStrokeWidth"
        @click.stop="selectPoint(point)"
      ><title v-if="debugMode">{{ getCoords(i) }}</title></circle>
      <!-- TODO Add hover event that makes the inner circle bigger -->
    </g> <!-- end #circles -->

    <g id="lines">
      <StitchLine
        v-for="(line) in lines"
        :key="line.toString()"
        :class="{
          active: isSelected(line),
        }"
        :line="line"
        class="spine"
        @click="selectLine(line)"
      />
    </g> <!-- end #lines -->

    <g id="stitches">
      <StitchLine
        v-for="(stitch) in stitches"
        :key="stitch.toString()"
        :line="stitch"
        :style="{
          stroke: stitchColors.get(stitch)?.toRGBAString(),
        }"
        class="stitch"
      />
    </g> <!-- end #stitches -->
  </svg>
</template>

<style lang="scss" scoped>
$default-color: #aaaaaa;
$active-color: royalblue;
$hover-color: darken($active-color, 10%);
$trans-props: .2s ease-in-out;

@mixin color-states($prop) {
  transition: all $trans-props;
  #{$prop}: $default-color;

  &:hover {
    #{$prop}: $hover-color;
    opacity: 1;
  }

  &.active {
    #{$prop}: $active-color;
  }
}

.svg-canvas {
  overflow: visible;
}

circle {
  @include color-states(fill);
  cursor: pointer;
  stroke: var(--color-background);
  opacity: .25;
}

line {
  stroke: currentColor;
}
.spine {
  @include color-states(stroke);
  opacity: .25;
  stroke-width: 2;

  &:hover {
    stroke-width: 5;
  }
}

</style>

<!-- NOTES:
  *  Clarification of point terminology:
  *  - A _point_ is a 0-dimension shape at given coordinates
  *  - _Point_ is a javascript class that describes _point_s.
  *    *A* Point is an instance of such.
  *  - A _circle_ is a two-dimensional shape with a _point_ at its center
  *  - A _dot_ is a small circle to visually represent a point
-->

<script lang="ts">
import _range from 'lodash/range';

import {
  defineComponent,
} from 'vue';


import {
  Color,
  Point,
  Line,
  stitch,
} from '@/classes';

import {
  type Pair,
} from '@/types/utility';

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


// Lines in a simplified notation for easier testing
const DEBUG_LINES: { start: Pair<number>, end: Pair<number> }[] = [
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
];

function getDebugLines(
  resolution: number,
  gridDots: Point[],
): Line[] {
  const getDirectionalIndex = makeIndexLooper(resolution);
  const getFlattenedIndex = (xIndexRaw: number, yIndexRaw: number) => {
    const [xIndex, yIndex] = [xIndexRaw, yIndexRaw].map(getDirectionalIndex);
    return xIndex + (yIndex * resolution);
  };

  return  DEBUG_LINES.map((line) => {
    const start = gridDots[getFlattenedIndex(...line.start)];
    const end = gridDots[getFlattenedIndex(...line.end)];
    return new Line(start, end);
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
      selectedPoint: null as Point | null,
      selectedLine: null as Line | null,
      lines: [] as Line[],
      stitches: [] as CurveStitches,
      // Debug mode things
      stitchedPoints: new Set<ReturnType<Point['toString']>>(),
      stitchColors: new WeakMap<Line, Color>(),
      firstLineColor: new Color(0, 127, 255),
      lastLineColor: new Color(180, 15, 127),
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
      return _range(this.resolution ** 2).map((index) => makePointFromCoords(
        index % this.resolution,
        Math.floor(index / this.resolution),
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
        return max / (this.resolution + spaceFactor);
      };

      return {
        x: getGridSpace(this.size),
        y: getGridSpace(this.size),
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
      const gridSize = Math.min(this.gridStep.x, this.gridStep.y);
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
        this.gridDots,
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

    getCoordsFromIndex(index: number): string {
      const dotsPerRow = this.resolution;
      const yIndex = Math.floor(index / dotsPerRow);
      const xIndex = index % dotsPerRow;
      return `(${xIndex}, ${yIndex})`;
    },

    isSelected(item: Point | Line): boolean {
      if (Point.isPointLike(item)) {
        return Point.areEqual(this.selectedPoint, item);
      } else if (this.selectedLine) {
        return Line.areEqual(this.selectedLine, item);
      }
      return false;
    },

    selectPoint(point: Point) {
      const { x, y } = point;
      // TODO order these better
      if (this.selectedPoint === null) {
        // Select first point
        console.log(`Select { x: ${x}, y: ${y} }`);
        this.selectedPoint = point;
      } else if (this.isSelected(point)) {
        // Deselect
        console.log(`Deselect { x: ${x}, y: ${y} }`);
        this.selectedPoint = null;
      } else {
        // Draw line
        this.lines.push(new Line(
          this.selectedPoint,
          point,
        ));
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
        stitches.forEach((stitchedLine) => {
          this.stitchedPoints.add(stitchedLine.start.toString());
          this.stitchedPoints.add(stitchedLine.end.toString());
        });
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
    :viewBox="`0 0 ${size} ${size}`"
    class="svg-canvas"
  >
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
        @click.stop="selectPoint(point)"
      ><title v-if="debugMode">{{ getCoordsFromIndex(i) }}</title></circle>
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

  &.stitched {
    fill: cyan;
  }
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

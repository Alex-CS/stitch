<!-- NOTES:
  *  Clarification of point terminology:
  *  - A _point_ is a 0-dimension shape at given coordinates
  *  - _Point_ is a javascript class that describes _point_s.
  *    *A* Point is an instance of such.
  *  - A _circle_ is a two-dimensional shape with a _point_ at its center
  *  - A _dot_ is a small circle to visually represent a point
-->

<script lang="ts">
import _chunk from 'lodash/chunk';
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

import StitchCanvasSpines from './StitchCanvasSpines.vue';
import StitchGridDots from './StitchGridDots.vue';
import StitchLine from './StitchLine.vue';


type CurveStitches = Line[];


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
  gridDensity: number,
  gridSeparation: number,
): Line[] {
  const getDirectionalIndex = makeIndexLooper(gridDensity);
  const getPoint = (xIndexRaw: number, yIndexRaw: number) => {
    const [xIndex, yIndex] = [xIndexRaw, yIndexRaw].map(getDirectionalIndex);
    return {
      x: (xIndex + 0.5) * gridSeparation,
      y: (yIndex + 0.5) * gridSeparation,
    };
  };

  return  DEBUG_LINES.map((line) => {
    const start = getPoint(...line.start);
    const end = getPoint(...line.end);
    return Line.from({ start, end });
  });
}

export default defineComponent({
  name: 'StitchCanvas',
  components: {
    StitchCanvasSpines,
    StitchGridDots,
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
      lines: [] as Line[],
      stitches: [] as CurveStitches,
      // Debug mode things
      stitchedPoints: new Set<ReturnType<Point['toString']>>(),
      stitchColors: new WeakMap<Line, string>(),
      firstLineColor: new Color(0, 127, 255),
      lastLineColor: new Color(180, 15, 127),
    };
  },
  computed: {
    gridSeparation() {
      return this.size / this.resolution;
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
        this.gridSeparation,
      ));

      // FIXME: clean this up if I decide to formally keep debug mode
      const pairs = _chunk(this.lines, 2);
      pairs.forEach((pair) => {
        if (pair.length === 2) {
          this.stitchSpines(pair[0], pair[1]);
        }
      });
    },

    addDebugStitches(stitches: CurveStitches) {
      // Record which points have been stitched
      stitches.forEach((stitchedLine) => {
        this.stitchedPoints.add(stitchedLine.start.toString());
        this.stitchedPoints.add(stitchedLine.end.toString());
      });
      // Differentiate the first and last stitch by color
      this.stitchColors.set(stitches[0], this.firstLineColor.toRGBAString());
      this.stitchColors.set(stitches[stitches.length - 1], this.lastLineColor.toRGBAString());
    },

    addSpine(pointA: Point, pointB: Point) {
      this.lines.push(new Line(pointA, pointB));
    },

    stitchSpines(lineA: Line, lineB: Line) {
      this.stitches.push(...this.getStitches(lineA, lineB));
    },

    getStitches(lineA: Line, lineB: Line): CurveStitches {
      // NOTE: This only works for horizontal and vertical lines
      // Get the number of grid dots along this line to make it easier to eyeball if the lines are right
      const dynamicResolution = Math.round(lineB.length / this.gridSeparation);
      const stitches = stitch([lineA, lineB], dynamicResolution);
      if (this.debugMode) {
        this.addDebugStitches(stitches);
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
    <StitchGridDots
      :grid-size="size"
      :grid-density="resolution"
      :debug-mode="debugMode"
      :stitched-points="stitchedPoints"
      @add-line="addSpine"
    />

    <StitchCanvasSpines
      :lines="lines"
      @pair-selected="stitchSpines"
    />

    <g id="stitches">
      <StitchLine
        v-for="(stitch) in stitches"
        :key="stitch.toString()"
        :line="stitch"
        :style="{
          color: stitchColors.get(stitch),
        }"
        class="stitch"
      />
    </g> <!-- end #stitches -->
  </svg>
</template>

<style lang="scss" scoped>
@use '@/styles/tools';


.svg-canvas {
  overflow: visible;
}

line {
  stroke: currentColor;
}

</style>

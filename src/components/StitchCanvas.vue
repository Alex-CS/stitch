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
import StitchCanvasStitches from './StitchCanvasStitches.vue';
import StitchDragDrawSVG from './StitchDragDrawSVG.vue';
import StitchGridDots from './StitchGridDots.vue';


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
  const baseOffset = 0.5;
  const getOffset = (xIndexRaw: number, yIndexRaw: number) => ({
    x: baseOffset + Number(xIndexRaw < 0),
    y: baseOffset + Number(yIndexRaw < 0),
  });
  const getDirectionalIndex = makeIndexLooper(gridDensity);
  const getPoint = (xIndexRaw: number, yIndexRaw: number) => {
    const [xIndex, yIndex] = [xIndexRaw, yIndexRaw].map(getDirectionalIndex);
    const offset = getOffset(xIndexRaw, yIndexRaw);
    return {
      x: (xIndex + offset.x) * gridSeparation,
      y: (yIndex + offset.y) * gridSeparation,
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
    StitchCanvasStitches,
    StitchDragDrawSVG,
    StitchGridDots,
  },
  props: {
    // How many dots to show per row/column
    gridDensity: {
      type: Number,
      default: 20,
    },
    // Whether to show the dots or not
    showDots: Boolean,
    debugMode: Boolean,
  },
  data() {
    return {
      size: 1000,
      lines: [] as Line[],
      stitches: [] as CurveStitches,
      // Debug mode things
      stitchedPoints: new Set<ReturnType<Point['toString']>>(),
      stitchColors: new WeakMap<Line, string>(),
      firstLineColor: 'rgb(0, 127, 255)',
      lastLineColor: 'rgb(255, 0, 127)',
      firstColor: Color.fromHexString('#007fff'),
      lastColor: Color.fromHexString('#ff007f'),
    };
  },
  computed: {
    gridSeparation() {
      return this.size / this.gridDensity;
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
        this.gridDensity - 1,
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
      this.stitchColors.set(stitches[0], this.firstLineColor);
      this.stitchColors.set(stitches[stitches.length - 1], this.lastLineColor);
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
      } else {
        const colors = this.firstColor.stepsToward(this.lastColor, dynamicResolution - 1);
        stitches.forEach((line, index) => {
          this.stitchColors.set(line, (colors[index - 1] || this.firstColor).toHexString());
        });
      }

      return stitches;
    },
  },
});
</script>

<template>
  <StitchDragDrawSVG
    @line-drawn="lines.push($event)"
  >
    <template v-if="showDots" #behind>
      <StitchGridDots
        :grid-size="size"
        :grid-density="gridDensity"
        :debug-mode="debugMode"
        :stitched-points="stitchedPoints"
        @add-line="addSpine"
      />
    </template>

    <StitchCanvasSpines
      :lines="lines"
      @pair-selected="stitchSpines"
    />

    <StitchCanvasStitches
      :stitches="stitches"
      :colors="stitchColors"
    />
  </StitchDragDrawSVG>
</template>

<style lang="scss" scoped>
@use '@/styles/tools';


.svg-canvas {
  overflow: visible;
  background-color: black;
  max-height: 90vh;
  max-width: 90vw;
}

</style>

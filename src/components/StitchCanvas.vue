<!-- NOTES:
  *  Clarification of point terminology:
  *  - A _point_ is a 0-dimension shape at given coordinates
  *  - _Point_ is a javascript class that describes _point_s.
  *    *A* Point is an instance of such.
  *  - A _circle_ is a two-dimensional shape with a _point_ at its center
  *  - A _dot_ is a small circle to visually represent a point
-->

<script lang="ts">
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
      selectedPoint: null as Point | null,
      selectedLine: null as Line | null,
      lines: [] as Line[],
      stitches: [] as CurveStitches,
      // Debug mode things
      gridDots: [] as Point[],
      stitchedPoints: new Set<ReturnType<Point['toString']>>(),
      stitchColors: new WeakMap<Line, string>(),
      firstLineColor: new Color(0, 127, 255),
      lastLineColor: new Color(180, 15, 127),
    };
  },
  computed: {
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

      // FIXME: clean this up if I decide to formally keep debug mode
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

    isSelected(item: Point | Line): boolean {
      if (Point.isPointLike(item)) {
        return Point.areEqual(this.selectedPoint, item);
      } else if (this.selectedLine) {
        return Line.areEqual(this.selectedLine, item);
      }
      return false;
    },

    selectPoint(point: Point) {
      if (this.selectedPoint === null) {
        // Select first point
        this.selectedPoint = point;
      } else if (this.isSelected(point)) {
        // Deselect
        this.selectedPoint = null;
      } else {
        // Draw line
        this.lines.push(new Line(this.selectedPoint, point));
        this.selectedPoint = null;
      }
    },

    selectLine(line: Line) {
      if (this.selectedLine === null) {
        // Select first line
        this.selectedLine = line;
      } else if (this.isSelected(line)) {
        // Deselect
        this.selectedLine = null;
      } else {
        // Stitch
        this.stitches.push(...this.getStitches(this.selectedLine, line));
        this.selectedLine = null;
      }
    },

    getStitches(lineA: Line, lineB: Line): CurveStitches {
      // NOTE: This only works for horizontal and vertical lines
      // Get the number of grid dots along this line to make it easier to eyeball if the lines are right
      const dynamicResolution = Math.round(lineB.length / (this.size / this.resolution));
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
      :selected-point="selectedPoint"
      @select-point="selectPoint"
      @generated-dots="gridDots = $event"
    />

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
.spine {
  @include tools.color-states(stroke);
  opacity: .25;
  stroke-width: 2;

  &:hover {
    stroke-width: 5;
  }
}

</style>

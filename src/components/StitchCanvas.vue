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
  type PointLike,
  Line,
  stitch,
  type CurveStitches,
  StitchCurveMap,
} from '@/classes';

import {
  type MenuItem,
} from '@/types/ui-interfaces';
import type {
  Integer,
  Pair,
} from '@/types/utility';

import {
  makeIndexLooper,
} from '@/utils';
import {
  convertSVGCoordsToHTML,
} from '@/utils/svg-dom';

import StitchCanvasMenu from './StitchCanvasMenu.vue';
import StitchCanvasSpines from './StitchCanvasSpines.vue';
import StitchCanvasStitches from './StitchCanvasStitches.vue';
import StitchDragDrawSVG from './StitchDragDrawSVG.vue';
import StitchGridDots from './StitchGridDots.vue';


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
    StitchCanvasMenu,
    StitchCanvasSpines,
    StitchCanvasStitches,
    StitchDragDrawSVG,
    StitchGridDots,
  },
  props: {
    // How many dots to show per row/column
    gridDensity: {
      type: Number,
      default: 24,
    },
    // Whether to show the dots or not
    showDots: Boolean,
    debugMode: Boolean,
  },
  data() {
    return {
      size: 1200,
      knownPoints: [
      ] as PointLike[],
      lines: [
      ] as Line[],
      spineStitchMap: new StitchCurveMap(),

      menuCoordinates: null as PointLike | null,
      menuItems: null as MenuItem[] | null,

      // Debug mode things
      stitchedPoints: new Set<ReturnType<Point['toString']>>(),
      stitchColors: new WeakMap<Line, string>(),
      firstLineColor: 'rgb(0, 127, 255)',
      lastLineColor: 'rgb(255, 0, 127)',
      firstColor: Color.fromHexString('#007fff'),
      lastColor: Color.fromHexString('#ff007f'),

      // display controls
      showKnownPoints: true,
      showSpines: true,
    };
  },
  computed: {
    gridSeparation() {
      return this.size / this.gridDensity;
    },
    stitches() {
      return this.spineStitchMap.stitches;
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

    openMenu(coords: PointLike, items: MenuItem[]) {
      const dragDrawSVG = this.$refs.dragDrawSVG as  InstanceType<typeof StitchDragDrawSVG>;
      const svgEl: SVGSVGElement = dragDrawSVG.$el;

      const coordsWithinSVG = convertSVGCoordsToHTML(coords, svgEl);
      this.menuCoordinates = coordsWithinSVG;
      this.menuItems = items;
    },

    clearMenu() {
      this.menuCoordinates = null;
      this.menuItems = null;
    },

    addPoint(point: PointLike) {
      // TODO: should probably ensure uniqueness eventually
      this.knownPoints.push(point);
    },

    removePoint(point: PointLike) {
      const removalIndex = this.knownPoints.indexOf(point);
      if (removalIndex > -1) {
        this.knownPoints.splice(removalIndex, 1);
      }
    },

    addSpine(line: Line) {
      this.lines.push(line);
    },

    removeSpine(spine: Line) {
      const removalIndex = this.lines.indexOf(spine);
      if (removalIndex > -1) {
        this.lines.splice(removalIndex, 1);
      }
    },

    openSpineMenu(spine: Line) {
      this.openMenu(spine.midpoint, [
        {
          label: 'Delete',
          action: () => {
            this.removeSpine(spine);
          },
        },
        {
          label: 'Cancel',
          action: this.clearMenu,
        },
      ]);
    },

    onSpinePairSelected(lineA: Line, lineB: Line) {
      const intersection = Line.getIntersectionPoint(lineA, lineB) as Point;
      const isStitched = this.spineStitchMap.has([lineA, lineB]);
      const stitchAction: MenuItem = isStitched ? {
        label: 'Unstitch',
        action: () => {
          this.spineStitchMap.delete([lineA, lineB]);
        },
      } : {
        label: 'Stitch',
        action: () => {
          this.stitchSpines(lineA, lineB);
        },
      };
      this.openMenu(intersection, [
        stitchAction,
        {
          label: 'Add Intersect Point',
          action: () => {
            this.knownPoints.push(intersection);
          },
        },
        {
          label: 'Cancel',
          action: this.clearMenu,
        },
      ]);
    },

    stitchSpines(lineA: Line, lineB: Line) {
      // Try to avoid the gaps between stitches looking too wide on the longer of the two spines
      const longerLength = Math.max(...[lineA, lineB].map(l => l.length));
      const dynamicResolution = Math.round(longerLength / this.gridSeparation) * 2;

      const newStitches = this.getStitches(lineA, lineB, dynamicResolution);
      this.spineStitchMap.set([lineA, lineB], newStitches);
    },

    getStitches(lineA: Line, lineB: Line, resolution: Integer): CurveStitches {
      const stitches = stitch([lineA, lineB], resolution);
      if (this.debugMode) {
        this.addDebugStitches(stitches);
      } else {
        const colors = this.firstColor.stepsToward(this.lastColor, resolution - 1);
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
  <div class="stitch-canvas-container">
    <div class="stitch-canvas-controls">
      <label>
        <input v-model="showKnownPoints" type="checkbox">
        Show points
      </label>
      <label>
        <input v-model="showSpines" type="checkbox">
        Show spines
      </label>
    </div>
    <StitchDragDrawSVG
      ref="dragDrawSVG"
      :size="size"
      :grid-density="gridDensity"
      :known-points="knownPoints"
      @add-point="addPoint"
      @remove-point="removePoint"
      @line-drawn="addSpine"
    >
      <template v-if="showDots" #behind>
        <!-- NOTE: this is defunct, will probably be replaced by knownPoints-->
        <StitchGridDots
          :grid-size="size"
          :grid-density="gridDensity"
          :debug-mode="debugMode"
          :stitched-points="stitchedPoints"
        />
      </template>

      <g
        v-show="showKnownPoints"
        class="known-points"
      >
        <circle
          v-for="point in knownPoints"
          :key="point.toString()"
          r="2"
          :cx="point.x"
          :cy="point.y"
        />
      </g>

      <StitchCanvasSpines
        v-show="showSpines"
        :lines="lines"
        @pair-selected="onSpinePairSelected"
        @remove-line="openSpineMenu"
      />

      <StitchCanvasStitches
        :stitches="stitches"
        :colors="stitchColors"
      />
    </StitchDragDrawSVG>
    <StitchCanvasMenu
      v-if="menuCoordinates && menuItems"
      :style="{
        '--x': menuCoordinates.x + 'px',
        '--y': menuCoordinates.y + 'px',
      }"
      class="canvas-menu"
      :menu-items="menuItems"
      @close="clearMenu"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tools';

.stitch-canvas-container {
  --gap: 16px;
  display: grid;
  padding: var(--gap);
  gap: var(--gap);
  grid-template:
    'left canvas right'
    / 1fr auto   1fr;
  align-items: stretch;
}

.stitch-canvas-controls {
  justify-self: end;
  display: grid;
  grid-template-columns: max-content;
  grid-auto-rows: max-content;
  gap: var(--gap);
}

.svg-canvas {
  grid-area: canvas;
  overflow: visible;
  background-color: var(--color-background-soft);
  max-height: 90vh;
  max-width: 90vw;
}

.known-points {
  fill: var(--color-heading);
}

.canvas-menu-wrapper {
  overflow: visible;
}

.canvas-menu {
  grid-area: canvas;
  place-self: self-start;
  top: var(--y);
  left: var(--x);
}

</style>

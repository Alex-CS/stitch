<script lang="ts">
import {
  defineComponent,
  withModifiers,
} from 'vue';

import {
  Line,
  type PointLike,
} from '@/classes';

import {
  type EventHandlers,
} from '@/types/utility';
import {
  roundToMultiple,
} from '@/utils';
import { distance } from '@/utils/geometry';
import {
  convertEventCoordsToSVGCoords,
} from '@/utils/svg-dom';


import StitchGridLines from './StitchGridLines.vue';
import StitchLine from './StitchLine.vue';
import StitchMagnetPoint from './StitchMagnetPoint.vue';


enum SnapMode {
  Off = 'OFF',
  Always = 'ALWAYS',
  Magnetic = 'MAGNETIC',
}

const DEFAULT_SNAP_MODE = SnapMode.Magnetic;
// How far away the snap points are "magnetic", as a proportion of the distance between snap points.
// This should stay below .5, otherwise adjacent snap points with have overlapping magnetism
const MAGNETIC_WEIGHT = 0.35;

export default defineComponent({
  name: 'StitchDragDrawSVG',
  components: {
    StitchGridLines,
    StitchLine,
    StitchMagnetPoint,
  },
  props: {
    size: {
      type: Number,
      default: 1000,
    },
    // The number of grid squares to divide each dimension into
    gridDensity: {
      type: Number,
      default: 20,
    },
    showGrid: Boolean,
    snapToGrid: Boolean,
  },
  emits: {
    lineDrawn(line: Line) {
      return Line.isLineLike(line);
    },
  },
  data() {
    return {
      currentLine: null as Line | null,
      cursorExactCoords: { x: 0, y: 0 }, // unmodified svg coordinates of the cursor
    };
  },
  computed: {

    isDrawing() {
      return Line.isLineLike(this.currentLine);
    },

    gridSeparation(): number {
      return this.size / this.gridDensity;
    },

    snapMode(): SnapMode {
      if (this.snapToGrid) {
        return DEFAULT_SNAP_MODE;
      }
      return SnapMode.Off;
    },

    /**
     * How close the cursor needs to be to snap to a grid point in Magnetic mode
     */
    magneticThreshold() {
      return MAGNETIC_WEIGHT * this.gridSeparation;
    },

    /**
     * The closest grid point to the cursor
     * @returns {PointLike}
     */
    cursorGridPoint(): PointLike {
      return this.getClosestGridPoint(this.cursorExactCoords);
    },

    /**
     * The rough coordinates of the cursor, depending on `snapMode`
     */
    cursorPoint(): PointLike {
      const {
        cursorExactCoords: exactPoint,
        cursorGridPoint: gridPoint,
      } = this;

      if (this.snapMode === SnapMode.Always) {
        return gridPoint;
      }

      // Snap if within the threshold distance
      if (this.snapMode === SnapMode.Magnetic) {
        return distance(exactPoint, gridPoint) <= this.magneticThreshold
          ? gridPoint
          : exactPoint;
      }

      return exactPoint;
    },

    /**
     * Events that vary depending on the drawing state
     * @returns {EventHandlers<SVGSVGElementEventMap>}
     */
    currentStateEvents(): EventHandlers<SVGSVGElementEventMap> {
      const drawingHandlers: EventHandlers<SVGSVGElementEventMap> = {
        mouseup: withModifiers(this.finishDrawing, [
          'left',
          'stop',
          'prevent',
        ]),
      };
      const initialHandlers: EventHandlers<SVGSVGElementEventMap> = {
        mousedown: withModifiers(this.beginDrawing, [
          'left',
          'exact', // ignore modifier keys
          'stop',
          'prevent',
        ]),
      };

      return this.isDrawing ? drawingHandlers : initialHandlers;
    },

  },
  mounted() {
  },
  methods: {

    getClosestGridPoint(actualPoint: PointLike): PointLike {
      return {
        x: roundToMultiple(actualPoint.x, this.gridSeparation),
        y: roundToMultiple(actualPoint.y, this.gridSeparation),
      };
    },

    /**
     * Convert a `MouseEvent`'s coordinates into SVG coordinates
     * @param {MouseEvent} mouseEvent
     * @returns {PointLike}
     */
    getCoordinates(mouseEvent: MouseEvent): PointLike {
      const svgCoords = convertEventCoordsToSVGCoords(mouseEvent, this.$el);

      return svgCoords;
    },

    // Line handlers ---------------------------------------------------------

    /**
     * Create a new Line
     */
    startLine() {
      this.currentLine = Line.from({
        start: this.cursorPoint,
        // The transition to the first update is smoother if there's an initial end point
        end: this.cursorExactCoords,
      });
    },

    /**
     * Move the end point of currentLine
     * @param {PointLike} endCoords
     */
    updateLine(endCoords: PointLike) {
      if (this.currentLine === null) return;

      Object.assign(this.currentLine.end, endCoords);
    },


    /**
     * Finalize the current line, store it, and reset `currentLine`
     */
    endLine() {
      if (this.currentLine === null) return;

      this.updateLine(this.cursorPoint);

      if (this.currentLine.length > 0) {
        this.$emit('lineDrawn', this.currentLine);
      }
      this.currentLine = null;
    },

    // Event Handlers --------------------------------------------------------

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beginDrawing(mouseEvent: SVGSVGElementEventMap['mousedown']) {
      this.startLine();
    },

    cursorMoved(mouseEvent: SVGSVGElementEventMap['mousemove']) {
      this.cursorExactCoords = this.getCoordinates(mouseEvent);

      if (this.isDrawing) {
        this.updateLine(this.cursorPoint);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    finishDrawing(mouseEvent: SVGSVGElementEventMap['mouseup']) {
      this.endLine();
    },

  },
});
</script>

<template>
  <svg
    :viewBox="`0 0 ${size} ${size}`"
    :class="{
      drawing: isDrawing,
    }"
    class="svg-canvas"
    v-on="currentStateEvents"
    @mousemove.passive="cursorMoved"
  >
    <slot name="behind" />

    <StitchGridLines
      v-if="showGrid"
      :grid-density="gridDensity"
    />

    <StitchMagnetPoint
      :point="cursorPoint"
      :outer-radius="magneticThreshold"
      :active="cursorPoint === cursorGridPoint && !isDrawing"
    />

    <StitchLine
      v-if="currentLine"
      :line="currentLine"
      class="active"
    />

    <slot />
  </svg>
</template>

<style lang="scss" scoped>


.svg-canvas {

  &.drawing {
    cursor: crosshair;
  }
}
.active {
  color: lightgreen;
}

</style>
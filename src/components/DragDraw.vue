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


enum SnapMode {
  Off = 'OFF',
  Always = 'ALWAYS',
  OnRelease = 'ON_RELEASE',
  Magnetic = 'MAGNETIC',
}

const DEFAULT_SNAP_MODE = SnapMode.Magnetic;

export default defineComponent({
  name: 'DragDraw',
  components: {
    StitchGridLines,
    StitchLine,
  },
  props: {
    // The number of grid squares to divide each dimension into
    gridDensity: {
      type: Number,
      default: 20,
    },
    showGrid: Boolean,
    snapToGrid: Boolean,
  },
  data() {
    return {
      SnapMode,
      gridSize: 200,
      currentLine: null as Line | null,
      finishedLines: [] as Line[],
    };
  },
  computed: {

    isDrawing() {
      return Line.isLineLike(this.currentLine);
    },

    gridSeparation(): number {
      return this.gridSize / this.gridDensity;
    },

    snapMode(): SnapMode {
      if (this.snapToGrid) {
        return DEFAULT_SNAP_MODE;
      }
      return SnapMode.Off;
    },

    magneticThreshold() {
      return 0.25 * this.gridSeparation;
    },

    currentEndGridPoint() {
      return this.currentLine === null
        ? null
        : this.getClosestGridPoint(this.currentLine.end);
    },

    rootEvents(): EventHandlers<SVGSVGElementEventMap> {
      const drawingHandlers: EventHandlers<SVGSVGElementEventMap> = {
        mouseup: withModifiers(this.finishDrawing, [
          'left',
          'stop',
          'prevent',
        ]),
        mousemove: withModifiers(this.cursorMoved, [
          'passive',
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

      if (this.snapMode === SnapMode.Always) {
        return this.getClosestGridPoint(svgCoords);
      }

      if (this.snapMode === SnapMode.Magnetic) {
        const gridPoint = this.getClosestGridPoint(svgCoords);
        const distanceFromGrid = distance(gridPoint, svgCoords);

        // Snap if within the threshold distance
        return distanceFromGrid <= this.magneticThreshold ? gridPoint : svgCoords;
      }

      return svgCoords;
    },

    // Line handlers ---------------------------------------------------------

    /**
     * Create a new Line
     * @param {PointLike} startCoords
     */
    startLine(startCoords: PointLike) {
      this.currentLine = Line.from({
        start: (this.snapMode === SnapMode.OnRelease)
          ? this.getClosestGridPoint(startCoords)
          : startCoords,
        // The transition to the first update is smoother if there's an initial end point
        end: startCoords,
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
     * @param {PointLike} endCoords
     */
    endLine(endCoords: PointLike) {
      if (this.currentLine === null) return;

      if (this.snapMode === SnapMode.OnRelease) {
        this.updateLine(this.getClosestGridPoint(endCoords));
      }

      this.finishedLines.push(this.currentLine);
      this.currentLine = null;
    },

    // Event Handlers --------------------------------------------------------

    beginDrawing(mouseEvent: MouseEvent) {
      this.startLine(this.getCoordinates(mouseEvent));
    },

    cursorMoved(mouseEvent: MouseEvent) {
      this.updateLine(this.getCoordinates(mouseEvent));
    },

    finishDrawing(mouseEvent: MouseEvent) {
      this.endLine(this.getCoordinates(mouseEvent));
    },

  },
});
</script>

<template>
  <svg
    :viewBox="`0 0 ${gridSize} ${gridSize}`"
    v-on="rootEvents"
  >
    <StitchGridLines
      v-if="showGrid"
      :grid-density="gridDensity"
    />

    <circle
      v-if="snapMode === SnapMode.OnRelease && currentEndGridPoint"
      :cx="currentEndGridPoint?.x"
      :cy="currentEndGridPoint?.y"
      r="1"
      class="active"
    />

    <StitchLine
      v-if="currentLine"
      :line="currentLine"
      class="active"
    />

    <g class="completed-lines">
      <StitchLine
        v-for="line in finishedLines"
        :key="line"
        :line="line"
      />
    </g>
  </svg>
</template>

<style>


circle,
line {
  stroke: currentColor;
}

.active {
  color: lightgreen;
}
</style>
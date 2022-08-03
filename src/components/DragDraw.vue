<script lang="ts">
import {
  defineComponent,
  withModifiers,
} from 'vue';

import {
  Line,
  type PointLike,
} from '@/classes';

import StitchGridLines from '@/components/StitchGridLines.vue';
import StitchLine from '@/components/StitchLine.vue';

import {
  type EventHandlers,
} from '@/types/utility';
import {
  roundToMultiple,
} from '@/utils';
import {
  convertEventCoordsToSVGCoords,
} from '@/utils/svg-dom';


enum SnapMode {
  Off = 'OFF',
  Always = 'ALWAYS',
  OnRelease = 'ON_RELEASE',
}

const DEFAULT_SNAP_MODE = SnapMode.OnRelease;

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

    snapMode(): SnapMode {
      if (this.snapToGrid) {
        return DEFAULT_SNAP_MODE;
      }
      return SnapMode.Off;
    },

    gridSeparation(): number {
      return this.gridSize / this.gridDensity;
    },

    currentEndGridPoint() {
      return this.currentLine === null
        ? null
        : this.getClosestGridPoint(this.currentLine.end);
    },

    isDrawing() {
      return Line.isLineLike(this.currentLine);
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

      return svgCoords;
    },

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

    // Event Handlers --------------------------------------------------------

    beginDrawing(mouseEvent: MouseEvent) {
      this.startLine(this.getCoordinates(mouseEvent));
    },

    cursorMoved(mouseEvent: MouseEvent) {
      this.updateLine(this.getCoordinates(mouseEvent));
    },

    finishDrawing() {
      if (this.currentLine === null) { // Something has gone wrong
        return;
      }

      if (this.snapMode === SnapMode.OnRelease) {
        const gridPoint = this.getClosestGridPoint(this.currentLine.end);
        this.updateLine(gridPoint);
      }

      this.finishedLines.push(this.currentLine);
      this.currentLine = null;
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
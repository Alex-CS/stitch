<script lang="ts">
import {
  defineComponent,
  withModifiers,
} from 'vue';

import {
  Line,
  type PointLike,
} from '@/classes';

import StitchLine from '@/components/StitchLine.vue';

import {
  type EventHandlers,
} from '@/types/utility';
import {
  roundToMultiple,
  toPercent,
} from '@/utils';
import {
  convertEventCoordsToSVGCoords,
} from '@/utils/svg-dom';


export default defineComponent({
  name: 'DragDraw',
  components: {
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
      gridSize: 200,
      currentLine: null as Line | null,
      finishedLines: [] as Line[],
    };
  },
  computed: {

    gridSepFraction(): number {
      return 1 / this.gridDensity;
    },

    gridSeparation(): number {
      return this.gridSize / this.gridDensity;
    },

    isDrawing() {
      return Line.isLineLike(this.currentLine);
    },

    drawingEventHandlers(): EventHandlers<SVGSVGElementEventMap> {
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
    toPercent,

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

    /**
     * Create a new Line
     * @param {PointLike} startCoords
     */
    startLine(startCoords: PointLike) {
      this.currentLine = Line.from({
        start: startCoords,
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

      this.finishedLines.push(this.currentLine);
      this.currentLine = null;
    },

  },
});
</script>

<template>
  <svg
    :viewBox="`0 0 ${gridSize} ${gridSize}`"
    v-on="drawingEventHandlers"
  >
    <g v-if="showGrid" class="grid-lines">
      <line
        v-for="i in (gridDensity - 1)"
        :key="`grid-line:v-${i}`"
        :x1="toPercent(gridSepFraction * i, 0)"
        :x2="toPercent(gridSepFraction * i, 0)"
        y1="0%"
        y2="100%"
        class="vertical"
      />

      <line
        v-for="i in (gridDensity - 1)"
        :key="`grid-line:h-${i}`"
        :y1="toPercent(gridSepFraction * i, 0)"
        :y2="toPercent(gridSepFraction * i, 0)"
        x1="0%"
        x2="100%"
        class="horizontal"
      />
    </g>

    <circle
      cx="50%"
      cy="50%"
      r="1"
      stroke="currentColor"
    />
    <StitchLine
      v-if="currentLine"
      :line="currentLine"
      style="color: lightgreen;"
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


.grid-lines {
  stroke-width: 1;
  stroke-opacity: 0.1;
}

line {
  stroke: currentColor;
}
</style>
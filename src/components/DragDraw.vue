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
  getRenderedScaleOfSVG,
  getCoordinateOffset,
} from '@/utils/svg-dom';



export default defineComponent({
  name: 'DragDraw',
  components: {
    StitchLine,
  },
  data() {
    return {
      currentLine: null as Line | null,
      finishedLines: [] as Line[],
    };
  },
  computed: {
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

    /**
     * Convert a `MouseEvent`'s coordinates into SVG coordinates
     * @param {MouseEvent} mouseEvent
     * @returns {PointLike}
     */
    convertMouseToSVGCoords(mouseEvent: MouseEvent): PointLike {
      // DOM Coordinates of the mouse, relative to the top-left corner of the <svg>
      const { offsetX: mouseX, offsetY: mouseY } = mouseEvent;
      // The scale at which the SVG is currently rendered relative to its native dimensions
      const scaleBy = getRenderedScaleOfSVG(this.$el);
      const minCoords = getCoordinateOffset(this.$el);

      return {
        x: (mouseX * scaleBy.x) + minCoords.x,
        y: (mouseY * scaleBy.y) + minCoords.y,
      };
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
      console.debug('beginDrawing');
      this.startLine(this.convertMouseToSVGCoords(mouseEvent));
    },

    cursorMoved(mouseEvent: MouseEvent) {
      console.debug('cursorMoved');
      this.updateLine(this.convertMouseToSVGCoords(mouseEvent));
    },

    finishDrawing() {
      console.debug('finishDrawing');
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
    viewBox="-100 -100 200 200"
    v-on="drawingEventHandlers"
  >
    <circle
      cx="0"
      cy="0"
      r="1"
      stroke="currentColor"
    />
    <StitchLine
      v-if="currentLine"
      :line="currentLine"
      style="color: lightgreen;"
    />
    <g>
      <StitchLine
        v-for="line in finishedLines"
        :key="line"
        :line="line"
      />
    </g>
  </svg>
</template>

<style>
line {
  stroke: currentColor;
}
</style>
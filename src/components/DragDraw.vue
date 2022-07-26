<script lang="ts">
import { defineComponent } from 'vue';

import {
  Line,
  type PointLike,
} from '@/classes';

import StitchLine from '@/components/StitchLine.vue';


export default defineComponent({
  name: 'DragDraw',
  components: {
    StitchLine,
  },
  data() {
    return {
      currentLine: null as Line | null,
      finishedLines: [] as Line[],
      // `scaleBy` is the coordinate conversion ratio between DOM & SVG
      scaleBy: { x: 1, y: 1 },
    };
  },
  mounted() {
  },
  methods: {

    /**
     * Update `scaleBy` with the current ratio between DOM coordinates and SVG coordinates.
     *
     * SVGs [S]cale cleanly because their internal coordinate system is independent of their rendered size.
     * Knowing the ratio between DOM coordinates and internal coordinates allows us to convert back and forth
     *
     * More info: https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement
     */
    updateMouseToSVGScale() {
      // TODO: Need to test this with other external ways of resizing the SVG, and other internal ways of defining the coordinate system
      //      It's only been tested using viewBox internally and getting styled to be 100% width externally
      //      Also, if aspect ratio is preserved, the scale _maaaay_ always be the same in both dimensions
      const svgEl = this.$el as SVGSVGElement;

      const renderedWidth = svgEl.width.baseVal.value;
      const coordinateWidth = svgEl.viewBox.baseVal.width;

      const renderedHeight = svgEl.height.baseVal.value;
      const coordinateHeight = svgEl.viewBox.baseVal.height;

      this.scaleBy.x = coordinateWidth / renderedWidth;
      this.scaleBy.y = coordinateHeight / renderedHeight;
    },

    /**
     * Convert a `MouseEvent`'s coordinates into SVG coordinates
     * @param {MouseEvent} mouseEvent
     * @returns {PointLike}
     */
    convertMouseToSVGCoords(mouseEvent: MouseEvent): PointLike {
      this.updateMouseToSVGScale();
      return {
        x: mouseEvent.offsetX * this.scaleBy.x,
        y: mouseEvent.offsetY * this.scaleBy.y,
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

    beginDrawing(mouseEvent: MouseEvent) {
      console.debug('beginDrawing');
      this.startLine(this.convertMouseToSVGCoords(mouseEvent));
      this.$el.addEventListener('mousemove', this.cursorMoved);
    },

    cursorMoved(mouseEvent: MouseEvent) {
      console.debug('cursorMoved');
      this.updateLine(this.convertMouseToSVGCoords(mouseEvent));
    },

    finishDrawing() {
      console.debug('finishDrawing');
      this.$el.removeEventListener('mousemove', this.cursorMoved, false);
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
    viewBox="0 0 200 200"
    @mousedown="beginDrawing"
    @mouseup="finishDrawing"
  >
    <!-- TODO^: we probably need some modifiers on these listeners to make them more specific -->
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
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
      scaleBy: { x: 1, y: 1 },
    };
  },
  mounted() {
  },
  methods: {

    updateMouseToSVGScale() {
      // TODO: Need to test this with other external ways of resizing the SVG, and other internal ways of defining the coordinate system
      //      It's only been tested using viewBox internally and getting styled to be 100% width externally
      //      Also, if aspect ratio is preserved, the scale _maaaay_ always be the same in both dimensions
      const svgEl = this.$el as SVGSVGElement;

      const coordinateWidth = svgEl.width.baseVal.value;
      const actualWidth = svgEl.viewBox.baseVal.width;

      const coordinateHeight = svgEl.height.baseVal.value;
      const actualHeight = svgEl.viewBox.baseVal.height;

      this.scaleBy.x = actualWidth / coordinateWidth;
      this.scaleBy.y = actualHeight / coordinateHeight;
    },

    convertMouseToSVGCoords(mouseEvent: MouseEvent): PointLike {
      this.updateMouseToSVGScale();
      return {
        x: mouseEvent.offsetX * this.scaleBy.x,
        y: mouseEvent.offsetY * this.scaleBy.y,
      };
    },

    startLine(startCoords: PointLike) {
      this.currentLine = Line.from({
        start: startCoords,
        // Set the end point for a smoother transition
        end: startCoords,
      });
    },

    updateLine(endCoords: PointLike) {
      if (this.currentLine === null) return;

      Object.assign(this.currentLine.end, endCoords);
    },

    startDrawing(mouseEvent: MouseEvent) {
      this.startLine(this.convertMouseToSVGCoords(mouseEvent));
      this.$el.addEventListener('mousemove', this.cursorMoved);
    },

    cursorMoved(mouseEvent: MouseEvent) {
      this.updateLine(this.convertMouseToSVGCoords(mouseEvent));
    },

    endDrawing() {
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
    @mousedown="startDrawing"
    @mouseup="endDrawing"
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
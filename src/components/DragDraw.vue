<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'DragDraw',
  data() {
    return {
      currentLine: null as SVGLineElement | null,
      scaleBy: { x: 1, y: 1 },
    };
  },
  mounted() {
    const svg = this.$el as SVGSVGElement;
    svg.addEventListener('mousedown', this.startDrawing, false);
    svg.addEventListener('mouseup', this.endDrawing, false);
    svg.onresize = () => {
      this.updateScale();
    };
    this.$nextTick(this.updateScale);
  },
  methods: {
    updateScale() {
      // TODO: Need to test this with other external ways of resizing the SVG, and other internal ways of defining the coordinate system
      //      It's only been tested using viewBox internally and getting styled to be 100% width externally
      const svgEl = this.$el as SVGSVGElement;

      const coordinateWidth = svgEl.width.baseVal.value;
      const actualWidth = svgEl.viewBox.baseVal.width;

      const coordinateHeight = svgEl.height.baseVal.value;
      const actualHeight = svgEl.viewBox.baseVal.height;

      this.scaleBy.x = actualWidth / coordinateWidth;
      this.scaleBy.y = actualHeight / coordinateHeight;
    },

    startLine(x: number, y: number) {
      this.currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this.currentLine.setAttribute('x1', `${x}`);
      this.currentLine.setAttribute('y1', `${y}`);

      // Set the end point for a smoother transition
      this.updateLine(x, y);

      this.$el.append(this.currentLine);
    },

    updateLine(x: number, y: number) {
      if (this.currentLine === null) return;

      this.currentLine.setAttribute('x2', `${x}`);
      this.currentLine.setAttribute('y2', `${y}`);
    },

    startDrawing(mouseEvent: MouseEvent) {
      this.updateScale();
      this.startLine(
        mouseEvent.offsetX * this.scaleBy.x,
        mouseEvent.offsetY * this.scaleBy.y,
      );
      this.$el.addEventListener('mousemove', this.cursorMoved);
    },

    cursorMoved(mouseEvent: MouseEvent) {
      this.updateLine(
        mouseEvent.offsetX * this.scaleBy.x,
        mouseEvent.offsetY * this.scaleBy.y,
      );
    },

    endDrawing() {
      this.$el.removeEventListener('mousemove', this.cursorMoved, false);
    },

  },
});
</script>

<template>
  <svg
    viewBox="0 0 200 200"
  >
    <circle
      cx="10"
      cy="10"
      r="1"
      stroke="currentColor"
    />
  </svg>
</template>

<style>
line {
  stroke: currentColor;
}
</style>
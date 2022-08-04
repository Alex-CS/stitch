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
      cursorExactCoords: { x: 0, y: 0 }, // unmodified svg coordinates of the cursor
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

    /**
     * How close the cursor needs to be to snap to a grid point in Magnetic mode
     */
    magneticThreshold() {
      return 0.25 * this.gridSeparation;
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

      this.finishedLines.push(this.currentLine);
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
    :viewBox="`0 0 ${gridSize} ${gridSize}`"
    class="svg-canvas"
    v-on="currentStateEvents"
    @mousemove.passive="cursorMoved"
  >
    <StitchGridLines
      v-if="showGrid"
      :grid-density="gridDensity"
    />

    <g
      :transform="`translate(${cursorPoint.x} ${cursorPoint.y})`"
      class="cursor-point"
    >
      <circle :r="magneticThreshold" class="cursor-point--ring" />
      <circle r="1" class="cursor-point--point" />
    </g>

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

<style scoped>


circle,
line {
  stroke: currentColor;
}
.active {
  color: lightgreen;
}

.cursor-point {
  opacity: 0;
}
.cursor-point:hover {
  opacity: 1;
}

.cursor-point--ring,
.cursor-point--point {
  stroke-width: 0;
}

.cursor-point--point {
  fill: hotpink;
}

</style>
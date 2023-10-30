<script lang="ts">
import {
  defineComponent,
  withModifiers,
  type PropType,
} from 'vue';

import {
  Line,
  Point,
  type PointLike,
} from '@/classes';

import {
  type EventHandlers,
} from '@/types/utility';
import {
  roundToMultiple,
} from '@/utils';
import {
  distance,
} from '@/utils/geometry';
import {
  convertEventCoordsToSVGCoords,
} from '@/utils/svg-dom';


import StitchBullseye from './StitchBullseye.vue';
import StitchGridLines from './StitchGridLines.vue';
import StitchLine from './StitchLine.vue';
import StitchLineInfinite from './StitchLineInfinite.vue';


// TODO: this component honestly probably would be cleaner with the composition API
//       to clean up the event handlers

export enum SnapMode {
  Off = 'OFF',
  Always = 'ALWAYS',
  MagneticGrid = 'MAGNETIC-GRID',
  MagneticKnown = 'MAGNETIC-KNOWN',
}

// How far away the snap points are "magnetic", as a proportion of the distance between snap points.
// This should stay below .5, otherwise adjacent snap points with have overlapping magnetism
const MAGNETIC_WEIGHT = 0.35;

/**
 * If a point is within a given radius of a magnetic point, snap it to that
 * @param {PointLike} point
 * @param {PointLike} magneticPoint
 * @param {number} magneticRadius
 * @return {PointLike}
 */
function magnetize(point: PointLike, magneticPoint: PointLike, magneticRadius: number): PointLike {
  return distance(point, magneticPoint) <= magneticRadius
    ? magneticPoint
    : point;
}

export default defineComponent({
  name: 'StitchDragDrawSVG',
  components: {
    StitchGridLines,
    StitchLine,
    StitchLineInfinite,
    StitchBullseye,
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
    snapMode: {
      type: String as PropType<SnapMode>,
      default: SnapMode.MagneticKnown,
    },
    showGrid: Boolean,
  },
  emits: {
    lineDrawn(line: Line) {
      return Line.isLineLike(line);
    },
  },
  data() {
    // TODO: this component honestly probably would be cleaner with the composition API
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

    return {
      drawingHandlers,
      initialHandlers,
      currentLine: null as Line | null,
      cursorExactCoords: { x: 0, y: 0 }, // unmodified svg coordinates of the cursor
      knownPoints: [] as PointLike[],
    };
  },
  computed: {

    isDrawing() {
      return Line.isLineLike(this.currentLine);
    },

    gridSeparation(): number {
      return this.size / this.gridDensity;
    },

    /**
     * How close the cursor needs to be to snap to a grid point in MagneticGrid mode
     */
    magneticThreshold() {
      return MAGNETIC_WEIGHT * this.gridSeparation;
    },

    /**
     * The closest grid point to the cursor
     * @returns {PointLike}
     */
    cursorGridPoint(): PointLike {
      // TODO: this may only need to be reactive in a grid type mode
      return this.getClosestGridPoint(this.cursorExactCoords);
    },

    /**
     * The rough coordinates of the cursor, depending on `snapMode`
     */
    cursorPoint(): PointLike {

      if (this.snapMode === SnapMode.Always) {
        return this.cursorGridPoint;
      }

      // Snap if within the threshold distance
      if (this.snapMode === SnapMode.MagneticGrid) {
        return magnetize(this.cursorExactCoords, this.cursorGridPoint, this.magneticThreshold);
      }

      // Snap if within the threshold of another point
      if (this.snapMode === SnapMode.MagneticKnown && this.knownPoints.length) {
        const closestKnown = Point.closestTo(this.cursorExactCoords, this.knownPoints) as PointLike;
        return magnetize(this.cursorExactCoords, closestKnown, this.magneticThreshold);
      }

      return this.cursorExactCoords;
    },

    /**
     * Events that vary depending on the drawing state
     * @returns {EventHandlers<SVGSVGElementEventMap>}
     */
    currentStateEvents(): EventHandlers<SVGSVGElementEventMap> {

      return this.isDrawing ? this.drawingHandlers : this.initialHandlers;
    },

    guideLines(): { x: Set<number>, y: Set<number> } {
      const lines = {
        x: new Set<number>(),
        y: new Set<number>(),
      };

      this.knownPoints.forEach(({ x, y }) => {
        lines.x.add(x);
        lines.y.add(y);
      });

      return lines;
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
      this.knownPoints.push(this.cursorPoint);
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

      if (this.currentLine.length > this.magneticThreshold) {
        this.$emit('lineDrawn', this.currentLine);
        this.knownPoints.push(this.cursorPoint);
      } else {
        this.knownPoints.pop();
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

    <StitchLineInfinite
      v-if="guideLines.x.has(cursorPoint.x)"
      :x="cursorPoint.x"
      class="guide-line"
    />
    <StitchLineInfinite
      v-if="guideLines.y.has(cursorPoint.y)"
      :y="cursorPoint.y"
      class="guide-line"
    />

    <slot />

    <StitchBullseye
      v-if="cursorPoint !== cursorExactCoords"
      :point="cursorPoint"
      :outer-radius="magneticThreshold"
      active
    />

    <StitchLine
      v-if="currentLine"
      :line="currentLine"
      class="active"
    />
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

.guide-line {
  opacity: 0.7;
  stroke-dasharray: 0 10 0;
}

</style>
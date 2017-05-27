<template>
  <svg :width="width" :height="height">
    <template v-for="row in rows">
      <template v-for="point in row">
        <circle r="3"
                :class="{ active: isSelected(point) }"
                :cx="point.x"
                :cy="point.y"
                v-on:click="select(point)">
          <!-- TODO: need some affordance for less precise clicks -->
        </circle>
      </template>
    </template>
    <template v-for="line, i in lines">
      <s-line :line="line" :class="{ active: i === lines.length - 1 }"/>
    </template>
  </svg>
</template>

<script>
  import SLine from './SLine';
  import { Point, Line } from '../classes';
  import { mapInRange } from '../utils';

  export default {
    name: 'grid-canvas',
    components: {
      SLine,
    },
    props: {
      resolution: Number,
      size: Number,
    },
    data() {
      return {
        width: this.size,
        height: this.size,
        selected: null,
        lines: [],
      };
    },
    computed: {
      rows() {
        // FIXME There's gotta be a better way to get the points than this nested thing
        return mapInRange(this.resolution, i => (
          mapInRange(this.resolution, j => ({
            x: this.getX(j),
            y: this.getY(i),
          }))
        ));
      },
    },
    methods: {
      // '+ 1's are for spacing around edges
      getX(i) {
        return (this.width / (this.resolution + 1)) * (i + 1);
      },
      getY(i) {
        return (this.height / (this.resolution + 1)) * (i + 1);
      },
      isSelected(point) {
        if (this.selected) {
          return Point.prototype.equals.call(this.selected, point);
        }
        return false;
      },
      select(point) {
        const { x, y } = point;
        // TODO order these better
        if (this.isSelected(point)) {
          // Deselect
          console.log(`Deselect { x: ${x}, y: ${y} }`);
          this.selected = null;
        } else if (this.selected) {
          // Draw line
          this.lines.push(new Line(this.selected, point));
          this.selected = null;
        } else {
          // Select first point
          console.log(`Select { x: ${x}, y: ${y} }`);
          this.selected = { x, y };
        }
      },
    },
  };
</script>

<style scoped>
  circle {
    fill: #aaaaaa;
    cursor: pointer;
  }
  line {
    stroke: #aaaaaa;
  }
  .active {
    fill: royalblue;
  }
</style>

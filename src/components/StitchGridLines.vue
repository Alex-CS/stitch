<script lang="ts">
import {
  defineComponent,
} from 'vue';

import {
  mapInRange,
  toPercent,
} from '@/utils';


export default defineComponent({
  name: 'StitchGridLines',
  props: {
    gridDensity: {
      type: Number,
      required: true,
    },
  },
  computed: {

    gridSteps(): string[] {
      return mapInRange(1, this.gridDensity, (i) => {
        return toPercent(i / this.gridDensity, 0);
      });
    },

  },
});
</script>

<template>
  <g class="grid-lines">
    <line
      v-for="(x, i) in gridSteps"
      :key="`grid-line:v-${i}`"
      :x1="x"
      :x2="x"
      y1="0%"
      y2="100%"
      class="vertical"
    />

    <line
      v-for="(y, i) in gridSteps"
      :key="`grid-line:h-${i}`"
      :y1="y"
      :y2="y"
      x1="0%"
      x2="100%"
      class="horizontal"
    />
  </g>
</template>

<style scoped>


.grid-lines {
  stroke: currentColor;
  stroke-width: 1;
  stroke-opacity: 0.5;
}
</style>
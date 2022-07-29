<script lang="ts">
import {
  defineComponent,
} from 'vue';

import {
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


  },
  methods: {
    toPercent,

  },
});
</script>

<template>
  <g class="grid-lines">
    <line
      v-for="i in (gridDensity - 1)"
      :key="`grid-line:v-${i}`"
      :x1="toPercent(i / gridDensity, 0)"
      :x2="toPercent(i / gridDensity, 0)"
      y1="0%"
      y2="100%"
      class="vertical"
    />

    <line
      v-for="i in (gridDensity - 1)"
      :key="`grid-line:h-${i}`"
      :y1="toPercent(i / gridDensity, 0)"
      :y2="toPercent(i / gridDensity, 0)"
      x1="0%"
      x2="100%"
      class="horizontal"
    />
  </g>
</template>

<style>


.grid-lines {
  stroke-width: 1;
  stroke-opacity: 0.1;
}
</style>
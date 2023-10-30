<script lang="ts">
import {
  defineComponent,
  type PropType,
} from 'vue';

import {
  type Line,
} from '@/classes';

import StitchLine from './StitchLine.vue';


export default defineComponent({
  name: 'StitchCanvasStitches',
  components: {
    StitchLine,
  },
  props: {
    stitches: {
      type: Array as PropType<Line[]>,
      required: true,
    },
    colors: {
      type: WeakMap as PropType<null | WeakMap<Line, string>>,
      default: null,
    },
  },
});
</script>

<template>
  <g class="stitches">
    <StitchLine
      v-for="(stitch) in stitches"
      :key="stitch.toString()"
      :line="stitch"
      :style="{
        stroke: colors?.get(stitch),
      }"
    />
  </g>
</template>

<style scoped>

</style>
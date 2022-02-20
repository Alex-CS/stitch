<script lang="ts">
import {
  defineComponent,
  type PropType,
} from 'vue';

import {
  type ICurveOptionsStrict,
  type SpectrumParams,
} from '@/classes';
import { CURVE_TYPES } from '@/constants';
import { mapInRange } from '@/utils';

import StitchCurve from './StitchCurve.vue';


export default defineComponent({
  name: 'StitchMultiCurve',
  components: {
    StitchCurve,
  },
  props: {
    options: {
      type: Object as PropType<ICurveOptionsStrict>,
      required: true,
    },
    colors: {
      type: Array as PropType<SpectrumParams>,
      required: true,
    },
    curveType: {
      type: String,
      default: CURVE_TYPES.Star,
    },
    reps: {
      type: Number,
      default: 1,
    },
    radius: {
      type: Number,
      default: 0,
    },
    initial: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    allCurveOptions(): ICurveOptionsStrict[] {
      const { options, reps, radius, initial } = this;
      return mapInRange(reps, (i) => {
        const rotation = (i / reps) + initial;
        const center = options.center.getRelativePoint(rotation, radius);
        const opts = {
          ...options,
          center,
          resolution: options.resolution / 2,
          rotation: options.rotation + rotation,
          width: options.width / 2,
          height: options.height / 2,
        };
        return opts;
      });
    },
  },
});
</script>

<template>
  <g class="multi-curve">
    <StitchCurve
      v-for="opts in allCurveOptions"
      :key="opts"
      :options="opts"
      :curve-type="curveType"
      :colors="colors"
    />
  </g>
</template>

<style>
</style>

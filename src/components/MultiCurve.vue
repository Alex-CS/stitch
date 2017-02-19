<template>
  <g class="multi-curve">
    <template v-for="opts in allCurveOptions">
      <curve :options="opts" :curve-type="curveType"/>
    </template>
  </g>
</template>

<script type="text/babel">
  import { mapInRange } from '../utils';
  import {
    Point,
  } from '../classes';
  import Curve from './Curve';

  export default {
    name: 'multi-curve',
    components: {
      Curve,
    },
    props: {
      options: Object,
      curveType: String,
      reps: Number,
      radius: [Number, Point],
      initial: {
        type: Number,
        default: 0,
      },
    },
    data() {
      return {
      };
    },
    computed: {
      allCurveOptions() {
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
  };
</script>

<style>
</style>

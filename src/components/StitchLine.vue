<script lang="ts">
import {
  defineComponent,
} from 'vue';

import {
  Point,
  Line,
} from '@/classes';


export default defineComponent({
  name: 'StitchLine',
  props: {
    line: Line,
    point1: Point,
    point2: Point,
  },
  computed: {
    startPoint() {
      return this.line?.start ?? this.point1;
    },
    endPoint() {
      return this.line?.end ?? this.point2;
    },
  },
  watch: {
    startPoint: 'onPointsChange',
    endPoint: 'onPointsChange',
  },
  methods: {
    onPointsChange() {
      const { startPoint, endPoint } = this;

      if (!startPoint || !endPoint) {
        console.warn('StitchLine will not render without two Points, or a Line!');
        console.warn('Received:', this.$props);
      }
    },
  },
});
</script>

<template>
  <line
    v-if="startPoint && endPoint"
    :x1="startPoint.x"
    :y1="startPoint.y"
    :x2="endPoint.x"
    :y2="endPoint.y"
  />
</template>

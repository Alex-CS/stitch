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
  data() {
    const startPoint = this.line?.start ?? this.point1;
    const endPoint = this.line?.end ?? this.point2;

    if (!startPoint || !endPoint) {
      console.warn('StitchLine will not render without two Points, or a Line!');
      console.warn('Received:', this.$props);
    }

    return {
      startPoint,
      endPoint,
    };
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

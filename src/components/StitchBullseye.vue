<script lang="ts">
import {
  defineComponent,
  type PropType,
} from 'vue';

import {
  type PointLike,
} from '@/classes';


export default defineComponent({
  name: 'StitchBullseye',
  props: {
    point: {
      type: Object as PropType<PointLike>,
      required: true,
    },
    outerRadius: {
      type: Number,
      required: true,
    },
    active: Boolean,
  },
});
</script>

<template>
  <g
    :transform="`translate(${point.x} ${point.y})`"
    :class="{
      active,
    }"
    class="cursor-point"
    pointer-events="none"
  >
    <circle :r="outerRadius" class="ring" />
    <circle r="1" class="point" />
  </g>
</template>

<style lang="scss" scoped>


.cursor-point {
  stroke: transparent;
  fill: transparent;
  opacity: 0;

  // "active" only matters if the cursor is actually within the canvas
  svg:hover &.active {
    opacity: 1;
  }
}

.ring {
  stroke: currentColor;
}

.point {
  fill: currentColor;
}

</style>
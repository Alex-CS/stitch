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
  <circle
    :transform="`translate(${point.x} ${point.y})`"
    :class="{
      active,
    }"
    class="cursor-point"
    :r="outerRadius"
  />
</template>

<style lang="scss" scoped>


.cursor-point {
  fill: url(#gradient--bullseye);
  opacity: 0;

  // "active" only matters if the cursor is actually within the canvas
  svg:hover &.active {
    opacity: 1;
  }
}

</style>
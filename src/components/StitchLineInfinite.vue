<script setup lang="ts">
import {
  computed,
} from 'vue';


/**
 * Creates an edge-to-edge SVG line, either vertically if provided `x`
 * or horizontally if provided `y`
 */
const props = defineProps<{
  x?: number,
  y?: number,
}>();

/**
 * svg <line> attributes
 */
const defaultAttrs = {
  x1: '0',
  x2: '100%',
  y1: '0',
  y2: '100%',
};

const coordAttrs = computed(() => {
  let { x1, y1, x2, y2 } = defaultAttrs;

  if (props.x) {
    x1 = x2 = String(props.x);
  } else if (props.y) {
    y1 = y2 = String(props.y);
  }
  return { x1, y1, x2, y2 };
});

</script>

<template>
  <line v-if="x || y" v-bind="coordAttrs" />
</template>

<style scoped lang="scss">

</style>
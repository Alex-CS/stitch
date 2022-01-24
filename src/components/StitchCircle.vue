<template>
  <circle
    :cx="center.x"
    :cy="center.y"
    :r="radius"
    :stroke="color"
    :fill="color"
  />
</template>

<script>
import { Point } from '../classes';

export default {
  name: 'StitchCircle',
  props: {
    radius: Number,
    center: Point,
    color: String,
  },
};
</script>

<style>
</style>

<template>
  <circle
    :cx="center.x"
    :cy="center.y"
    :r="radius"
    :stroke="color"
    :fill="color"
  />
</template>

<script type="text/babel">
  import { Point } from '../classes';

  export default {
    name: 's-circle',
    props: {
      radius: Number,
      center: Point,
      color: String,
    },
  };
</script>

<style>
</style>

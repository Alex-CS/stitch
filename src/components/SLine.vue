<template>
  <line
    v-if="startPoint && endPoint"
    :x1="startPoint.x"
    :y1="startPoint.y"
    :x2="endPoint.x"
    :y2="endPoint.y"
    :title="title"
  />
</template>

<script type="text/babel">
  import { Point, Line } from '../classes';

  export default {
    name: 's-line',
    props: {
      line: Line,
      point1: Point,
      point2: Point,
      title: String,
    },
    data() {
      const startPoint = this.line ? this.line.start : this.point1;
      const endPoint = this.line ? this.line.end : this.point2;

      return {
        startPoint,
        endPoint,
      };
    },
    methods: {
    },
  };
</script>

<style>
</style>

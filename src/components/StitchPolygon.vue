<template>
  <polygon :points="points" fill="none"/>
</template>

<script>
export default {
  name: 'StitchPolygon',
  props: {
    vertices: Array,
  },
  computed: {
    points() {
      const pairs = this.vertices.map(({ x, y }) => `${x},${y}`);
      return pairs.join(' ');
    },
  },
};
</script>

<style>
</style>

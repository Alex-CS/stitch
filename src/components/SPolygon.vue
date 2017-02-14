<template>
  <polygon :points="points" fill="none"/>
</template>

<script type="text/babel">
  export default {
    name: 's-polygon',
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

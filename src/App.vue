<template>
  <div id="app">
    <svg :width="size" :height="size">
    </svg>
  </div>
</template>

<script type="text/babel">

export default {
  name: 'app',
  components: {
  },
  data() {
    return {
      size: '800'
    };
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

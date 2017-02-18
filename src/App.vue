<template>
  <div id="app">
    <svg :width="size" :height="size">
      <curve
        :options="options"
        :curve-type="curveType"
      />
    </svg>
  </div>
</template>

<script type="text/babel">
  import { CURVE_TYPES } from './constants';
  import {
    Color,
    Point,
  } from './classes';
  import SCircle from './components/SCircle';
  import Curve from './components/Curve';

  export default {
    name: 'app',
    components: {
      SCircle,
      Curve,
    },
    data() {
      const size = 600;
      const startColor = new Color(0, 127, 255);
      const endColor = new Color(0, 255, 63);
      return {
        CURVE_TYPES,
        size,
        curveType: CURVE_TYPES.Polygon,
        options: {
          resolution: 16,
          numVertices: 4,
          layerCount: 4,
          layerSepFactor: 1.5,
          width: size,
          height: size,
          rotation: 1 / 8,
          showSpines: false,
          colors: [startColor, endColor],
          center: new Point(size / 2, size / 2),
        },
      };
    },
    computed: {
    },
    methods: {
    },
  };
</script>

<style>
  body {
    margin: 0;
  }
  #app {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

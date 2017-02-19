<template>
  <div id="app">
    <svg :width="size" :height="size">
      <multi-curve
        :options="options"
        :curve-type="curveType"
        :reps="4"
        :radius="size/4"
        :initial="2/16"
      />
    </svg>
    <select v-model="curveType">
      <option :value="CURVE_TYPES.Poly">Polygon</option>
      <option :value="CURVE_TYPES.Star">Star</option>
      <option :value="CURVE_TYPES.Elli">Ellipse</option>
    </select>
  </div>
</template>

<script type="text/babel">
  import { CURVE_TYPES } from './constants';
  import {
    Color,
    Point,
  } from './classes';
  import Curve from './components/Curve';
  import MultiCurve from './components/MultiCurve';
  import SCircle from './components/SCircle';

  export default {
    name: 'app',
    components: {
      Curve,
      MultiCurve,
      SCircle,
    },
    data() {
      const size = 800;
      const startColor = new Color(0, 127, 255);
      const endColor = new Color(255, 0, 127, 0.6);
      return {
        CURVE_TYPES,
        size,
        curveType: CURVE_TYPES.Star,
        options: {
          resolution: 32,
          numVertices: 4,
          layerCount: 4,
          layerSepFactor: 1,
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

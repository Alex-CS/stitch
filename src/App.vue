<template>
  <div id="app">
    <svg :width="size" :height="size">
      <!--<multi-curve-->
        <!--:options="options"-->
        <!--:curve-type="curveType"-->
        <!--:reps="reps"-->
        <!--:radius="radius"-->
        <!--:initial="initial"-->
      <!--/>-->
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
        curveType: CURVE_TYPES.Elli,
        reps: 4,
        radius: size / 8,
        initial: 0 / 16,
        options: {
          resolution: 16,
          numVertices: 4,
          layerCount: 1,
          layerSepFactor: 1,
          width: size / 2,
          height: size / 2,
          rotation: 2 / 16,
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
  svg {
    overflow: auto;
  }
</style>

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
        :colors="colors"
      />
    </svg>
    <div class="controls">
      <div>
        <label>layerCount</label>
        <input type="range"
               v-model="options.layerCount"
               min="1"
               max="8">
        <span>{{ options.layerCount }}</span>
      </div>
      <div>
        <label>layerSepFactor</label>
        <input type="range"
               v-model="options.layerSepFactor"
               min="1"
               max="8">
        <span>{{ options.layerSepFactor }}</span>
      </div>
      <div>
        <label>numVertices</label>
        <input type="range"
               v-model="options.numVertices"
               min="3"
               max="8">
        <span>{{ options.numVertices }}</span>
      </div>
      <div>
        <label>resolution</label>
        <input type="range"
               v-model="options.resolution"
               min="4"
               max="64">
        <span>{{ options.resolution }}</span>
      </div>
    </div>
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
      const size = 600;
      const startColor = new Color(0, 127, 255);
      const endColor = new Color(180, 0, 127);
      return {
        CURVE_TYPES,
        size,
        curveType: CURVE_TYPES.Poly,
        reps: 4,
        radius: size / 8,
        initial: 0 / 16,
        colors: [startColor, endColor],
        options: {
          resolution: 16,
          numVertices: 4,
          layerCount: 3,
          layerSepFactor: 1,
          width: size,
          height: size,
          rotation: 2 / 16,
          showSpines: false,
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

<style lang="scss">
  body {
    margin: 0;
  }
  #app {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 10px;
  }
  svg {
    overflow: auto;
  }
  .controls {
    align-self: flex-end;
    display: flex;
    flex-direction: column;

    div {
      text-align: end;
    }
  }
</style>

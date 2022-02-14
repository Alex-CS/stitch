<template>
  <div id="app">
    <!--<svg :width="size" :height="size">
      <StitchMultiCurve
        :options="options"
        :curve-type="curveType"
        :reps="reps"
        :radius="radius"
        :initial="initial"
        :colors="colors"
      />
    </svg>-->
    <StitchCanvas :resolution="20" :size="600"/>
    <div class="controls">
      <!--<div>
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
      <div>
        <label>rotation</label>
        <input type="range"
               v-model="options.rotation"
               min="0"
               max="1"
               :step="1/8">
        <span>{{ options.rotation * 360 }}</span>
      </div>-->
    </div>
  </div>
</template>

<script>
import {
  Color,
  Point,
} from '@/classes';
import { CURVE_TYPES } from '@/constants';

import StitchCanvas from './components/StitchCanvas.vue';
import StitchMultiCurve from './components/StitchMultiCurve.vue';


export default {
  name: 'App',
  components: {
    StitchCanvas,
    StitchMultiCurve,
  },
  data() {
    const size = 600;
    const startColor = new Color(0, 127, 255);
    const endColor = new Color(180, 0, 127);
    return {
      CURVE_TYPES,
      size,
      curveType: CURVE_TYPES.Elli,
      reps: 4,
      radius: size / 8,
      initial: 0 / 16,
      colors: [startColor, endColor],
      options: {
        resolution: 24,
        numVertices: 6,
        layerCount: 8,
        layerSepFactor: 3,
        width: size,
        height: size,
        rotation: 4 / 16,
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
@import './assets/base.css';

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

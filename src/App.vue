<script lang="ts">
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
      mode: 'canvas',
    };
  },
  computed: {
  },
  methods: {
  },
};
</script>

<template>
  <div id="app">
    <div class="ModeToggle">
      <label>
        <input
          v-model="mode"
          type="radio"
          name="mode"
          value="canvas"
        >
        Canvas
      </label>
      <label>
        <input
          v-model="mode"
          type="radio"
          name="mode"
          value="config"
        >
        Config
      </label>
    </div>
    <StitchCanvas
      v-if="mode === 'canvas'"
      :resolution="20"
      :size="size"
    />
    <template v-else>
      <svg :width="size" :height="size">
        <StitchMultiCurve
          :options="options"
          :curve-type="curveType"
          :reps="reps"
          :radius="radius"
          :initial="initial"
          :colors="colors"
        />
      </svg>
      <div class="controls">
        <div>
          <label>layerCount</label>
          <input
            v-model="options.layerCount"
            type="range"
            min="1"
            max="8"
          >
          <span>{{ options.layerCount }}</span>
        </div>
        <div>
          <label>layerSepFactor</label>
          <input
            v-model="options.layerSepFactor"
            type="range"
            min="1"
            max="8"
          >
          <span>{{ options.layerSepFactor }}</span>
        </div>
        <div>
          <label>numVertices</label>
          <input
            v-model="options.numVertices"
            type="range"
            min="3"
            max="8"
          >
          <span>{{ options.numVertices }}</span>
        </div>
        <div>
          <label>resolution</label>
          <input
            v-model="options.resolution"
            type="range"
            min="4"
            max="64"
          >
          <span>{{ options.resolution }}</span>
        </div>
        <div>
          <label>rotation</label>
          <input
            v-model="options.rotation"
            type="range"
            min="0"
            max="1"
            :step="1/8"
          >
          <span>{{ options.rotation * 360 }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
@import './assets/base.css';

body {
  margin: 0;
}
#app {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 10px;
}

.ModeToggle {
  display: flex;
  gap: 5vw;
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

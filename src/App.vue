<script lang="ts">
import {
  defineComponent,
} from 'vue';

import {
  Color,
  Point,
} from '@/classes';
import { CURVE_TYPES } from '@/constants';

import StitchCanvas from './components/StitchCanvas.vue';
import StitchMultiCurve from './components/StitchMultiCurve.vue';
import StitchMultiCurveControls from './components/StitchMultiCurveControls.vue';


export default defineComponent({
  name: 'App',
  components: {
    StitchCanvas,
    StitchMultiCurve,
    StitchMultiCurveControls,
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
});
</script>

<template>
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
  />
  <div v-else>
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
    <StitchMultiCurveControls v-model="options" />
  </div>
</template>

<style lang="scss">
@import './assets/base.css';

body {
  margin: 0;
}
#app {
  height: 100vh;
  display: grid;
  grid-template:
    'controls' max-content
    'main' 1fr /
     1fr;
  padding: 10px;
}

.ModeToggle {
  justify-self: center;
  display: flex;
  gap: 5vw;
  margin-bottom: 10px;
}

svg {
  overflow: auto;
}

</style>

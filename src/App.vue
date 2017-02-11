<template>
  <div id="app">
    <svg :width="size" :height="size" :style="{ width: size, height: size, }">
      <g :transform="curveTransformation" class="curve">
        <template v-for="layer in polyLayers.members">
          <g :stroke="layer.attributes.stroke">
            <template v-for="line in layer.members">
              <s-line :line="line" />
            </template>
          </g>
        </template>
      </g>
    </svg>
  </div>
</template>

<script type="text/babel">
  import {
    Color,
    Point,
    PolygonCurve,
    Spectrum,
  } from './classes';
  import SLine from './components/SLine';

  export default {
    name: 'app',
    components: {
      SLine,
    },
    data() {
      const size = 800;
      const blue = new Color(0, 127, 255);
      const green = new Color(0, 255, 0);
      return {
        size,
        resolution: 16,
        numVertices: 6,
        layerCount: 3,
        layerSepFactor: 3,
        width: size,
        height: size,
        rotation: 0,
        showSpines: false,
        spectrum: new Spectrum(blue, green),
        center: new Point(size / 2, size / 2),
      };
    },
    computed: {
      polyCurve() {
        return new PolygonCurve(this);
      },
      polyLayers() {
        return this.polyCurve.stitch();
      },
      curveTransformation() {
        const rotation = 0; // this.rotation;
        const { x, y } = this.center;
        return (
          `translate(${x} ${y}) rotate(${360 * rotation})`
        );
      },
    },
    methods: {},
  };
</script>

<style>
  #app svg {
    margin: auto;
  }
</style>

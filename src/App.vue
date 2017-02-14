<template>
  <div id="app">
    <svg :width="size" :height="size">
      <!--<curve-->
        <!--:transform="curveTransformation"-->
        <!--:group="polyLayers"-->
      <!--/>-->
      <curve
        :transform="curveTransformation"
        :group="starLayers"
      />
    </svg>
  </div>
</template>

<script type="text/babel">
  import {
    Color,
    Point,
    PolygonCurve,
    StarCurve,
    Spectrum,
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
      const size = 800;
      const blue = new Color(0, 127, 255, 0.75);
      const green = new Color(0, 255, 63);
      return {
        size,
        options: {
          resolution: 16,
          numVertices: 4,
          layerCount: 2,
          layerSepFactor: 1,
          width: size * (3 / 4),
          height: size * (3 / 4),
          rotation: 1 / 4, // TODO This doesn't do anything so far
          showSpines: true,
          spectrum: new Spectrum(blue, green),
          center: new Point(size / 2, size / 2),
        },
      };
    },
    computed: {
      polyCurve() {
        return new PolygonCurve(this.options);
      },
      polyLayers() {
        return this.polyCurve.stitch();
      },
      starCurve() {
        return new StarCurve(this.options);
      },
      starLayers() {
        const layers = this.starCurve.stitch();
        return layers;
      },
      curveTransformation() {
        const rotation = this.options.rotation;
        const { x, y } = this.options.center;
        return (
          `translate(${x} ${y}) rotate(${360 * rotation})`
        );
      },
    },
    methods: {},
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

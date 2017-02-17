<template>
  <div id="app">
    <svg :width="size" :height="size">
      <!--<curve-->
      <!--:transform="curveTransformation"-->
      <!--:group="polyLayers"-->
      <!--/>-->
      <!--<curve-->
        <!--:transform="curveTransformation"-->
        <!--:group="starLayers"-->
      <!--/>-->
      <curve
        :transform="curveTransformation"
        :group="ellipseLayers"
      />
    </svg>
  </div>
</template>

<script type="text/babel">
  // import now from 'lodash/now';

  import {
    Color,
    EllipseCurve,
    Point,
    PolygonCurve,
    StarCurve,
    Spectrum,
  } from './classes';
  import SCircle from './components/SCircle';
  import Curve from './components/Curve';


  /**
   * Wrap a function and time it when it's invoked
   * @param {function(...[*])} fn
   * @return {function(...[*])}
   */
  // function timeIt(fn) {
  //   return (...args) => {
  //     const start = now();
  //     const result = fn(...args);
  //     console.debug(`${fn.name}(${args}) took ${(now() - start) / 1000}s`);
  //     return result;
  //   };
  // }

  export default {
    name: 'app',
    components: {
      SCircle,
      Curve,
    },
    data() {
      const size = 800;
      const startColor = new Color(0, 127, 255, 0.75);
      const endColor = new Color(0, 255, 63);
      return {
        size,
        options: {
          resolution: 32,
          numVertices: 4,
          layerCount: 4,
          layerSepFactor: 1,
          width: size * (3 / 4),
          height: size * (3 / 4),
          rotation: 1 / 4, // TODO This doesn't do anything so far
          showSpines: false,
          spectrum: new Spectrum(startColor, endColor),
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
        return this.starCurve.stitch();
      },
      ellipseCurve() {
        return new EllipseCurve(this.options);
      },
      ellipseLayers() {
        return this.ellipseCurve.stitch();
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

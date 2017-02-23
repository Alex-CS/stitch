<template>
  <g class="curve" :transform="transform">
    <template v-for="(layer, layerIndex) in layers.members">
      <g class="layer" :stroke-opacity="getOpacity(layerIndex)">
        <template v-for="(line, index) in layer">
          <s-line :line="line" :stroke="getColor(layerIndex, index)"/>
        </template>
      </g>
    </template>
  </g>
</template>

<script type="text/babel">
  import {
    Spectrum,
    makeCurve,
  } from '../classes';
  import SLine from './SLine';

  export default {
    name: 'curve',
    components: {
      SLine,
    },
    props: {
      options: Object,
      curveType: String,
      rotation: Number,
      translation: String,
      colors: Array,
    },
    data() {
      return {
        spectrum: new Spectrum(...this.colors),
      };
    },
    computed: {
      curve() {
        return makeCurve(this.curveType, this.options);
      },
      layers() {
        return this.curve.stitch();
      },
      transform() {
        // FIXME: Get rid of this mess by consuming rotation in the Curve class
        const { rotation, center } = this.options;
        const translation = this.translation || `${center.x} ${center.y}`;
        return (
          `rotate(${360 * (this.rotation || rotation)} ${translation})`
        );
      },
      layerSpectra() {
        if (!this.layers || !this.colors) {
          return [];
        }
        const layerCount = this.options.layerCount;
        return this.layers.members.map((layer, layerIndex) => {
          const len = layer.length;
          const colors = this.spectrum.clone().segmentColors(len).colors;
          const layerShift = ((layerIndex + 1) / layerCount) * len;
          return colors.map((color, i) => {
            const shiftedColor = colors[Math.floor(i + 1 + layerShift) % len];
            return shiftedColor.toRGBAString();
          });
        });
      },
    },
    methods: {
      makeTitle(layerNum, index) {
        return `${this.curveType}-layer${layerNum}-line${index}`;
      },
      getColor(indexOfLayer, indexInLayer) {
        return this.layerSpectra[indexOfLayer][indexInLayer];
      },
      getOpacity(index) {
        const range = 0.6;
        const min = 0.4;
        return parseFloat(((range / (index + 1)) + min).toFixed(3));
      },
    },
  };
</script>

<style>
</style>

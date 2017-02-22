<template>
  <g class="curve">
    <template v-for="(layer, layerIndex) in layers.members">
      <g :stroke="`rgba(0, 0, 0, ${getOpacity(layerIndex)})`" class="layer">
        <template v-for="(line, index) in layer">
          <s-line :line="line"
                  :title="makeTitle(layerIndex, index)"
                  :stroke="getColor(layerIndex, index)"
          />
        </template>
      </g>
    </template>
  </g>
</template>

<script type="text/babel">
  import invokeMap from 'lodash/invokeMap';
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
        return this.layers.members.map((layer) => {
          const newSpectrum = this.spectrum.clone();
          newSpectrum.segmentColors(layer.length);
          return invokeMap(newSpectrum.colors, 'toRGBAString');
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

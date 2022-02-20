<script lang="ts">
import {
  defineComponent,
  type PropType,
} from 'vue';

import {
  Color,
  Spectrum,
  makeCurve,
  type ICurveOptionsStrict,
  type SpectrumParams,
  type Curve,
  type Group,
  type Line,
} from '@/classes';

import StitchLine from './StitchLine.vue';


export default defineComponent({
  name: 'StitchCurve',
  components: {
    StitchLine,
  },
  props: {
    options: {
      type: Object as PropType<ICurveOptionsStrict>,
      required: true,
    },
    curveType: {
      type: String,
      required: true,
    },
    rotation: {
      type: Number,
      default: 0,
    },
    translation: {
      type: String,
      default: '',
    },
    colors: {
      type: Array as PropType<SpectrumParams>,
      default: () => [Color.BLACK],
    },
  },
  data() {
    return {
      spectrum: new Spectrum(...this.colors),
    };
  },
  computed: {
    curve(): Curve {
      return makeCurve(this.curveType, this.options);
    },
    layers(): Group<Line[]> {
      return this.curve.stitch();
    },
    transform(): string {
      // FIXME: Get rid of this mess by consuming rotation in the Curve class
      const { rotation, center } = this.options;
      const translation = this.translation || `${center.x} ${center.y}`;
      return (
        `rotate(${360 * (this.rotation || rotation)} ${translation})`
      );
    },
    layerSpectra(): string[][] {
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
    makeTitle(layerNum: number, index: number): string {
      return `${this.curveType}-layer${layerNum}-line${index}`;
    },
    getColor(indexOfLayer: number, indexInLayer: number): string {
      return this.layerSpectra[indexOfLayer][indexInLayer];
    },
    getOpacity(index: number): number {
      const min = 0.4;
      const range = 1 - min;
      return ((range / (index + 1)) + min);
    },
  },
});
</script>

<template>
  <g class="curve" :transform="transform">
    <g
      v-for="(layer, layerIndex) in layers.members"
      :key="layer"
      class="layer"
      :stroke-opacity="getOpacity(layerIndex)"
    >
      <StitchLine
        v-for="(line, index) in layer"
        :key="line"
        :line="line"
        :stroke="getColor(layerIndex, index)"
      />
    </g>
  </g>
</template>

<style>
</style>

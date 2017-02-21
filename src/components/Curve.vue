<template>
  <g :transform="transform" class="curve">
    <template v-for="(layer, layerNum) in layers.members">
      <g :stroke="layer.attributes.stroke" class="layer">
        <template v-for="(line, index) in layer.members">
          <s-line :line="line" :title="makeTitle(layerNum, index)"/>
        </template>
      </g>
    </template>
  </g>
</template>

<script type="text/babel">
  import {
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
    },
    data() {
      return {
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
        const { rotation } = this.options;
        return (
          `rotate(${360 * rotation})`
        );
      },
    },
    methods: {
      makeTitle(layerNum, index) {
        return `${this.curveType}-layer${layerNum}-line${index}`;
      },
    },
  };
</script>

<style>
</style>

<template>
  <g :transform="transform" class="curve">
    <template v-for="(layer, layerNum) in layers.members">
      <g :stroke="layer.attributes.stroke" class="layer">
        <template v-for="(line, index) in layer.members">
          <s-line :line="line" :title="`${layerNum}-${index}`"/>
        </template>
      </g>
    </template>
  </g>
</template>

<script type="text/babel">
  import { CURVE_TYPES } from '../constants';
  import {
    EllipseCurve,
    PolygonCurve,
    StarCurve,
  } from '../classes';
  import SLine from './SLine';

  function makeCurve(curveType, options) {
    switch (curveType) {
      case CURVE_TYPES.Ellipse:
        return new EllipseCurve(options);
      case CURVE_TYPES.Star:
        return new StarCurve(options);
      case CURVE_TYPES.Polygon:
      default:
        return new PolygonCurve(options);
    }
  }

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
      const curve = makeCurve(this.curveType, this.options);
      return {
        curve,
      };
    },
    computed: {
      layers() {
        return this.curve.stitch();
      },
      transform() {
        const { rotation, center } = this.options;
        const { x, y } = center;
        return (
          `translate(${x} ${y}) rotate(${360 * rotation})`
        );
      },
    },
  };
</script>

<style>
</style>

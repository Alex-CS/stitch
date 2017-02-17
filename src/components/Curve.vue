<template>
  <g :transform="transform" class="curve">
    <template v-for="(layer, layerNum) in group.members">
      <g :stroke="layer.attributes.stroke" class="layer">
        <template v-for="(line, index) in layer.members">
          <s-line :line="line" :title="`${layerNum}-${index}`"/>
        </template>
      </g>
    </template>
  </g>
</template>

<script type="text/babel">
  import {
    Group,
  } from '../classes';
  import SLine from './SLine';

  export default {
    name: 'curve',
    components: {
      SLine,
    },
    props: {
      group: Group,
      transform: String,
    },
  };
</script>

<style>
</style>

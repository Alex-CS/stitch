<template>
  <g :transform="transform" class="curve">
    <template v-for="layer in group.members">
      <g :stroke="layer.attributes.stroke" class="layer">
        <template v-for="line in layer.members">
          <s-line :line="line"/>
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

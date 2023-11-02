<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'StitchSvgDefs',
});
</script>

<template>
  <defs>
    <radialGradient id="gradient--bullseye">
      <stop offset="20%" stop-color="currentColor" />
      <stop offset="20%" stop-color="transparent" />
      <stop offset="90%" stop-color="transparent" />
      <stop offset="90%" stop-color="currentColor" />
    </radialGradient>
  </defs>
</template>

<style scoped lang="scss">

</style>
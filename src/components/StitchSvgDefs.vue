<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'StitchSvgDefs',
});
</script>

<template>
  <defs>
    <radialGradient id="gradient--bullseye">
      <stop offset="10%" class="bullseye-stop" />
      <stop stop-color="transparent" />
      <stop offset="90%" stop-color="transparent" />
      <stop class="bullseye-stop" />
    </radialGradient>
  </defs>
</template>
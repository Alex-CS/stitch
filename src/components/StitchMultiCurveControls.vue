<script lang="ts">
import { defineComponent } from 'vue';


// TODO: the binding in here is lazily done and should be cleaned up next time it's touched
export default defineComponent({
  name: 'StitchMultiCurveControls',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: [
    'update:modelValue',
  ],
  data() {
    return {
      options: this.modelValue,
    };
  },
  watch: {
    options: {
      handler(newValue) {
        this.$emit('update:modelValue', newValue);
      },
      deep: true,
    },
  },
});
</script>

<template>
  <div class="controls">
    <div>
      <label>layerCount</label>
      <input
        v-model="options.layerCount"
        type="range"
        min="1"
        max="8"
      >
      <span>{{ options.layerCount }}</span>
    </div>
    <div>
      <label>layerSepFactor</label>
      <input
        v-model="options.layerSepFactor"
        type="range"
        min="1"
        max="8"
      >
      <span>{{ options.layerSepFactor }}</span>
    </div>
    <div>
      <label>numVertices</label>
      <input
        v-model="options.numVertices"
        type="range"
        min="3"
        max="8"
      >
      <span>{{ options.numVertices }}</span>
    </div>
    <div>
      <label>resolution</label>
      <input
        v-model="options.resolution"
        type="range"
        min="4"
        max="64"
      >
      <span>{{ options.resolution }}</span>
    </div>
    <div>
      <label>rotation</label>
      <input
        v-model="options.rotation"
        type="range"
        min="0"
        max="1"
        :step="1/8"
      >
      <span>{{ options.rotation * 360 }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.controls {
  align-self: flex-end;
  display: flex;
  flex-direction: column;

  div {
    text-align: end;
  }
}
</style>
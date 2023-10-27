<script lang="ts">
import {
  defineComponent,
  type PropType,
} from 'vue';

import {
  Line,
} from '@/classes';
import type {
  Pair,
} from '@/types/utility';

import StitchLine from './StitchLine.vue';


export default defineComponent({
  name: 'StitchCanvasSpines',
  components: {
    StitchLine,
  },
  props: {
    lines: {
      type: Array as PropType<Line[]>,
      required: true,
    },
  },
  emits: {
    pairSelected(...lines: Pair<Line>) {
      return lines.length === 2 && lines.every(Line.isLineLike);
    },
  },
  data() {
    return {
      selectedLine: null as Line | null,
    };
  },
  methods: {
    isSelected(line: Line): boolean {
      return this.selectedLine !== null
        && Line.areEqual(this.selectedLine, line);
    },

    selectLine(line: Line) {
      if (this.selectedLine === null) {
        // Select first line
        this.selectedLine = line;
      } else if (this.isSelected(line)) {
        // Deselect
        this.selectedLine = null;
      } else {
        // Stitch
        this.$emit('pairSelected', this.selectedLine, line);
        this.selectedLine = null;
      }
    },
  },
});
</script>

<template>
  <g class="spines">
    <StitchLine
      v-for="(line) in lines"
      :key="line.toString()"
      :class="{
        active: isSelected(line),
      }"
      :line="line"
      class="spine"
      @click="selectLine(line)"
    />
  </g>
</template>

<style lang="scss" scoped>
@use '@/styles/tools';


.spines {
  stroke: currentColor;
}

.spine {
  @include tools.color-states(stroke);
  opacity: .25;
  stroke-width: 2;

  &:hover {
    opacity: 1;
    stroke-width: 5;
  }
}

</style>
<script setup lang="ts">
import {
  type MenuItem,
} from '@/types/ui-interfaces';


defineProps<{
  menuItems: MenuItem[],
}>();

defineEmits<{
  close: [],
}>();

</script>

<template>
  <menu
    class="canvas-menu"
    @click.stop="$emit('close')"
  >
    <li
      v-for="item in menuItems"
      :key="item.label"
      class="canvas-menu-item"
    >
      <button
        class="canvas-menu-button"
        type="button"
        @click="item.action"
      >
        {{ item.label }}
      </button>
    </li>
  </menu>
</template>

<style lang="scss" scoped>

.canvas-menu {
  &::before { // Invisible backdrop behind the menu
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  padding: 2px;
  border-radius: 4px;
  border: solid 1px var(--color-menu);
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.canvas-menu-item {
  border-radius: inherit;

  & + & {
    margin-top: 2px;
  }
}

.canvas-menu-button {
  border-radius: inherit;
  width: 100%;
  border: none;
  display: block;
  background-color: var(--color-background);
  color: var(--color-menu);

  &:hover {
    background-color: var(--color-active);
  }
}

</style>
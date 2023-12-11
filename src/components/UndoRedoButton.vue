<script setup lang="ts">
import { useCommand } from '@/stores/command';
const commandStore = useCommand();
</script>

<template>
  <div>
    <button
      type="button"
      :disabled="!commandStore.undoable"
      @click="commandStore.undo"
    >
      UNDO
    </button>
    <button
      type="button"
      :disabled="!commandStore.redoable"
      @click="commandStore.redo"
    >
      REDO
    </button>
  </div>
</template>

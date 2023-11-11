<script setup lang="ts">
import { useCommand } from '@/stores';
const command = useCommand();
</script>

<template>
  <div>
    <button type="button" :disabled="!command.undoable" @click="command.undo">
      UNDO
    </button>
    <button type="button" :disabled="!command.redoable" @click="command.redo">
      REDO
    </button>
  </div>
</template>

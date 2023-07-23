<script setup lang="ts">
import { useCommand } from '@/stores/command';
const command = useCommand();
</script>

<template>
  <div>
    <button type="button" @click="command.undo">UNDO</button>
    <button type="button" @click="command.redo">REDO</button>
  </div>
</template>

<script setup lang="ts">
import { useHistory } from "@/stores/command";
const history = useHistory();
</script>
<template>
  <div>
    <button type="button" :disabled="!history.undoable" @click="history.undo">UNDO</button>
    <button type="button" :disabled="!history.redoable" @click="history.redo">REDO</button>
  </div>
</template>

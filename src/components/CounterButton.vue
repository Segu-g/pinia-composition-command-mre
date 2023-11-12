<script setup lang="ts">
import { useCount } from '@/stores';
const store = useCount();
const countUp = () => store.commandIncrement.dispatch();
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">
      count is {{ store.state.counter }}
    </button>
  </div>
</template>

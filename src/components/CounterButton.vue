<script setup lang="ts">
import { useCount } from '@/stores';
const store = useCount();
const countUp = () => store.commandIncrement();
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">count is {{ store.counter }}</button>
  </div>
</template>

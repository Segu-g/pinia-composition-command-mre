<script setup lang="ts">
import { computed } from 'vue';
import { useController } from '@/stores/command';
import { useCount } from '@/stores';
const countStore = useCount();
const { get, commandDispatch } = useController();
const countValue = computed(() => get(countStore.getCount));
const countUp = () => {
  commandDispatch(countStore.cmdIncrement);
};
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">count is {{ countValue }}</button>
  </div>
</template>

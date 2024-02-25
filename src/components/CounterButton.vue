<script setup lang="ts">
import { computed } from 'vue';
import { useStateStore } from '@/stores/pinia-helper/command-execution';
import { useHistory } from '@/stores/command';
import { useCount } from '@/stores';
const countStore = useCount();
const history = useHistory();
const { get, command } = useStateStore(history);
const countValue = computed(() => get(countStore.getCount));
const countUp = () => {
  command(countStore.cmdIncrement);
};
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">count is {{ countValue }}</button>
  </div>
</template>

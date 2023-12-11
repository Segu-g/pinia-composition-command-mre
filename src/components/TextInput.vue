<script setup lang="ts">
import { useText } from '@/stores/textStore';
import { useController } from '@/stores/command';
import { computed } from 'vue';
const textStore = useText();
const { commandDispatch, get } = useController();
const text = computed(() => get(textStore.textGet));
const onChange = (evt: Event) => {
  evt.target instanceof HTMLInputElement &&
    commandDispatch(textStore.cmdChangeText, evt.target.value);
};
</script>

<template>
  <div class="card">
    <p>{{ text }}</p>
    <input :value="text" @input="onChange" />
  </div>
</template>

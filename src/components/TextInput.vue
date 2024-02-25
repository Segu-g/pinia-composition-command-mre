<script setup lang="ts">
import { TextState, useText } from "@/stores/textStore"
import { useCommandStore } from '@/stores/pinia-helper';
import { useHistory } from "@/stores/command";
import { computed } from "vue";

const textStore = useText();
const history = useHistory();
const { fetch, command } = useCommandStore(history);
const text = computed(() => fetch(TextState).text)
const onChange = (evt: Event) => {
  evt.target instanceof HTMLInputElement && command(textStore.changeTextCmd, evt.target.value);
};
</script>

<template>
  <div class="card">
    <p>{{ text }}</p>
    <input :value="text" @input="onChange" />
  </div>
</template>

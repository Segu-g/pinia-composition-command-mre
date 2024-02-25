<script setup lang="ts">
import { TextState, useText } from "@/stores/textStore"
import { useCommandStore } from '@/stores/pinia-helper';
import { useHistory } from "@/stores/command";

const textStore = useText();
const history = useHistory();
const { fetch, command } = useCommandStore(history);
const state = fetch(TextState);
const onChange = (evt: Event) => {
  evt.target instanceof HTMLInputElement && command(textStore.changeTextCmd, evt.target.value);
};
</script>

<template>
  <div class="card">
    <p>{{ state.text }}</p>
    <input :value="state.text" @input="onChange" />
  </div>
</template>

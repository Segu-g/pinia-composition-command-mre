import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.scss';
import App from './App.vue';
import { key, vuexStore } from '@/vuex-store';

const pinia = createPinia();
const app = createApp(App);
app.use(vuexStore, key);
app.use(pinia);
pinia.use(({ store, app }) => {
  store.$vuex = app.config.globalProperties.$store;
});
app.mount('#app');

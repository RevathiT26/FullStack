/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */
// Plugins
import { registerPlugins } from '@/plugins';
// Components
import App from './App.vue';
// Composables
import { createApp } from 'vue';
// Styles
import 'unfonts.css';
import { createPinia } from "pinia";
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
const vuetify = createVuetify({
    components,
    directives,
});
const app = createApp(App);
registerPlugins(app);
app.use(createPinia());
app.use(vuetify);
app.mount("#app");

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { router } from './router'
import App from './App.vue'
import { reveal } from './reveal'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.directive('reveal', reveal)
app.use(pinia)
app.use(router)
// Wait for auth guards before choosing the storefront or admin layout.
void router.isReady().then(() => app.mount('#app'))


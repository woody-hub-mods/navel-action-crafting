/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHashHistory } from 'vue-router/auto'; // Switched to createWebHashHistory
import { routes } from 'vue-router/auto-routes';

// Add a custom route for the root path
routes.push({
  path: '/',
  name: 'Home',
  component: () => import('../components/Crafting.vue'), // Set Crafting as the default component for the root path
});

// Add a custom route for Crafting with dynamic path parameters
routes.push({
  path: '/craft/:selectedComponent?/:quantity?',
  name: 'Crafting',
  component: () => import('../components/Crafting.vue'), // Lazy load the Crafting component
});

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // Use hash mode for GitHub Pages compatibility
  routes,
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error');
      localStorage.setItem('vuetify:dynamic-reload', 'true');
      location.assign(to.fullPath);
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload');
});

export default router;

<template>
  <v-app>
    <AppHeader />
    <v-main>
      <router-view />
    </v-main>
    <AppFooter />
  </v-app>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'; // Import the AppHeader component
import AppFooter from './components/AppFooter.vue'; // Import the AppFooter component
</script>

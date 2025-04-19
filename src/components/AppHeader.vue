<template>
  <v-app-bar app color="primary" dark>
    <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />
    <v-toolbar-title>Navel Action Crafting</v-toolbar-title>
    <v-spacer />
    <v-btn icon @click="$router.push('/craft/')">
      <v-icon>mdi-home</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script>
export default {
  name: 'AppHeader',
  emits: ['toggle-drawer'], // Emits an event to toggle a navigation drawer if needed
};
</script>

<style scoped>
.v-app-bar {
  margin-bottom: 20px;
}
</style>

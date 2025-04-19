<template>
  <v-footer app color="primary" dark>
    <v-col class="text-center white--text">
      <div>© {{ new Date().getFullYear() }} Navel Action Crafting</div>
      <div>
        This is a player-created utility and is not affiliated with Naval Action game or its developers.
      </div>
      <div>
        If you like this utility or have recommendations for improvement, feel free to contact me in-game on the Peace
        server under user <strong>Woody</strong>.
      </div>
    </v-col>
  </v-footer>
</template>

<script>
export default {
  name: 'AppFooter',
};
</script>

<style scoped>
.v-footer {
  padding: 10px 0;
}
</style>

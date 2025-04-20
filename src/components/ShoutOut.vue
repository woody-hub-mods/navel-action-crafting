<template>
    <v-container>
      <v-row justify="center" class="mt-4">
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Special Thanks</v-card-title>
            <v-card-text>
              This tool is powered using data provided by the team at 
              <a href="https://na-map.netlify.app/" target="_blank" rel="noopener noreferrer">
                Naval Action map two
              </a>. Their website features an interactive map and other useful tools for navigating and exploring the world of Naval Action. Be sure to check it out!
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  export default {
    name: 'ShoutOut',
  };
  </script>
  
  <style scoped>
  .v-card {
    margin-top: 20px;
  }
  </style>
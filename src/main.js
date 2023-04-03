import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import StyleClass from 'primevue/styleclass';
import VueApexCharts from "vue3-apexcharts";
import * as d3 from 'd3';
// import Highcharts from 'highcharts';
// import VueHighcharts from 'vue-highcharts';

// Import des librairies css pour primevue
import "primevue/resources/themes/lara-light-indigo/theme.css";  //theme   
import "primevue/resources/primevue.min.css";  //core
import "primeicons/primeicons.css"; //icons


const app = createApp(App);
app.use(PrimeVue);
app.use(VueApexCharts);
app.use(d3);
// app.use(VueHighcharts, { Highcharts });
app.directive('styleclass', StyleClass);
app.mount('#app');

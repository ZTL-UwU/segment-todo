import Vue from 'vue';
import App from './App.vue';

import IO from 'socket.io-client';
const io = IO();
Vue.prototype.$socket_io = io;

Object.defineProperty(window, 'todo_list_change_callback', {
  value: () => {},
  writable: true,
});

io.on('set', (content) => {
  window.todo_list_change_callback(content);
});

import axios from 'axios';
Vue.prototype.$axios = axios;

Vue.config.productionTip = false;

import './assets/element/index.css';
import locale from 'element-ui/lib/locale/lang/en';
import ElementUI from 'element-ui';
Vue.use(ElementUI, { locale });

import './assets/css/basic.css';

new Vue({
  render: h => h(App),
}).$mount('#app');

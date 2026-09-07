import { createApp } from 'vue';
import App from './App.vue';

import { io as connect } from 'socket.io-client';
const io = connect();

Object.defineProperty(window, 'todo_list_change_callback', {
  value: () => {},
  writable: true,
});

io.on('set', (content) => {
  window.todo_list_change_callback(content);
});

import axios from 'axios';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './assets/css/basic.css';

const app = createApp(App);
app.config.globalProperties.$socket_io = io;
app.config.globalProperties.$axios = axios;
app.use(ElementPlus);
app.mount('#app');

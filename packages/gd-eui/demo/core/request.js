import axios from 'axios';
import config from '../config/index.js';
axios.defaults.baseURL = config.DOMAIN;

export default axios;

import axios from 'axios';
import config from '../config/index';
axios.defaults.baseURL = config.DOMAIN;

export default axios;

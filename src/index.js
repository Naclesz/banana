import React from 'react';
import ReactDOM from 'react-dom';
import store, { persistor } from './app/store/store';
import './index.scss';
import App from './App';
import { setupAxios } from '_core';
import axios from 'axios';
import * as env from './app/config/environment';

const { PUBLIC_URL } = process.env;

const { API_URL } = env[process.env.REACT_APP_ENV] || env['defaultConfig'];
setupAxios(axios, API_URL, store);

ReactDOM.render(
  <React.StrictMode>
    <App store={store} persistor={persistor} basename={PUBLIC_URL} />
  </React.StrictMode>,
  document.getElementById('root')
);

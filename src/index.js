import React from 'react';
import ReactDOM from 'react-dom';
import store, { persistor } from './app/store/store';
import './index.css';
import App from './App';

const { PUBLIC_URL } = process.env;

ReactDOM.render(
  <React.StrictMode>
    <App store={store} persistor={persistor} basename={PUBLIC_URL} />
  </React.StrictMode>,
  document.getElementById('root')
);

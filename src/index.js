import React from "react";
import ReactDOM from "react-dom";
import store, { persistor } from "./app/store/store";
import "./index.css";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <App store={store} persistor={persistor} />
  </React.StrictMode>,
  document.getElementById("root")
);

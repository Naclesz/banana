import moment from 'moment';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Switch } from 'react-router-dom';
import { LastLocationProvider } from 'react-router-last-location';
import { ToastProvider } from 'react-toast-notifications';
import { PersistGate } from 'redux-persist/integration/react';
import { getCurrentLanguage } from '_core/utils/languages';
import SocketsContainer from './app/containers/SocketsContainer';
import { Routes } from './app/router/Routes';
import { I18nProvider, LayoutSplashScreen } from './_core';
import ToastCustom from './_core/modules/atoms/Toast';

export default function App({ store, persistor, basename }) {
  moment.locale(getCurrentLanguage());
  return (
    /* Provide Redux store */
    <Provider store={store}>
      {/* Asynchronously persist redux stores and show `SplashScreen` while it's loading. */}
      <PersistGate persistor={persistor} loading={<LayoutSplashScreen />}>
        {/* Add high level `Suspense` in case if was not handled inside the React tree. */}
        <React.Suspense fallback={<LayoutSplashScreen />}>
          {/* Override `basename` (e.g: `homepage` in `package.json`) */}
          <BrowserRouter basename={basename}>
            {/*This library only returns the location that has been active before the recent location change in the current window lifetime.*/}
            <LastLocationProvider>
              {/* Provide Metronic theme overrides. */}
              {/*<ThemeProvider>*/}
              {/* Provide `react-intl` context synchronized with Redux state.  */}
              <I18nProvider>
                {/* Provide `react-toast-notifications` which provides context for the Toast descendants  */}
                <ToastProvider placement="bottom-left" components={{ Toast: ToastCustom }}>
                  {/* Render routes with provided `Layout`. */}
                  <Switch>
                    <Routes />
                  </Switch>
                  <SocketsContainer />
                </ToastProvider>
              </I18nProvider>
              {/*</ThemeProvider>*/}
            </LastLocationProvider>
          </BrowserRouter>
        </React.Suspense>
      </PersistGate>
    </Provider>
  );
}

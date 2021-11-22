import { Switch } from '@material-ui/core';
import React from 'react';
import { Route, withRouter } from 'react-router';
import { LayoutContextProvider } from '../../_core';

export const Routes = withRouter(({ history }) => {
  return (
    <div>
      <LayoutContextProvider history={history}>
        <Switch>
          <Route path="/" component={<div>Hello!</div>} />
        </Switch>
      </LayoutContextProvider>
    </div>
  );
});

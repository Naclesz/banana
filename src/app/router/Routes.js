import React, { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Redirect, Route, Switch, withRouter } from 'react-router';
import { LayoutContextProvider } from '_core';
import Auth from '_core/lite/views/AuthView/Auth';
import MyClassroomsView from '_core/lite/views/MyClassroomsView';
import { auth } from '_core/store';
import * as coreEntities from '_core/store/index';
import { notificationsTypes } from '_core/utils/notifications';

export const Routes = withRouter(({ history }) => {
  const dispatch = useDispatch();
  const { isAuthorized } = useSelector(
    ({ auth }) => ({
      isAuthorized: auth.user != null,
    }),
    shallowEqual
  );

  const theme = useSelector((store) => coreEntities.ui.selectors.getTheme(store));

  useEffect(() => {
    if (isAuthorized) {
      dispatch(coreEntities.notifications.actions.getNotifications({ offset: 0, pageSize: 4, typeNotifications: notificationsTypes.SOCIAL }));
      dispatch(
        coreEntities.notifications.actions.getNotificationsToDo({
          offset: 0,
          pageSize: 4,
          typeNotifications: notificationsTypes.TODO,
        })
      );
      dispatch(coreEntities.notifications.actions.getNotificationsUnread());
      dispatch(coreEntities.notifications.actions.getNotificationsUnreadToDo());
      dispatch(coreEntities.learningObjectives.actions.getLearningObjectives());
      dispatch(coreEntities.educationLevels.actions.getEducationLevels());
    }
  }, [isAuthorized]);

  return (
    <div className={`theme-${theme} app-content`}>
      <LayoutContextProvider history={history} menuConfig={{}}>
        <Switch>
          {!isAuthorized ? (
            <Switch>
              <Route path="/auth/login" component={Auth} />
              <Redirect to="/auth/login" />
            </Switch>
          ) : (
            <Switch>
              <Redirect exact from="/" to="/home" />
              <Redirect from="/auth" to={'/home'} />
              <Route path="/home" render={() => <MyClassroomsView />} />
            </Switch>
          )}
        </Switch>
      </LayoutContextProvider>
    </div>
  );
});

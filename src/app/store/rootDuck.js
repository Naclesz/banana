import { combineReducers } from 'redux';
import { all } from 'redux-saga/effects';
import { conf } from '_core/store/';
import * as coreEntities from '_core/store/index';

const reducers = {
  [conf.REDUCER_AUTH]: coreEntities.auth.reducer,
  [conf.REDUCER_UI]: coreEntities.ui.reducer,
  [conf.REDUCER_I18N]: coreEntities.i18n.reducer,
  entities: combineReducers({
    [conf.REDUCER_EDUCATION_LEVELS]: coreEntities.educationLevels.reducer,
    [conf.REDUCER_COURSES]: coreEntities.courses.reducer,
    [conf.REDUCER_GROUPS]: coreEntities.groups.reducer,
    [conf.REDUCER_TASKS]: coreEntities.tasks.reducer,
    [conf.REDUCER_CALENDARS]: coreEntities.calendars.reducer,
    [conf.REDUCER_NOTIFICATIONS]: coreEntities.notifications.reducer,
  }),
};

export const rootReducer = combineReducers({ ...reducers });

export function* rootSaga() {
  yield all([
    coreEntities.auth.saga(),
    coreEntities.educationLevels.saga(),
    coreEntities.courses.saga(),
    coreEntities.groups.saga(),
    coreEntities.tasks.saga(),
    coreEntities.calendars.saga(),
    coreEntities.notifications.saga(),
  ]);
}

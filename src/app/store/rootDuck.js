import { combineReducers } from 'redux';
import { all } from 'redux-saga/effects';
import { conf } from '_core/store/';
import * as coreEntities from '_core/store/index';

const reducers = {
  [conf.REDUCER_AUTH]: coreEntities.auth.reducer,
  [conf.REDUCER_UI]: coreEntities.ui.reducer,
  [conf.REDUCER_I18N]: coreEntities.i18n.reducer,
};

export const rootReducer = combineReducers({ ...reducers });

export function* rootSaga() {
  yield all([coreEntities.auth.saga()]);
}

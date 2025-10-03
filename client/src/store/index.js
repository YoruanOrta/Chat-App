import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import chatApp from '../reducers';
import rootSaga from '../sagas';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  chatApp,
  applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(rootSaga, store.dispatch);

export default store;
import React from 'react';
import { render } from 'react-dom';
import FastClick from 'fastclick';
import { Provider } from 'react-redux';

import history from './history'
import store from './store';

import AppRouter from './routers';

FastClick.attach(document.body);

render(
    <Provider store={store}>
    	<AppRouter history={history}/>
    </Provider>
    , document.getElementById('container')
);
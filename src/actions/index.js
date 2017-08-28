import { createAction } from 'redux-actions';

import * as reducerTpye from '../unit/reducerType';

const updateAccessToken = createAction(reducerTpye.UPDATE_ACCESS_TOKEN);
const updateOpenId = createAction(reducerTpye.UPDATE_OPEN_ID);
const updateIsUser = createAction(reducerTpye.UPDATE_IS_USER);
const updateJsapiTicket = createAction(reducerTpye.UPDATE_JSAPI_TICKET);
const updateAddress = createAction(reducerTpye.UPDATE_ADDRESS);
const updateRefeffer = createAction(reducerTpye.UPDATE_REFEFFER);

export default {
    updateAccessToken,
    updateOpenId,
    updateIsUser,
    updateJsapiTicket,
    updateAddress,
    updateRefeffer,
};
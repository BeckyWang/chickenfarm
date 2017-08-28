import * as reducerType from '../unit/reducerType';
import actions from '../actions'

const jsapiTicket = (state = null, action) => {
    switch (action.type) {
        case reducerType.UPDATE_JSAPI_TICKET:
            return action.payload;
        default:
            return state;
    }
}

export default jsapiTicket;
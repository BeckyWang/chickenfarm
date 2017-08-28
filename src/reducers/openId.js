import * as reducerType from '../unit/reducerType';
import actions from '../actions'

const openId = (state = null, action) => {
    switch (action.type) {
        case reducerType.UPDATE_OPEN_ID:
            return action.payload;
        default:
            return state;
    }
}

export default openId;
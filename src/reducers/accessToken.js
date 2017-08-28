import * as reducerType from '../unit/reducerType';
import actions from '../actions'

const accessToken = (state = null, action) => {
    switch (action.type) {
        case reducerType.UPDATE_ACCESS_TOKEN:
            return action.payload;
        default:
            return state;
    }
}

export default accessToken;
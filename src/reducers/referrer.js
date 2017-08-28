import * as reducerType from '../unit/reducerType';
import actions from '../actions'

const referrer = (state = null, action) => {
    switch (action.type) {
        case reducerType.UPDATE_REFERRER:
            return action.payload;
        default:
            return state;
    }
}

export default referrer;
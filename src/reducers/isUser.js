import * as reducerType from '../unit/reducerType';
import actions from '../actions'

const isUser = (state = null, action) => {
    switch (action.type) {
        case reducerType.UPDATE_IS_USER:
            return action.payload;
        default:
            return state;
    }
}

export default isUser;
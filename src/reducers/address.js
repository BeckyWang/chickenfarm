import * as reducerType from '../unit/reducerType';
import actions from '../actions'

const address = (state = {}, action) => {
    switch (action.type) {
        case reducerType.UPDATE_ADDRESS:
            return action.payload;
        default:
            return state;
    }
}

export default address;
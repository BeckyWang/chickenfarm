import { connect } from 'react-redux';
import { push } from 'react-router-redux';

const mapDispatchToProps = dispatch => {
    return {
        goTo: (location, state) => {
            dispatch(push(location, state));
        }
    }
}

export default (Component) => connect(undefined, mapDispatchToProps)(Component);
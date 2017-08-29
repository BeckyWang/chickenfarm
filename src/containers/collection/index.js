import { connect } from 'react-redux';
import actions from '../../actions';

import Footer from '../../components/Footer';
import Register from '../../components/Register';
import MyAdopted from '../../components/MyAdopted/List';
import MyFocused from '../../components/MyFocused/List';
import FarmList from '../../components/FarmList';
import FarmUnitList from '../../components/FarmUnit/List';
import FarmUnitView from '../../components/FarmUnit/View';
import EggList from '../../components/FarmUnit/Egglist';
import ChickenProduction from '../../components/ChickenProduction';
import ChickenAdopt from '../../components/ChickenAdopt';
import ChickenDelay from '../../components/ChickenAdopt/Delay';
import ChickenOrder from '../../components/ChickenOrder';
import ChickenEat from '../../components/ChickenEat';
import EggOrder from '../../components/EggOrder';
import EggOrderPay from '../../components/EggOrder/Pay';
import AddressList from '../../components/Address/List';
import AddressEdit from '../../components/Address/Edit';
import AddressManage from '../../components/Address/Manage';
import PersonalCenter from '../../components/PersonalCenter';
import MyClient from '../../components/PersonalCenter/Client';
import MyTreasure from '../../components/PersonalCenter/Treasure';
import Withdraw from '../../components/PersonalCenter/Withdraw';

const mapStateToProps = state => {
    return {
        accessToken: state.get('accessToken'),
        openId: state.get('openId'),
        isUser: state.get('isUser'),
        jsapiTicket: state.get('jsapiTicket'),
        address: state.get('address'),
        referrer: state.get('referrer'),
    }
}

const mapDispatchToProps = dispatch => {
    return {
        updateIsUser: isUser => {
            const accessStr = JSON.parse(window.sessionStorage.getItem('accessStr'));

            dispatch(actions.updateIsUser(isUser));
            accessStr.isUser = true;
            window.sessionStorage.setItem('accessStr', JSON.stringify(accessStr));
        },
    }
}

const mapAddrDispatchToProps = dispatch => {
    return {
        updateAddress: addr => {
            dispatch(actions.updateAddress(addr));
        },
    }
}

export const Footer_Cont = connect(mapStateToProps)(Footer);
export const Register_Cont = connect(mapStateToProps, mapDispatchToProps)(Register);
export const MyAdopted_Cont = connect(mapStateToProps)(MyAdopted);
export const MyFocused_Cont = connect(mapStateToProps)(MyFocused);
export const FarmList_Cont = connect(mapStateToProps)(FarmList);
export const FarmUnitList_Cont = connect(mapStateToProps)(FarmUnitList);
export const FarmUnitView_Cont = connect(mapStateToProps)(FarmUnitView);
export const EggList_Cont = connect(mapStateToProps)(EggList);
export const ChickenProduction_Cont = connect(mapStateToProps)(ChickenProduction);
export const ChickenAdopt_Cont = connect(mapStateToProps)(ChickenAdopt);
export const ChickenDelay_Cont = connect(mapStateToProps)(ChickenDelay);
export const ChickenOrder_Cont = connect(mapStateToProps)(ChickenOrder);
export const ChickenEat_Cont = connect(mapStateToProps)(ChickenEat);
export const EggOrder_Cont = connect(mapStateToProps)(EggOrder);
export const EggOrderPay_Cont = connect(mapStateToProps, mapAddrDispatchToProps)(EggOrderPay);
export const AddressList_Cont = connect(mapStateToProps, mapAddrDispatchToProps)(AddressList);
export const AddressEdit_Cont = connect(mapStateToProps)(AddressEdit);
export const AddressManage_Cont = connect(mapStateToProps, mapAddrDispatchToProps)(AddressManage);
export const PersonalCenter_Cont = connect(mapStateToProps)(PersonalCenter);
export const MyClient_Cont = connect(mapStateToProps)(MyClient);
export const MyTreasure_Cont = connect(mapStateToProps)(MyTreasure);
export const Withdraw_Cont = connect(mapStateToProps)(Withdraw);
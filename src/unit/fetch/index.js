import { getOpenId, getAccessToken, executeFetch, address } from './Const';
import { objToQueryString } from '../tool';

/**************** access相关接口 ***************/
//获取伪造的access
export function getFakeAccess() {
    return executeFetch(address.fake_access);
}

//获取access
export function updateAccess(code) {
    return executeFetch(address.access + objToQueryString(code));
}
/***************************************************/


/**************** 用户信息相关接口 ***************/
//新增或修改指定用户信息
export function updateUser(info) {
    return executeFetch(`${address.users}/${getOpenId()}/info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(info)
    });
}

//获取指定用户信息
export function getUserInfo(openId) {
    let url = openId ? `${address.users}/${openId}/info` : `${address.users}/${getOpenId()}/info`;
    return executeFetch(url);
}

//获取指定用户的推荐客户列表 => [{uid, realname, totalEggs, curMonthEggs, totalChicken, curMonthChicken}]
export function getMyClients() {
    return executeFetch(`${address.users}/${getOpenId()}/customer`);
}

//获取指定用户的财富信息
export function getMyTreasure() {
    return executeFetch(`${address.users}/${getOpenId()}/wealth`);
}

//添加指定用户的提现账号, application/json, body信息: {alipay}
export function updateAlipay(info) {
    return executeFetch(`${address.users}/${getOpenId()}/alipay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(info)
    });
}

//推荐 path: wxId => 本人openId,  body: { referrerId } //推荐人openId
export function addReferrer(info) {
    return executeFetch(`${address.users}/${getOpenId()}/recommend`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(info)
    });
}

//指定用户提现, body = {amount}  amount为 1.00 格式
export function withdrawMoney(info) {
    return executeFetch(`${address.users}/${getOpenId()}/withdraw`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(info)
    });
}
/***************************************************/


/**************** 收货地址相关接口  ****************/
//获取指定用户收货地址
export function getAddressList() {
    return executeFetch(`${address.users}/${getOpenId()}/address`);
}

//添加指定用户的收货地址, application/json, body信息: {phone, address, consignee}
export function addAddress(info) {
    return executeFetch(`${address.users}/${getOpenId()}/address`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(info)
    })
}

//获取地址详情
export function getAddress(addressId) {
    return executeFetch(`${address.address}/${addressId}`);
}

//修改指定用户的收货地址, application/json, body信息: {phone, address, consignee, addressId}
export function updateAddress(info) {
    return executeFetch(`${address.users}/${getOpenId()}/address/${info.addressId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(info)
    })
}

//删除指定用户的指定收货地址
export function deleteAddress(addressId) {
    return executeFetch(`${address.users}/${getOpenId()}/address/${addressId}`, {
        method: 'DELETE',
    })
}
/***************************************************/


/************* 用户对鸡只的相关操作  ***************/
//获取用户所有认养鸡信息(wxId是微信openId)
export function getAllMyAdopted() {
    return executeFetch(`${address.users}/${getOpenId()}/adopted`);
}

//获取用户在指定鸡场的认养鸡信息(wxId是微信openId)
export function getMyAdopted(farmId) {
    return executeFetch(`${address.users}/${getOpenId()}/farms/${farmId}/adopted`);
}

//获取用户所有关注鸡信息(wxId是微信openId)
export function getAllMyFocused() {
    return executeFetch(`${address.users}/${getOpenId()}/focus`);
}

//获取用户在指定鸡场的关注鸡信息(wxId是微信openId)
export function getMyFocused(farmId) {
    return executeFetch(`${address.users}/${getOpenId()}/farms/${farmId}/focus`);
}

//用户获取自己对指定鸡关注和认养的信息
export function getMyFocusAndAdopted(chickenId) {
    return executeFetch(`${address.users}/${getOpenId()}/chicken/${chickenId}/relation`);
}

//用户关注/取消关注一只鸡
export function focusChicken(chickenId) {
    return executeFetch(`${address.users}/${getOpenId()}/chicken/${chickenId}/focus`, {
        method: 'POST',
    });
}

//指定用户对其指定认养鸡设置鸡蛋自留/可售
export function keepEgg(chickenId) {
    return executeFetch(`${address.users}/${getOpenId()}/chicken/${chickenId}/eggkept`, {
        method: 'POST',
    });
}

//支付：认养一只鸡 header => {openid, accesstoken, ip}, body => {adopt_days}
export function adoptChicken(chickenId, info) {
    return executeFetch(`${address.chicken}/${chickenId}/adopted`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ACCESSTOKEN': getAccessToken(),
            'OPENID': getOpenId(),
            'IP': window.returnCitySN.cip,
        },
        body: JSON.stringify(info)
    })
}

//支付：对一只鸡认养延期 header => {openid, accesstoken, ip}, body => {adopt_days}
export function delayChicken(chickenId, info) {
    return executeFetch(`${address.chicken}/${chickenId}/adopt_delay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ACCESSTOKEN': getAccessToken(),
            'OPENID': getOpenId(),
            'IP': window.returnCitySN.cip,
        },
        body: JSON.stringify(info)
    })
}

//支付：购买一只鸡 header => {openid, accesstoken, ip}, body => {addressId, logistics}，logistics为字符串，表示物流方式（目前只有两种：顺丰包邮/普通快递包邮）
export function buyChicken(chickenId, info) {
    return executeFetch(`${address.chicken}/${chickenId}/buy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ACCESSTOKEN': getAccessToken(),
            'OPENID': getOpenId(),
            'IP': window.returnCitySN.cip,
        },
        body: JSON.stringify(info)
    })
}
/***************************************************/


/************* 用户对鸡蛋的相关操作  ***************/
//指定农场购买鸡蛋, status:{0: 足够鸡蛋, 1: 换鸡场, 2: 没有符合鸡场}
export function orderEggInfarm(farmId) {
    return executeFetch(`${address.users}/${getOpenId()}/farms/${farmId}/eggsell`, {
        method: 'POST',
    });
}

//不指定农场购买鸡蛋, status:{0: 足够鸡蛋, 1: 没有符合鸡场}
export function orderEggInfarms() {
    return executeFetch(`${address.users}/${getOpenId()}/eggsell`, {
        method: 'POST',
    });
}

//支付：鸡蛋订购 header => {openid, accesstoken, ip}, body => {orderId, addressId, logistics}，logistics为字符串，表示物流方式（目前只有两种：顺丰包邮/普通快递包邮）
export function buyEgg(info) {
    return executeFetch(`${address.eggs}/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ACCESSTOKEN': getAccessToken(),
            'OPENID': getOpenId(),
            'IP': window.returnCitySN.cip,
        },
        body: JSON.stringify(info)
    })
}
/***************************************************/


/**************** 鸡场/鸡场单元相关操作  *******************/
//获取所有鸡场信息(cfid, cfname)
export function getFarms() {
    return executeFetch(address.farms);
}

//获取所有某个鸡场单元信息(cuid, cuname)
export function getFarmUnits(farmId) {
    return executeFetch(`${address.farms}/${farmId}/units`);
}

//获取所有某个鸡场单元所有鸡只信息
export function getChickenList(unitId) {
    return executeFetch(`${address.units}/${unitId}/chicken`);
}

//获取指定鸡场单元指定日期的所有下蛋信息，日期信息以search参数date表示，格式如: '2017-01-01'
export function getEggList(unitId, date) {
    return executeFetch(`${address.units}/${unitId}/eggs${objToQueryString(date)}`);
}
/***************************************************/


/**************** 鸡只相关操作  *******************/
//获取指定鸡的信息
export function getChickenInfo(chickenId) {
    return executeFetch(`${address.chicken}/${chickenId}/info`);
}

//获取指定鸡的所有蛋信息
export function getEggsOfChicken(chickenId) {
    return executeFetch(`${address.chicken}/${chickenId}/eggs`);
}
/***************************************************/


/***************** 微信支付相关接口 *******************/
//获取签名signature
export function getWXSignature(config) {
    return executeFetch(address.signature, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
    })
}
/***************************************************/

export function queryVideo(name) {
    return executeFetch(`${address.video}/${name}/exist`);
}
import fetch from 'isomorphic-fetch';

const prefix = window.location.origin + '/weixin/api/v1';

export function getOpenId() {
    return JSON.parse(window.sessionStorage.getItem('accessStr')).openId;
}

export function getAccessToken() {
    return JSON.parse(window.sessionStorage.getItem('accessStr')).accessToken;
}

export function executeFetch(...args) {
    return new Promise(async (resolve, reject) => {
        let response = {}, result = '';
        try {
            response = await fetch(...args);
            result = await response.json();
        } catch(e) {

        }
        response.status === 200 ? resolve(result) : reject(result);
    });
}

export const address = {
    'fake_access': prefix + '/fake_access',
    'access': prefix + '/access',
    'farms': prefix + '/farms',
    'units': prefix + '/units',
    'signature': prefix + '/signature',
    'users': prefix + '/users',
    'chicken': prefix + '/chicken',
    'eggs': prefix + '/eggs',
    'address': prefix + '/address',
    'weixinPay': prefix + '/paytest',
    'video': prefix + '/video',
};
require('isomorphic-fetch');

const xml2js = require('xml2js');

/**
 * 连接数据库，线程池
 */
const mysql = require('mysql');
const pool = mysql.createPool({
    host: 'mysql.chickenfarm.com.cn',
    user: 'chickenfarm',
    password: 'cf123456789',
    database: 'db_chickenfarm'
});

exports.xmlToObj =  function (xmlString) {
    const parse = xml2js.parseString;
    return new Promise((resolve, reject) => {
        parse(xmlString, (err, rst) => {
            if(err) {
                reject(err);
            }
            resolve(rst);
        })
    });
}

exports.objToXml = function (obj) {
    const builder = new xml2js.Builder({
        rootName: 'xml',
        headless: true
    });
    return builder.buildObject(obj);
}

exports.objToQuerystring = function (obj) {
    return Object.keys(obj).sort().map(key => `${key}=${obj[key]}`).join('&');
}

exports.randomchar = function (number) {
    const chars = '0123456789ABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('');
    const len = chars.length;
    let result = '';
    for(let i = 0; i < number; i++) {
        result += chars[Math.floor(Math.random() * len)];
    }
    return result;
}

exports.string10to62 = function (number) {
    let chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split(''),
        radix = chars.length,
        qutient = +number,
        arr = [];
    do {
        const mod = qutient % radix;
        qutient = (qutient - mod) / radix;
        arr.unshift(chars[mod]);
    } while (qutient);
    return arr.join('');
}

exports.string62to10 = function (num) {
    let chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ',
        radix = chars.length,
        number_code = String(num),
        len = number_code.length,
        i = 0,
        origin_number = 0;
    while (i < len) {
        origin_number += Math.pow(radix, i++) * chars.indexOf(number_code.charAt(len - i) || 0);
    }
    return origin_number;
}

exports.query = function (operation) {
    return new Promise((resolve, reject) => {
        pool.query(operation, function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);            
        });
    });
}

exports.executeFetch = function (...args) {
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

exports.setObj = function(client) {
    return (key, obj) => {
        client.del(key, () => {
            client.hmset(key, obj);
            client.expire(key, 300);
        })
    }
}

exports.getObj = function(client) {
    return key => new Promise(resolve => {
        client.hgetall(key, (err, obj) => {
            resolve(obj);
        })
    });
}

exports.delObj = function(client) {
    return key => {
        client.del(key)
    }
}

exports.setStr = function(client) {
    return (key, value) => {
        client.del(key, () => {
            client.set(key, value, 'EX', 24 * 60 * 60);
        })
    }
}

exports.getStr = function(client) {
    return key => new Promise(resolve => {
        client.get(key, (err, value) => {
            resolve(value);
        })
    });
}
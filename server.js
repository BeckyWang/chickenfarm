const http = require('http');
const Koa = require('koa');
const PassThrough = require('stream').PassThrough;
const fs = require('fs');
const redis = require('redis');
const bodyParser = require('koa-bodyparser');
const xmlParser = require('koa-xml-body');
const Router = require('koa-router');
const MD5 = require('md5');
const sha1 = require('sha1');

const app = new Koa();
const client = redis.createClient();

const { APPID, SECRET, MCH_ID, PAID_KEY } = require('./server/Const.js');
const { xmlToObj, objToXml, objToQuerystring, randomchar, string10to62, string62to10, query, executeFetch, setObj, getObj, delObj, setStr, getStr } = require('./server/util.js');
const getSaleEggs = require('./server/getSaleEggs.js');

const redisClient = {
    setObject: setObj(client),
    getObject: getObj(client),
    delObject: delObj(client),
    setString: setStr(client),
    getString: getStr(client)
}

const router = new Router({
    prefix: '/weixin/api/v1'
});

router
    //伪造的access
    .get('/fake_access', async cxt => {
        cxt.body = {
            access_token: 'abcxyz123',
            openid: 'xyzabc456',
            jsapi_ticket: '123abcxyz',
            isUser: true
        }
    })
    //根据search参数code获取access_token,openid,isUser
    .get('/access', async cxt => {
        const CODE = cxt.query.code;
        let user = {};
        if(!CODE) {
            cxt.redirect('/weixin/toFarms.html');
            return;
        }
        try {
            const url1 = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${SECRET}&code=${CODE}&grant_type=authorization_code`;
            const {access_token, openid, errcode} = await executeFetch(url1);
            if(errcode) {
                throw new Error();
            }
            const url2 = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
            const {access_token: token} = await executeFetch(url2);
            const url3 = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
            const {ticket, errcode: err} = await executeFetch(url3);
            if(err) {
                throw new Error();
            }
            user = {access_token, openid, jsapi_ticket: ticket};
        } catch(e) {
            cxt.redirect('/weixin/toFarms.html');
            return ;
        }
        const result = await query(`SELECT count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${user.openid}"`);
        cxt.body = {
            access_token: user.access_token,
            openid: user.openid,
            jsapi_ticket: user.jsapi_ticket,
            isUser: !!result[0].total
        }
    })
    //获取所有鸡场信息
    .get('/farms', async cxt => {
        const farms = await query('SELECT cfid, cfname FROM db_chickenfarm.cf_chicken_farm');
        cxt.body = farms;
    })
    //获取指定鸡场的所有单元信息
    .get('/farms/:farmId/units', async cxt => {
        const units = await query(`SELECT cuid FROM db_chickenfarm.cf_chicken_unit WHERE cfid = ${cxt.params.farmId}`);
        cxt.body = units.map(({cuid}) => ({
            cuid,
            cname: string10to62(cuid).slice(-3).padStart(3, '0')
        }));
    })
    //获取指定鸡场单元的所有鸡信息
    .get('/units/:unitId/chicken', async cxt => {
        const currentDatetime = (new Date()).valueOf();
        const chicken = await query(`
            SELECT a.cid, a.cuid, a.ncid, a.breed, a.sex, a.createtime, a.state, a.dailyspending, a.cost, a.adopt_uid, a.price, c.mobile
            FROM db_chickenfarm.cf_chicken a
            LEFT JOIN db_chickenfarm.cf_order b
            ON a.coid = b.oid
            LEFT JOIN db_chickenfarm.cf_user c
            ON b.uid = c.uid
            WHERE a.cuid = ${cxt.params.unitId}
            ORDER BY a.cid
        `);
        
        cxt.body = chicken.map(({cid, cuid, ncid, breed = 0, sex = 2, createtime = currentDatetime, state = 4, dailyspending, cost, adopt_uid, price, mobile}) => {
            const sexs = ['公', '母', ''];
            const breeds = ['', '江汉', '五黑', '鹊桥', '淮南王', '崇仁麻鸡', '太和乌鸡', '旧院黑鸡'];
            return {
                cid,
                cname: `${string10to62(cuid).slice(-3).padStart(3, '0') }${(ncid + '').padStart(2, '0')}`,
                breed: breeds[breed],
                sex: sexs[sex],
                age: Math.floor((currentDatetime - createtime) / 24 / 60 / 60 / 1000),
                state,
                dailyspending,
                deposit: cost,
                isAdopted: !!adopt_uid,
                price,
                mobile
            }
        });
    })
    //获取指定鸡场单元指定日期的所有下蛋信息，日期信息以search参数date表示，格式如: '2017-01-01'
    .get('/units/:unitId/eggs', async cxt => {
        const dArr = cxt.query.date.split('-');
        if(dArr.length !== 3) {
            cxt.body = [];
            return;
        }

        const start = (new Date(cxt.query.date)).valueOf() - 8 * 3600 * 1000;
        const end =  new Date(start + 24 * 3600 * 1000);
        const entTime = `${end.getFullYear()}-${(end.getMonth() + 1 + '').padStart(2, '0')}-${(end.getDate() + '').padStart(2, '0')}`;
        const states = ['预售', '已售', '过期', '处理', ''];
        const eggs = await query(`
            SELECT a.createtime, a.oid, b.eggprice, a.state, a.caid, b.ncid
            FROM db_chickenfarm.cf_egg a
            INNER JOIN db_chickenfarm.cf_chicken b
            ON a.cid = b.cid
            WHERE a.createtime >= '${cxt.query.date}'
            AND a.createtime < '${entTime}'
            AND b.cuid = ${cxt.params.unitId}
        `);
        const result = [];
        const mobileStore = {};
        for(let i = 0, len = eggs.length; i < len; i++) {
            const {createtime, eggprice, state, oid, caid, ncid} = eggs[i];
            const egg = {
                eid: ncid,
                caid,
                state: states[state],
                eggsell: eggprice,
                buyer: null,
                createtime
            };
            if(oid) {
                if(mobileStore[oid]) {
                    egg['buyer'] = mobileStore[oid];
                } else {
                    const rst = await query(`
                        SELECT b.mobile
                        FROM db_chickenfarm.cf_order a
                        INNER JOIN db_chickenfarm.cf_user b
                        ON b.uid = a.uid
                        WHERE a.oid = ${oid}
                    `);
                    egg['buyer'] = rst[0].mobile;
                }
            }
            result.push(egg);
        }
        cxt.body = result;
    })
    //获取指定鸡的信息
    .get('/chicken/:chickenId/info', async cxt => {
        const chicken = await query(`
            SELECT cid, cuid, ncid, breed, sex, createtime, state, dailyspending, cost, adopt_uid, price
            FROM db_chickenfarm.cf_chicken
            WHERE cid = ${cxt.params.chickenId}
        `);
        const currentDatetime = (new Date()).valueOf();
        const sexs = ['公', '母', ''];
        const breeds = ['', '江汉', '五黑', '鹊桥', '淮南王', '崇仁麻鸡', '太和乌鸡', '旧院黑鸡'];
        cxt.body = chicken.length ? {
            cid: cxt.params.chickenId,
            cname: `${string10to62(chicken[0].cuid).slice(-3).padStart(3, '0') }${(chicken[0].ncid + '').padStart(2, '0')}`,
            breed: breeds[chicken[0].breed],
            sex: sexs[chicken[0].sex],
            age: chicken[0].createtime ? Math.floor((currentDatetime - chicken[0].createtime) / 24 / 60 / 60 / 1000) : 0,
            state: chicken[0].state,
            dailyspending: chicken[0].dailyspending,
            deposit: chicken[0].cost,
            isAdopted: !!chicken[0].adopt_uid,
            price: chicken[0].price,
            mobile: chicken[0].mobile
        } : {};
    })
    //获取指定鸡的所有蛋信息
    .get('/chicken/:chickenId/eggs', async cxt => {
        const eggs = await query(`SELECT eid, state, createtime FROM db_chickenfarm.cf_egg WHERE cid = ${cxt.params.chickenId}`);
        cxt.body = eggs;
    })
    //认养一只鸡 header => {openid, accesstoken, ip}, body => {adopt_days}
    .post('/chicken/:chickenId/adopted', async cxt => {
        const {openid, accesstoken, ip} = cxt.header;
        const {adopt_days} = cxt.request.body;
        if(!openid || !accesstoken || !ip) {
            cxt.body = {
                info: '参数不完整！'
            }
            cxt.status = 400;
            return;
        }
        const rst = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${openid}"`);
        if(!rst.length) {
            cxt.status = 400;
            return;
        }
        const {uid} = rst[0];

        const chicken = await query(`
            SELECT adopt_uid, dailyspending, cost
            FROM db_chickenfarm.cf_chicken
            WHERE cid = ${cxt.params.chickenId}
            AND state = 0
        `);
        if(!chicken.length || !!chicken[0]['adopt_uid']) {
            cxt.status = 400;
            return;
        }

        const {cost, dailyspending} = chicken[0];
        //生成订单号
        const date = new Date();
        const order = {
            type: 'chicken_adopt',
            adopt_days,
            chickenId: cxt.params.chickenId,
            uid,
            id: `${date.getFullYear()}${(date.getMonth() + 1 + '').padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}${randomchar(6)}`
        }
        redisClient.setObject(order.id, order);

        const price = ((+cost) + (+dailyspending * adopt_days)) * 100;
        const data = {
            appid: APPID,
            body: '鸡只认养',
            mch_id: MCH_ID,
            nonce_str: randomchar(32),
            notify_url: 'http://www.chickenfarm.com.cn/weixin/api/v1/paynotify',
            openid,
            out_trade_no: order.id,
            spbill_create_ip: ip,
            total_fee: price,
            trade_type: 'JSAPI'
        }
        const stringSignTemp = `${objToQuerystring(data)}&key=${PAID_KEY}`;
        data.sign = MD5(stringSignTemp).toUpperCase();

        const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml'
            },
            body: objToXml(data)
        });
        const {xml: result} = await xmlToObj(await response.text());
        if(result['return_code'][0] == 'FAIL') {
            throw new Error(result['return_msg'][0]);
        }
        if(result['result_code'][0] == 'FAIL') {
            throw new Error(result['err_code_des'][0]);
        }
        cxt.request.body['prepay_id'] = result['prepay_id'][0];
        cxt.body = cxt.request.body;
        cxt.status = 200;
    })
    //对一只鸡认养延期 header => {openid, accesstoken, ip}, body => {adopt_days}
    .post('/chicken/:chickenId/adopt_delay', async cxt => {
        const {openid, accesstoken, ip} = cxt.header;
        const {adopt_days} = cxt.request.body;
        if(!openid || !accesstoken || !ip) {
            cxt.body = {
                info: '参数不完整！'
            }
            cxt.status = 400;
            return;
        }
        const rst = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${openid}"`);
        if(!rst.length) {
            cxt.status = 400;
            return;
        }
        const {uid} = rst[0];

        const chicken = await query(`
            SELECT adopt_uid, dailyspending
            FROM db_chickenfarm.cf_chicken
            WHERE cid = ${cxt.params.chickenId}
            AND state IN (0, 1)
        `);
        if(!chicken.length || chicken[0]['adopt_uid'] != uid) {
            cxt.status = 400;
            return;
        }

        const {dailyspending} = chicken[0];
        //生成订单号
        const date = new Date();
        const order = {
            type: 'chicken_adopt_delay',
            adopt_days,
            chickenId: cxt.params.chickenId,
            uid,
            id: `${date.getFullYear()}${(date.getMonth() + 1 + '').padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}${randomchar(6)}`
        }
        redisClient.setObject(order.id, order);

        const price = (+dailyspending * adopt_days).toFixed(2) * 100;
        const data = {
            appid: APPID,
            body: '鸡只认养延期',
            mch_id: MCH_ID,
            nonce_str: randomchar(32),
            notify_url: 'http://www.chickenfarm.com.cn/weixin/api/v1/paynotify',
            openid,
            out_trade_no: order.id,
            spbill_create_ip: ip,
            total_fee: price,
            trade_type: 'JSAPI'
        }
        const stringSignTemp = `${objToQuerystring(data)}&key=${PAID_KEY}`;
        data.sign = MD5(stringSignTemp).toUpperCase();

        const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml'
            },
            body: objToXml(data)
        });
        const {xml: result} = await xmlToObj(await response.text());
        if(result['return_code'][0] == 'FAIL') {
            throw new Error(result['return_msg'][0]);
        }
        if(result['result_code'][0] == 'FAIL') {
            throw new Error(result['err_code_des'][0]);
        }
        cxt.request.body['prepay_id'] = result['prepay_id'][0];
        cxt.body = cxt.request.body;
        cxt.status = 200;
    })
    //购买一只鸡 header => {openid, accesstoken, ip}, body => {addressId, logistics}，logistics为字符串，表示物流方式（目前只有两种：顺丰包邮/普通快递包邮）
    .post('/chicken/:chickenId/buy', async cxt => {
        const {openid, accesstoken, ip} = cxt.header;
        const {addressId, logistics} = cxt.request.body;
        if(!openid || !accesstoken || !ip) {
            cxt.body = {
                info: '参数不完整！'
            }
            cxt.status = 400;
            return;
        }
        const rst = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${openid}"`);
        if(!rst.length) {
            cxt.status = 400;
            return;
        }
        const {uid} = rst[0];

        const chicken = await query(`
            SELECT a.price, b.cfid, a.adopt_uid, a.adopt_days, a.adopt_date, a.state, a.dailyspending
            FROM db_chickenfarm.cf_chicken a
            LEFT JOIN db_chickenfarm.cf_chicken_unit b
            ON a.cuid = b.cuid
            WHERE a.cid = ${cxt.params.chickenId}
            AND a.state < 3
        `);
        if(!chicken.length) {
            cxt.status = 400;
            return;
        }

        const {price, cfid, adopt_uid, adopt_days, adopt_date, state, dailyspending} = chicken[0];
        const date = new Date();
        const orderId = `${date.getFullYear()}${(date.getMonth() + 1 + '').padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}${randomchar(6)}`;
        if(adopt_uid == uid) {
            const adoptDays = Math.floor((date.valueOf() - adopt_date) / 60 /60 / 24 / 1000);
            if(adoptDays < 30) {
                cxt.status = 400;
                return;
            }
            const restDays = adopt_days - adoptDays;
            const datetime = `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            await query(`
                INSERT INTO db_chickenfarm.cf_order (wxoid, uid, ordertime, paytime, finishtime, cfid, pid, raid, logcom, total_fee)
                VALUES ('${orderId}', ${uid}, '${datetime}', '${datetime}', '${datetime}', ${cfid}, 2, ${addressId}, '${logistics}', 0)
            `);
            const result = await query(`
                SELECT oid FROM db_chickenfarm.cf_order
                WHERE wxoid = '${orderId}'
            `);
            query(`
                UPDATE db_chickenfarm.cf_chicken
                SET coid = ${result[0].oid}, state = 3, adopt_days = null, adopt_date = null, adopt_uid = null
                WHERE cid = ${cxt.params.chickenId};
            `);
            query(`
                INSERT INTO db_chickenfarm.cf_wealth (uid, recorddatetime, recordtype, iomoney, iostate, paymenttype, ioput)
                VALUES (${uid}, '${datetime}', 1, '${(dailyspending * restDays).toFixed(2)}', 2, 0, 0);
            `);
            cxt.status = 200;
        } else {
            //生成订单号
            const order = {
                type: 'chicken_buy',
                price,
                chickenId: cxt.params.chickenId,
                farmId: cfid,
                uid,
                addressId,
                logistics,
                id: orderId
            }
            redisClient.setObject(orderId, order);

            const orderprice = (+price) * 100;
            const data = {
                appid: APPID,
                body: '鸡只购买',
                mch_id: MCH_ID,
                nonce_str: randomchar(32),
                notify_url: 'http://www.chickenfarm.com.cn/weixin/api/v1/paynotify',
                openid,
                out_trade_no: orderId,
                spbill_create_ip: ip,
                total_fee: orderprice,
                trade_type: 'JSAPI'
            }
            const stringSignTemp = `${objToQuerystring(data)}&key=${PAID_KEY}`;
            data.sign = MD5(stringSignTemp).toUpperCase();

            const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: objToXml(data)
            });
            const {xml : result} = await xmlToObj(await response.text());
            if(result['return_code'][0] == 'FAIL') {
                throw new Error(result['return_msg'][0]);
            }
            if(result['result_code'][0] == 'FAIL') {
                throw new Error(result['err_code_des'][0]);
            }
            cxt.request.body['prepay_id'] = result['prepay_id'][0];
            cxt.body = cxt.request.body;
            cxt.status = 200;
        }
    })
    //鸡蛋订购 header => {openid, accesstoken, ip}, body => {orderId, addressId, logistics}，logistics为字符串，表示物流方式（目前只有两种：顺丰包邮/普通快递包邮）
    .post('/eggs/order', async cxt => {
        const {openid, accesstoken, ip} = cxt.header;
        if(!openid || !accesstoken || !ip) {
            cxt.body = {
                info: '参数不完整！'
            }
            cxt.status = 400;
            return;
        }
        const { orderId, addressId, logistics } = cxt.request.body;
        if(!orderId || !addressId) {
            cxt.status = 400;
            return;
        }
        //order = {eggs, farmId, uid, type, id}
        const order = await redisClient.getObject(orderId);
        if(!order || order.type != 'egg') {
            cxt.status = 400;
            return;
        }

        order.addressId = addressId;
        order.logistics = logistics;
        redisClient.setObject(orderId, order);

        const Express_Price = 0;
        const price = JSON.parse(order.eggs).reduce((rst, {eggsell}) => rst + (eggsell || 0.8) , 0).toFixed(2) * 100 + Express_Price;
        const data = {
            appid: APPID,
            body: '鸡蛋订购',
            mch_id: MCH_ID,
            nonce_str: randomchar(32),
            notify_url: 'http://www.chickenfarm.com.cn/weixin/api/v1/paynotify',
            openid,
            out_trade_no: orderId,
            spbill_create_ip: ip,
            total_fee: price,
            trade_type: 'JSAPI'
        }
        const stringSignTemp = `${objToQuerystring(data)}&key=${PAID_KEY}`;
        data.sign = MD5(stringSignTemp).toUpperCase();

        const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml'
            },
            body: objToXml(data)
        });
        const {xml : result} = await xmlToObj(await response.text());
        if(result['return_code'][0] == 'FAIL') {
            throw new Error(result['return_msg'][0]);
        }
        if(result['result_code'][0] == 'FAIL') {
            throw new Error(result['err_code_des'][0]);
        }
        cxt.request.body['prepay_id'] = result['prepay_id'][0];
        cxt.body = cxt.request.body;
        cxt.status = 200;
    })
    //用户获取自己对指定鸡关注和认养的信息
    .get('/users/:wxId/chicken/:chickenId/relation', async cxt => {
        const relation = {focused: false, adopted: false};
        const result = await query(`SELECT uid, count(*) AS total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        const {total, uid} = result[0];
        if(!total) {
            cxt.body = relation;
            return;
        }
        const isFocused = await query(`
            SELECT count(*) AS len
            FROM db_chickenfarm.cf_focus
            WHERE fcid = ${cxt.params.chickenId}
            AND fuid = ${uid}
        `);
        const isAdopted = await query(`
            SELECT count(*) AS len
            FROM db_chickenfarm.cf_chicken
            WHERE cid = ${cxt.params.chickenId}
            AND adopt_uid = ${uid}
        `);
        cxt.body = {
            focused: !!isFocused[0].len,
            adopted: !!isAdopted[0].len
        }
    })
    //用户关注/取消关注一只鸡(最多关注50只)
    .post('/users/:wxId/chicken/:chickenId/focus', async cxt => {
        const MAX_NUM = 50;
        const result = await query(`SELECT uid, count(*) AS total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result[0].total) {
            cxt.redirect('/weixin/toLogin.html');
            return;
        }
        const rst = await query(`
            SELECT count(*) AS len
            FROM db_chickenfarm.cf_focus
            WHERE fcid = ${cxt.params.chickenId}
            AND fuid = ${result[0].uid}
        `);
        if(rst[0].len) {
            query(`
                DELETE FROM db_chickenfarm.cf_focus
                WHERE fcid = ${cxt.params.chickenId}
                AND fuid = ${result[0].uid}
            `);
        } else {
            const focuslen = await query(`
                SELECT count(*) AS len
                FROM db_chickenfarm.cf_focus
                WHERE fuid = ${result[0].uid}
            `);
            if(focuslen[0].len >= MAX_NUM) {
                cxt.body = {
                    info: `您最多关注${MAX_NUM}只鸡！`
                };
                cxt.status = 400;
                return;
            }
            query(`
                INSERT INTO db_chickenfarm.cf_focus (fuid, fcid)
                VALUES (${result[0].uid}, ${cxt.params.chickenId})
            `)
        }
        cxt.status = 200;
    })
    //指定用户对其指定认养鸡设置鸡蛋自留/可售
    .post('/users/:wxId/chicken/:chickenId/eggkept', async cxt => {
        const MAX_NUM = 50;
        const result = await query(`SELECT uid, count(*) AS total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result[0].total) {
            cxt.redirect('/weixin/toLogin.html');
            return;
        }
        const rst = await query(`
            SELECT state
            FROM db_chickenfarm.cf_chicken
            WHERE cid = ${cxt.params.chickenId}
            AND adopt_uid = ${result[0].uid}
        `);
        if(!rst.length || rst[0].state > 1) {
            throw new Error('操作失败！');
        }
        query(`
            UPDATE db_chickenfarm.cf_chicken
            SET state = ${(rst[0].state + 1) % 2}
            WHERE cid = ${cxt.params.chickenId}
            AND adopt_uid = ${result[0].uid}
        `);
        cxt.status = 200;
    })
    //获取用户所有认养鸡信息(wxId是微信openId)
    .get('/users/:wxId/adopted', async cxt => {
        const result = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result.length) {
            cxt.redirect('/weixin/toLogin.html');
            return;
        }
        const current = new Date();
        const currentDatetime = current.valueOf();
        const startTime = `${current.getFullYear()}-${(current.getMonth() + 1 + '').padStart(2, '0')}-${(current.getDate() + '').padStart(2, '0')}`
        const end =  new Date(currentDatetime + 24 * 3600 * 1000);
        const endTime = `${end.getFullYear()}-${(end.getMonth() + 1 + '').padStart(2, '0')}-${(end.getDate() + '').padStart(2, '0')}`;
        const chicken = await query(`
            SELECT a.cid, a.cuid, a.ncid, a.adopt_date, a.adopt_days, a.createtime, count(b.cid) AS eggnum, a.state
            FROM db_chickenfarm.cf_chicken a
            LEFT JOIN (SELECT cid FROM db_chickenfarm.cf_egg
                WHERE createtime < '${endTime}'
                AND createtime >= '${startTime}'
            ) b
            ON b.cid = a.cid
            WHERE a.adopt_uid = ${result[0].uid}
            GROUP BY a.cid
        `);
        cxt.body = chicken.map(({cid, cuid, ncid, adopt_date, adopt_days, createtime, eggnum, state}) => {
            const adoptDays = Math.floor((currentDatetime - adopt_date) / 60 /60 / 24 / 1000);
            const restDays = adopt_days - adoptDays;
            const age = Math.floor((currentDatetime - createtime) / 60 /60 / 24 / 1000);
            const cname = `${string10to62(cuid).slice(-3).padStart(3, '0') }${(ncid + '').padStart(2, '0')}`;
            return { cid, cname, adoptDays, restDays, age, eggnum, state};
        });
    })
    //获取用户在指定鸡场的认养鸡信息(wxId是微信openId)
    .get('/users/:wxId/farms/:farmId/adopted', async cxt => {
        const result = await query(`SELECT uid, count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result[0].total) {
            cxt.redirect('/weixin/toLogin.html');
            return;
        }
        const current = new Date();
        const currentDatetime = current.valueOf();
        const startTime = `${current.getFullYear()}-${(current.getMonth() + 1 + '').padStart(2, '0')}-${(current.getDate() + '').padStart(2, '0')}`
        const end =  new Date(currentDatetime + 24 * 3600 * 1000);
        const endTime = `${end.getFullYear()}-${(end.getMonth() + 1 + '').padStart(2, '0')}-${(end.getDate() + '').padStart(2, '0')}`;
        const chicken = await query(`
            SELECT a.cid, a.cuid, a.ncid, a.adopt_date, a.adopt_days, a.createtime, count(b.cid) AS eggnum, a.state
            FROM db_chickenfarm.cf_chicken a
            LEFT JOIN (SELECT cid FROM db_chickenfarm.cf_egg
                WHERE createtime < '${endTime}'
                AND createtime >= '${startTime}'
            ) b
            ON b.cid = a.cid
            WHERE a.adopt_uid = ${result[0].uid}
            AND a.cuid IN (SELECT c.cuid FROM db_chickenfarm.cf_chicken_unit c WHERE c.cfid = ${cxt.params.farmId})
            GROUP BY a.cid
        `);
        cxt.body = chicken.map(({cid, cuid, ncid, adopt_date, adopt_days, createtime, eggnum, state}) => {
            const adoptDays = Math.floor((currentDatetime - adopt_date) / 60 /60 / 24 / 1000);
            const restDays = adopt_days - adoptDays;
            const age = Math.floor((currentDatetime - createtime) / 60 /60 / 24 / 1000);
            const cname = `${string10to62(cuid).slice(-3).padStart(3, '0') }${(ncid + '').padStart(2, '0')}`;
            return { cid, cname, adoptDays, restDays, age, eggnum, state};
        });
    })
    //获取用户所有关注鸡信息(wxId是微信openId)
    .get('/users/:wxId/focus', async cxt => {
        const result = await query(`SELECT uid, count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result[0].total) {
            cxt.redirect('/weixin/toLogin.html');
            return;
        }
        const chicken = await query(`
            SELECT b.cid, b.cuid, b.ncid, b.createtime, b.state, b.price, b.adopt_uid
            FROM db_chickenfarm.cf_focus a
            LEFT JOIN db_chickenfarm.cf_chicken b
            ON a.fcid = b.cid
            WHERE a.fuid = ${result[0].uid}
        `);
        const currentDatetime = (new Date()).valueOf();
        cxt.body = chicken.map(({cid, cuid, ncid, createtime, state, price, adopt_uid}) => ({
            age: Math.floor((currentDatetime - createtime) / 60 /60 / 24 / 1000),
            id: cid,
            name: `${string10to62(cuid).slice(-3).padStart(3, '0') }${(ncid + '').padStart(2, '0')}`,
            state,
            price,
            isAdopted: !!adopt_uid
        }));
    })
    //获取用户在指定鸡场的关注鸡信息(wxId是微信openId)
    .get('/users/:wxId/farms/:farmId/focus', async cxt => {
        const result = await query(`SELECT uid, count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result[0].total) {
            cxt.redirect('/weixin/toLogin.html');
            return;
        }
        const chicken = await query(`
            SELECT a.fcid, b.cuid, b.ncid, b.createtime, b.state, b.price, b.adopt_uid
            FROM db_chickenfarm.cf_focus a
            INNER JOIN db_chickenfarm.cf_chicken b
            ON b.cid = a.fcid
            WHERE a.fuid = ${result[0].uid}
            AND b.cuid IN (
                SELECT c.cuid
                FROM db_chickenfarm.cf_chicken_unit c
                WHERE c.cfid = ${cxt.params.farmId})
            `);
        const currentDatetime = (new Date()).valueOf();
        cxt.body = chicken.map(({fcid, cuid, ncid, createtime, state, price, adopt_uid}) => ({
            age: Math.floor((currentDatetime - createtime) / 60 /60 / 24 / 1000),
            id: fcid,
            name: `${string10to62(cuid).slice(-3).padStart(3, '0') }${(ncid + '').padStart(2, '0')}`,
            state,
            price,
            isAdopted: !!adopt_uid
        }));
    })
    //获取指定用户信息
    .get('/users/:wxId/info', async cxt => {
        const result = await query(`SELECT uid, mobile, realname, email, alipay, idcard, idcardtype, gender FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        cxt.body = result.length ? result[0] : {};
    })
    //新增或修改指定用户信息
    .post('/users/:wxId/info', async cxt => {
        const {mobile, realname, email = '', alipay = '', idcard = '', idcardtype = '', gender = 0} = cxt.request.body;
        if(!mobile || !realname) {
            cxt.body = {
                info: '请把必填信息填全！'
            }
            cxt.status = 400;
            return;
        }
        const result = await query(`SELECT uid, count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        const {total, uid} = result[0];
        if(!total) {
            await query(`
                INSERT INTO db_chickenfarm.cf_user (mobile, realname, email, alipay, idcard, idcardtype, gender, wxid)
                VALUES ('${mobile}', '${realname}', '${email}', '${alipay}', '${idcard}', '${idcardtype}', ${gender}, '${cxt.params.wxId}')
            `);
            const uidRst = await query(`
                SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"
            `);
        } else {
            query(`
                UPDATE db_chickenfarm.cf_user
                SET mobile = '${mobile}', realname = '${realname}', email = '${email}', alipay = '${alipay}', idcard = '${idcard}', idcardtype = '${idcardtype}', gender = ${gender}
                WHERE wxid = '${cxt.params.wxId}'
            `);
        }
        cxt.status = 200;
    })
    //添加指定用户的提现账号, application/json, body信息: {alipay}
    .post('/users/:wxId/alipay', async cxt => {
        const {alipay} = cxt.request.body;
        if(!alipay) {
            cxt.body = {
                info: '请把信息填全！'
            }
            cxt.status = 400;
            return;
        }
        query(`
            UPDATE db_chickenfarm.cf_user
            SET alipay = '${alipay}'
            WHERE wxid = '${cxt.params.wxId}'
        `);
        cxt.status = 200;
    })
    //获取指定用户收货地址
    .get('/users/:wxId/address', async cxt => {
        const result = await query(`SELECT uid, count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        const {total, uid} = result[0];
        if(!total) {
            cxt.body = [];
            return;
        }
        cxt.body = await query(`SELECT raid, address, phone, consignee FROM db_chickenfarm.cf_receiver_address WHERE uid = ${uid}`); 
    })
    //添加指定用户的收货地址, application/json, body信息: {phone, address, consignee}
    .post('/users/:wxId/address', async cxt => {
        const {phone, address, consignee} = cxt.request.body;
        if(!phone || !address || !consignee) {
            cxt.body = {
                info: '请把信息填全！'
            }
            cxt.status = 400;
            return;
        }
        const result = await query(`SELECT uid, count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        const {total, uid} = result[0];
        if(!total) {
            cxt.body = {
                info: '您还不是平台会员，不能添加收货地址！'
            };
            cxt.status = 400;
            return;
        }
        query(`
            INSERT INTO db_chickenfarm.cf_receiver_address (uid, phone, address, consignee)
            VALUES (${uid}, '${phone}', '${address}', '${consignee}')
        `);
        cxt.status = 200;
    })
    //修改指定用户的收货地址, application/json, body信息: {phone, address, consignee, addressId}
    .post('/users/:wxId/address/:addressId', async cxt => {
        const {phone, address, consignee, addressId} = cxt.request.body;
        if(!phone || !address || !consignee || !addressId) {
            cxt.body = {
                info: '请把信息填全！'
            }
            cxt.status = 400;
            return;
        }
        const result = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result.length) {
            cxt.body = {
                info: '您还不是平台会员，不能添加收货地址！'
            };
            cxt.status = 400;
            return;
        }
        const {uid} = result[0];
        query(`
            UPDATE db_chickenfarm.cf_receiver_address
            SET uid = ${uid}, phone = '${phone}', address = '${address}', consignee = '${consignee}'
            WHERE raid = ${addressId}
        `);
        cxt.status = 200;
    })
    //删除指定用户的指定收货地址
    .delete('/users/:wxId/address/:addressId', async cxt => {
        const result = await query(`SELECT uid, count(*) as total FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        const {total, uid} = result[0];
        if(total) {
            query(`
                DELETE FROM db_chickenfarm.cf_receiver_address
                WHERE uid = ${uid}
                AND raid = ${cxt.params.addressId}
            `);
        }
        cxt.status = 200;
    })
    //获取地址详情
    .get('/address/:addressId', async cxt => {
        const addressId = cxt.params.addressId;
        const result = await query(`
            SELECT raid, address, phone, consignee FROM db_chickenfarm.cf_receiver_address WHERE raid = ${addressId}
        `);
        cxt.body = result.length ? result[0] : {};
    })
    //指定鸡场购买鸡蛋, status:{0: 足够鸡蛋, 2: 换鸡场, 1: 没有符合鸡场}
    .post('/users/:wxId/farms/:farmId/eggsell', async cxt => {
        const userSearchRst = await query(`SELECT uid, referrer_uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!userSearchRst.length) {
            cxt.body = {
                info: '您还不是平台会员，不能参与购买！'
            };
            cxt.status = 400;
            return;
        }
        const {uid, referrer_uid} = userSearchRst[0];

        const farmsHasSearched = new Set();
        let isDone = false;
        let farmId = cxt.params.farmId;
        let eggs = [], state = 1;

        //获取本鸡场的鸡
        const searchRst = await getSaleEggs(farmId, uid, referrer_uid);
        farmsHasSearched.add(farmId);
        if(searchRst.status === 0) {
            eggs = searchRst.eggsForSale;
            state = 0;
            isDone = true;
        }

        //获取认养鸡的所在鸡场, 再取鸡
        if(!isDone) {
            const farms = await query(`
                SELECT b.cfid
                FROM db_chickenfarm.cf_chicken a
                LEFT JOIN db_chickenfarm.cf_chicken_unit b
                ON b.cuid = a.cuid
                WHERE a.adopt_uid = ${uid}
            `);
            if(farms.length) {
                for(let i = 0, len = farms.length; i < len; i++) {
                    farmId = farms[i].cfid;
                    if(farmsHasSearched.has(farmId)) {
                        continue;
                    }
                    const {status, eggsForSale} = await getSaleEggs(farmId, uid, referrer_uid);
                    farmsHasSearched.add(farmId);
                    if(status === 0) {
                        state = 2;
                        eggs = eggsForSale;
                        isDone = true;
                        break;
                    }
                }
            }
        }
            
        //获取关注鸡的所在鸡场, 再取鸡
        if(!isDone) {
            const farms = await query(`
                SELECT c.cfid
                FROM db_chickenfarm.cf_chicken a
                INNER JOIN db_chickenfarm.cf_focus b
                ON b.fcid = a.cid
                LEFT JOIN db_chickenfarm.cf_chicken_unit c
                ON c.cuid = a.cuid
                WHERE b.fuid = ${uid}
            `);
            if(farms.length) {
                for(let i = 0, len = farms.length; i < len; i++) {
                    farmId = farms[i].cfid;
                    if(farmsHasSearched.has(farmId)) {
                        continue;
                    }
                    const {status, eggsForSale} = await getSaleEggs(farmId, uid, referrer_uid);
                    farmsHasSearched.add(farmId);
                    if(status === 0) {
                        state = 2;
                        eggs = eggsForSale;
                        isDone = true;
                        break;
                    }
                }
            }
        }

        //系统匹配
        if(!isDone) {
            const farms = await query(`
                SELECT cfid
                FROM db_chickenfarm.cf_chicken_farm
            `);
            if(farms.length) {
                for(let i = 0, len = farms.length; i < len; i++) {
                    farmId = farms[i].cfid;
                    if(farmsHasSearched.has(farmId)) {
                        continue;
                    }
                    const {status, eggsForSale} = await getSaleEggs(farmId, uid, referrer_uid);
                    farmsHasSearched.add(farmId);
                    if(status === 0) {
                        state = 2;
                        eggs = eggsForSale;
                        isDone = true;
                        break;
                    }
                }
            }
        }

        let farmName = '';
        if(state == 0 || state == 2) {
            const farmRst = await query(`
                SELECT cfname
                FROM db_chickenfarm.cf_chicken_farm
                WHERE cfid = ${farmId}
            `);
            farmName = farmRst[0].cfname;

            //生成订单号
            const date = new Date();
            eggs = Array.from(eggs, ({eid, cid, createtime, cuid, ncid, eggsell = 0, mobile, adopt_uid}) => {
                const cuidname = string10to62(cuid).slice(-3).padStart(3, '0');
                return {
                    createtime, mobile,
                    eggsell,
                    cuid: cuidname,
                    cname: `${string10to62(cuid).slice(-3).padStart(3, '0') }${(ncid + '').padStart(2, '0')}`,
                    eid,
                    ename: (ncid + '').padStart(2, '0'),
                    adopt_uid
                }
            });
            //存至redis
            const order = {
                eggs: JSON.stringify(eggs),
                farmId,
                type: 'egg',
                uid,
                id: `${date.getFullYear()}${(date.getMonth() + 1 + '').padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}${randomchar(6)}`
            };
            redisClient.setObject(order.id, order);

            cxt.body = {
                status: state,
                eggs,
                farmId,
                farmName,
                orderId: order.id
            }
        } else {
            cxt.body = {
                status: state
            }
        }
    })
    //不指定鸡场购买鸡蛋, status:{0: 足够鸡蛋, 1: 没有符合鸡场}
    .post('/users/:wxId/eggsell', async cxt => {
        const userSearchRst = await query(`SELECT uid, referrer_uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!userSearchRst.length) {
            cxt.body = {
                info: '您还不是平台会员，不能参与购买！'
            };
            cxt.status = 400;
            return;
        }
        const {uid, referrer_uid} = userSearchRst[0];

        const farmsHasSearched = new Set();
        let isDone = false;
        let farmId = '';
        let eggs = [], state = 1;

        //获取认养鸡的所在鸡场, 再取鸡
        if(!isDone) {
            const farms = await query(`
                SELECT b.cfid
                FROM db_chickenfarm.cf_chicken a
                LEFT JOIN db_chickenfarm.cf_chicken_unit b
                ON b.cuid = a.cuid
                WHERE a.adopt_uid = ${uid}
            `);
            if(farms.length) {
                for(let i = 0, len = farms.length; i < len; i++) {
                    farmId = farms[i].cfid;
                    if(farmsHasSearched.has(farmId)) {
                        continue;
                    }
                    const {status, eggsForSale} = await getSaleEggs(farmId, uid, referrer_uid);
                    farmsHasSearched.add(farmId);
                    if(status === 0) {
                        state = 0;
                        eggs = eggsForSale;
                        isDone = true;
                        break;
                    }
                }
            }
        }
            
        //获取关注鸡的所在鸡场, 再取鸡
        if(!isDone) {
            const farms = await query(`
                SELECT c.cfid
                FROM db_chickenfarm.cf_chicken a
                INNER JOIN db_chickenfarm.cf_focus b
                ON b.fcid = a.cid
                LEFT JOIN db_chickenfarm.cf_chicken_unit c
                ON c.cuid = a.cuid
                WHERE b.fuid = ${uid}
            `);
            if(farms.length) {
                for(let i = 0, len = farms.length; i < len; i++) {
                    farmId = farms[i].cfid;
                    if(farmsHasSearched.has(farmId)) {
                        continue;
                    }
                    const {status, eggsForSale} = await getSaleEggs(farmId, uid, referrer_uid);
                    farmsHasSearched.add(farmId);
                    if(status === 0) {
                        state = 0;
                        eggs = eggsForSale;
                        isDone = true;
                        break;
                    }
                }
            }
        }

        //系统匹配
        if(!isDone) {
            const farms = await query(`
                SELECT cfid
                FROM db_chickenfarm.cf_chicken_farm
            `);
            if(farms.length) {
                for(let i = 0, len = farms.length; i < len; i++) {
                    farmId = farms[i].cfid;
                    if(farmsHasSearched.has(farmId)) {
                        continue;
                    }
                    const {status, eggsForSale} = await getSaleEggs(farmId, uid, referrer_uid);
                    farmsHasSearched.add(farmId);
                    if(status === 0) {
                        state = 0;
                        eggs = eggsForSale;
                        isDone = true;
                        break;
                    }
                }
            }
        }

        let farmName = '';
        if(state < 1) {
            const farmRst = await query(`
                SELECT cfname
                FROM db_chickenfarm.cf_chicken_farm
                WHERE cfid = ${farmId}
            `);
            farmName = farmRst[0].cfname;

            //生成订单号
            const date = new Date();
            eggs = Array.from(eggs, ({eid, cid, createtime, cuid, ncid, eggsell = 0, mobile, adopt_uid}) => {
                const cuidname = string10to62(cuid).slice(-3).padStart(3, '0');
                return {
                    createtime, mobile, adopt_uid,
                    eggsell,
                    cuid: cuidname,
                    cname: `${string10to62(cuid).slice(-3).padStart(3, '0') }${(ncid + '').padStart(2, '0')}`,
                    eid,
                    ename: (ncid + '').padStart(2, '0'),
                    adopt_uid
                }
            });
            //存至redis
            const order = {
                eggs: JSON.stringify(eggs),
                farmId,
                uid,
                type: 'egg',
                id: `${date.getFullYear()}${(date.getMonth() + 1 + '').padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}${randomchar(6)}`
            };
            redisClient.setObject(order.id, order);

            cxt.body = {
                status: state,
                eggs,
                farmId,
                farmName,
                orderId: order.id
            }
        } else {
            cxt.body = {
                status: state
            }
        }
    })
    //指定用户提现, body = {amount}  amount为 1.00 格式
    .post('/users/:wxId/withdraw', async cxt => {
        const {amount} = cxt.request.body;
        const result = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result.length) {
            cxt.body = 400;
            return;
        }
        const {uid} = result[0];
        const wealthList = await query(`
            SELECT recordtype, iomoney
            FROM db_chickenfarm.cf_wealth
            WHERE uid = ${uid}
        `);
        const wealth = wealthList.reduce((rst, {recordtype, iomoney}) => recordtype ? (rst + iomoney) : (rst - iomoney), 0);
        if(+wealth < +amount) {
            cxt.body = 400;
            return;
        }
        const date = new Date();
        const datetime = `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        query(`
            INSERT INTO db_chickenfarm.cf_wealth (uid, recorddatetime, recordtype, iomoney, iostate, paymenttype, ioput)
            VALUES (${uid}, '${datetime}', 0, '${amount}', 0, 0, 2)
        `);
        cxt.status = 200;
    })
    //获取指定用户的推荐客户列表 => [{uid, realname, totalEggs, curMonthEggs, totalChicken, curMonthChicken}]
    .get('/users/:wxId/customer', async cxt => {
        const result = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result.length) {
            cxt.body = 400;
            return;
        }
        const {uid} = result[0];
        const list = await query(`
            SELECT a.uid, a.realname, b.pid, DATE_FORMAT(b.finishtime, '%Y-%m') AS date
            FROM db_chickenfarm.cf_user a
            LEFT JOIN db_chickenfarm.cf_order b
            ON a.uid = b.uid
            WHERE a.referrer_uid = ${uid}
        `);
        const curDate = `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1).toString().padStart(2, 0)}`;
        const referrerList = {};
        list.forEach(({uid, realname, pid, date}) => {
            const user = referrerList[uid] || {
                uid,
                realname,
                totalEggs: 0,
                curMonthEggs: 0,
                totalChicken: 0,
                curMonthChicken: 0
            };
            if(pid == 1) {  //蛋
                user.totalEggs += 30;
                if(date == curDate) {
                    user.curMonthEggs += 30;
                }
            } else if(pid == 2){    //鸡
                user.totalChicken++;
                if(date == curDate) {
                    user.curMonthChicken++;
                }
            }
            referrerList[uid] = user;
        });
        cxt.body = Object.values(referrerList);
        cxt.status = 200;
    })
    //获取指定用户的财富信息
    .get('/users/:wxId/wealth', async cxt => {
        const result = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${cxt.params.wxId}"`);
        if(!result.length) {
            cxt.body = 400;
            return;
        }
        const {uid} = result[0];
        const wealthList = await query(`
            SELECT recordtype, iomoney
            FROM db_chickenfarm.cf_wealth
            WHERE uid = ${uid}
        `);
        const wealth = wealthList.reduce((rst, {recordtype, iomoney}) => recordtype ? (rst + iomoney) : (rst - iomoney), 0).toFixed(2);

        const chicken = await query(`
            SELECT adopt_date, adopt_days, cost, dailyspending
            FROM db_chickenfarm.cf_chicken
            WHERE adopt_uid = ${uid}
        `);
        const currentDatetime = (new Date()).valueOf();
        const deposit = chicken.reduce((rst, {adopt_date, adopt_days, cost, dailyspending}) => {
            const adoptDays = Math.floor((currentDatetime - adopt_date) / 60 /60 / 24 / 1000);
            const restDays = adopt_days - adoptDays;
            return rst + cost + dailyspending * restDays;
        }, 0).toFixed(2);

        cxt.body = {
            wealth,
            deposit
        };
    })
    //推荐 path: wxId => 本人openId,  body: { referrerId } //推荐人openId
    .post('/users/:wxId/recommend', async cxt => {
        const {referrerId} = cxt.request.body;
        const {wxId} = cxt.params;
        if(wxId && referrerId) {
            const result = await query(`SELECT uid FROM db_chickenfarm.cf_user WHERE wxid = "${referrerId}"`);
            if(result.length) {
                redisClient.setString(wxId, result[0].uid);
            }
        }
        cxt.status = 200;
    })
    //接收微信服务器端的支付结果通知
    .post('/paynotify', async cxt => {
        const {xml: {result_code, return_code, total_fee, out_trade_no, time_end}} = cxt.request.body;
        if(!out_trade_no[0]) {
            cxt.body = `<xml>
                    <return_code><![CDATA[FAIL]]></return_code>
                    <return_msg><![CDATA[参数out_trade_no错误]]></return_msg>
                </xml>`;
            return ;
        }
        if(result_code[0] == 'SUCCESS' && return_code[0] == 'SUCCESS') {
            const isExist = await query(`
                SELECT oid FROM db_chickenfarm.cf_order
                WHERE wxoid = '${out_trade_no[0]}'
            `);
            if(isExist.length) {
                cxt.body = `<xml>
                    <return_code><![CDATA[FAIL]]></return_code>
                    <return_msg><![CDATA[参数out_trade_no错误]]></return_msg>
                </xml>`;
                return;
            }

            //order = {eggs, farmId, uid, type, addressId, logistics, chickenId, adopt_days, price}
            const order = await redisClient.getObject(out_trade_no[0]);
            if(!order) {
                cxt.body = `<xml>
                    <return_code><![CDATA[FAIL]]></return_code>
                    <return_msg><![CDATA[参数out_trade_no错误]]></return_msg>
                </xml>`;
                return;
            }

            //推荐关系
            query(`SELECT COUNT(*) AS orderNum FROM db_chickenfarm.cf_order WHERE uid = ${order.uid}`).then(rst => {
                if(!rst.orderNum) {
                    query(`SELECT wxid FROM db_chickenfarm.cf_user WHERE uid = ${order.uid}`)
                        .then(rst => rst.length ? redisClient.getString(rst[0].wxid) : null)
                        .then(referrer_uid => {
                            if(referrer_uid) {
                                query(`
                                    UPDATE db_chickenfarm.cf_user
                                    SET referrer_uid = ${referrer_uid}
                                    WHERE uid = ${order.uid}
                                `)
                            }
                        });
                }
            });
            
            const datetime = `${time_end[0].slice(0, 4)}-${time_end[0].slice(4, 6)}-${time_end[0].slice(6, 8)} ${time_end[0].slice(8, 10)}:${time_end[0].slice(10, 12)}:${time_end[0].slice(12, 14)}`;
            const date = `${time_end[0].slice(0, 4)}-${time_end[0].slice(4, 6)}-${time_end[0].slice(6, 8)}`;
            if(order.type == 'egg') {
                const {eggs, farmId, uid, addressId, logistics} = order;
                await query(`
                    INSERT INTO db_chickenfarm.cf_order (wxoid, uid, ordertime, paytime, finishtime, cfid, pid, raid, logcom, total_fee)
                    VALUES ('${out_trade_no[0]}', ${uid}, '${datetime}', '${datetime}', '${datetime}', ${farmId}, 1, ${addressId}, '${logistics}', ${total_fee[0]})
                `);
                const result = await query(`
                    SELECT oid FROM db_chickenfarm.cf_order
                    WHERE wxoid = '${out_trade_no[0]}'
                `);
                const egglist = JSON.parse(eggs);
                const eggIds = [], adopt_users = {}, recommend = {};
                egglist.forEach(({eid, adopt_uid, eggsell}) => {
                    eggIds.push(eid);
                    if(adopt_uid) {
                        adopt_users[adopt_uid] = adopt_users[adopt_uid] ? (adopt_users[adopt_uid] + eggsell * 0.9 - 0.25) : (eggsell * 0.9 - 0.25);
                        recommend[adopt_uid] = recommend[adopt_uid] ? (recommend[adopt_uid] + eggsell * 0.1) : (eggsell * 0.1);
                    }
                });
                const userToReferrer = Object.keys(adopt_users).length ? (await query(`
                    SELECT uid, referrer_uid
                    FROM db_chickenfarm.cf_user
                    WHERE uid IN (${Object.keys(adopt_users).join(',')})
                `)).reduce((rst, {uid, referrer_uid}) => {
                    if(referrer_uid) {
                        rst[uid] = referrer_uid;
                    }
                    return rst;
                }, {}) : {};
                const sql = [...Object.keys(adopt_users).map(id => `
                    ,(${id}, '${datetime}', 1, '${adopt_users[id].toFixed(2)}', 2, 0, 6)
                `), ...Object.keys(userToReferrer).map(id => `
                    ,(${userToReferrer[id]}, '${datetime}', 1, '${recommend[id].toFixed(2)}', 2, 0, 8)
                `)];

                query(`
                    UPDATE db_chickenfarm.cf_egg
                    SET oid = ${result[0].oid}, state = 1
                    WHERE eid IN (${eggIds.join(',')});
                `);
                query(`
                    INSERT INTO db_chickenfarm.cf_wealth (uid, recorddatetime, recordtype, iomoney, iostate, paymenttype, ioput)
                    VALUES (${uid}, '${datetime}', 1, '${total_fee[0]/100}', 2, 0, 3),
                           (${uid}, '${datetime}', 0, '${total_fee[0]/100}', 2, 0, 4)
                           ${sql.join('')};
                `);
                redisClient.delObject(out_trade_no[0]);
            } else if(order.type == 'chicken_adopt') {
                const {uid, adopt_days, chickenId} = order;
                query(`
                    UPDATE db_chickenfarm.cf_chicken
                    SET adopt_uid = ${uid}, adopt_days = ${adopt_days}, adopt_date = '${date}'
                    WHERE cid = ${chickenId};
                `);
                query(`
                    INSERT INTO db_chickenfarm.cf_wealth (uid, recorddatetime, recordtype, iomoney, iostate, paymenttype, ioput)
                    VALUES (${uid}, '${datetime}', 1, '${total_fee[0]/100}', 2, 0, 3), 
                           (${uid}, '${datetime}', 0, '${total_fee[0]/100}', 2, 0, 1);
                `);
                redisClient.delObject(out_trade_no[0]);
            } else if(order.type == 'chicken_adopt_delay') {
                const {uid, adopt_days, chickenId} = order;
                query(`
                    UPDATE db_chickenfarm.cf_chicken
                    SET adopt_days = adopt_days + ${adopt_days}
                    WHERE cid = ${chickenId};
                `);
                query(`
                    INSERT INTO db_chickenfarm.cf_wealth (uid, recorddatetime, recordtype, iomoney, iostate, paymenttype, ioput)
                    VALUES (${uid}, '${datetime}', 1, '${total_fee[0]/100}', 2, 0, 3), 
                           (${uid}, '${datetime}', 0, '${total_fee[0]/100}', 2, 0, 1);
                `);
                redisClient.delObject(out_trade_no[0]);
            } else if(order.type == 'chicken_buy') {
                const {uid, price, chickenId, farmId, addressId, logistics} = order;
                await query(`
                    INSERT INTO db_chickenfarm.cf_order (wxoid, uid, ordertime, paytime, finishtime, cfid, pid, raid, logcom, total_fee)
                    VALUES ('${out_trade_no[0]}', ${uid}, '${datetime}', '${datetime}', '${datetime}', ${farmId}, 2, ${addressId}, '${logistics}', ${total_fee[0]})
                `);
                const result = await query(`
                    SELECT oid FROM db_chickenfarm.cf_order
                    WHERE wxoid = '${out_trade_no[0]}'
                `);
                query(`
                    UPDATE db_chickenfarm.cf_chicken
                    SET coid = ${result[0].oid}, state = 3
                    WHERE cid = ${chickenId};
                `);
                query(`
                    INSERT INTO db_chickenfarm.cf_wealth (uid, recorddatetime, recordtype, iomoney, iostate, paymenttype, ioput)
                    VALUES (${uid}, '${datetime}', 1, '${total_fee[0]/100}', 2, 0, 3), 
                           (${uid}, '${datetime}', 0, '${total_fee[0]/100}', 2, 0, 5);
                `);
                redisClient.delObject(out_trade_no[0]);
            }
        }

        cxt.body = `<xml>
            <return_code><![CDATA[SUCCESS]]></return_code>
            <return_msg><![CDATA[OK]]></return_msg>
        </xml>`;
    })
    //获取签名
    .post('/signature', cxt => {
        if(cxt.request.body.signType == 'MD5') {
            cxt.request.body.signature = MD5(`${objToQuerystring(cxt.request.body)}&key=${PAID_KEY}`).toUpperCase();
        } else {
            cxt.request.body.signature = sha1(objToQuerystring(cxt.request.body));
        }
        cxt.body = cxt.request.body;
    })
    //视频是否存在
    .get('/video/:name/exist', cxt => {
        cxt.body = {
            status: fs.existsSync(`./video/${cxt.params.name}.mp4`)
        }
    });

app
    .use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            // will only respond with JSON
            console.log(err);
            ctx.status = err.statusCode || err.status || 500;
            ctx.body = {
                message: err.message
            };
        }
    })
    .use(xmlParser({
        encoding: 'utf8'
    }))
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods());


client.on('ready', function(err) {
    http.createServer(function(req, res) {
        if(/video\/\w{11}$/.test(req.url)) {
            const path = '.' + req.url + '.mp4';
            if(fs.existsSync(path)) {
                const stat = fs.statSync(path);
                const fileSize = stat.size;
                const range = req.headers.range;
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = (end - start) + 1;
                    const file = fs.createReadStream(path, {
                        start,
                        end
                    });
                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': 'video/mp4',
                    }
                    res.writeHead(206, head);
                    file.pipe(res);
                } else {
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'video/mp4',
                    }
                    res.writeHead(200, head);
                    fs.createReadStream(path).pipe(res);
                }
            } else {
                res.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
                res.end('资源不存在！');
            }
        } else {
            app.callback()(req, res);
        }
    }).listen(8083);
});
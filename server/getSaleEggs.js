const { query } = require('./util.js');

const EggsInOrder = (function() {
    const eggs = [new Set(), new Set()];

    setInterval(() => {
        eggs[1] = eggs[0];
        eggs[0] = new Set();
    }, 5 * 60 * 1000);

    return {
        put: eid => {
            eggs[0].add(eid);
        },
        has: eid => eggs[0].has(eid) || eggs[1].has(eid)
    }
})();

module.exports = function(farmId, uid, referrer_uid) {
    return new Promise(async (resolve, reject) => {

        const SALE_NUM = 30;
        const eggsForSale = new Set();

        const eggSearchRst = await query(`
            SELECT a.eid, a.cid, a.createtime, b.cuid, b.ncid, b.adopt_uid, b.eggprice AS eggsell, d.mobile
            FROM db_chickenfarm.cf_egg a
            INNER JOIN db_chickenfarm.cf_chicken b
            ON a.cid = b.cid
            INNER JOIN db_chickenfarm.cf_chicken_unit c
            ON b.cuid = c.cuid
            LEFT JOIN db_chickenfarm.cf_user d
            ON b.adopt_uid = d.uid
            WHERE a.state = 0
            AND cfid = ${farmId}
        `);
        if(eggSearchRst.length < 30) {
            resolve({
                status: 1,
                eggsForSale
            });
        }

        //获取该鸡场的认养鸡
        const adoptedRst = await query(`
            SELECT a.cuid, a.cid
            FROM db_chickenfarm.cf_chicken a
            INNER JOIN db_chickenfarm.cf_chicken_unit b
            ON a.cuid = b.cuid
            WHERE b.cfid = ${farmId}
            AND a.adopt_uid = ${uid}
        `);
        if(adoptedRst.length) {
            for(let i = 0, len = eggSearchRst.length; i < len; i++) {
                const isExited = adoptedRst.some(({cid}) =>  eggSearchRst[i].cid == cid);
                if(isExited && !EggsInOrder.has(eggSearchRst[i].eid)) {
                    eggsForSale.add(eggSearchRst[i]);
                }
                if(eggsForSale.size >= SALE_NUM) {
                    break;
                }
            }
        }
        if(eggsForSale.size >= SALE_NUM) {
            eggsForSale.forEach(({eid}) => {
                EggsInOrder.put(eid);
            });
            resolve({
                status: 0,
                eggsForSale
            });
        }

        //获取该鸡场的关注鸡
        const focusedRst = await query(`
            SELECT a.cuid, a.cid
            FROM db_chickenfarm.cf_chicken a
            INNER JOIN db_chickenfarm.cf_chicken_unit b
            ON a.cuid = b.cuid
            INNER JOIN db_chickenfarm.cf_focus c
            ON c.fcid = a.cid
            WHERE b.cfid = ${farmId}
            AND c.fuid = ${uid}
        `);
        if(focusedRst.length) {
            for(let i = 0, len = eggSearchRst.length; i < len; i++) {
                const isExited = focusedRst.some(({cid}) =>  eggSearchRst[i].cid == cid);
                if(isExited && !EggsInOrder.has(eggSearchRst[i].eid)) {
                    eggsForSale.add(eggSearchRst[i]);
                }
                if(eggsForSale.size >= SALE_NUM) {
                    break;
                }
            }
        }
        if(eggsForSale.size >= SALE_NUM) {
            eggsForSale.forEach(({eid}) => {
                EggsInOrder.put(eid);
            });
            resolve({
                status: 0,
                eggsForSale
            });
        }

        //获取关注人的认养鸡
        let referrerAdoptedRst = [];
        if(referrer_uid) {
            referrerAdoptedRst = await query(`
                SELECT a.cuid, a.cid
                FROM db_chickenfarm.cf_chicken a
                INNER JOIN db_chickenfarm.cf_chicken_unit b
                ON a.cuid = b.cuid
                WHERE b.cfid = ${farmId}
                AND a.adopt_uid = ${uid}
            `);   
        }
        if(referrerAdoptedRst.length) {
            for(let i = 0, len = eggSearchRst.length; i < len; i++) {
                const isExited = referrerAdoptedRst.some(({cid}) =>  eggSearchRst[i].cid == cid);
                if(isExited && !EggsInOrder.has(eggSearchRst[i].eid)) {
                    eggsForSale.add(eggSearchRst[i]);
                }
                if(eggsForSale.size >= SALE_NUM) {
                    break;
                }
            }
        }
        if(eggsForSale.size >= SALE_NUM) {
            eggsForSale.forEach(({eid}) => {
                EggsInOrder.put(eid);
            });
            resolve({
                status: 0,
                eggsForSale
            });
        }

        //从认养鸡单元获取
        for(let i = 0, len = adoptedRst.length; i < len; i++) {
            for(let j = 0, len = eggSearchRst.length; j < len; j++) {
                if(adoptedRst[i].cuid ==  eggSearchRst[j].cuid && !EggsInOrder.has(eggSearchRst[j].eid)) {
                    eggsForSale.add(eggSearchRst[j]);
                }
                if(eggsForSale.size >= SALE_NUM) {
                    break;
                }
            }
            if(eggsForSale.size >= SALE_NUM) {
                break;
            }
        }
        if(eggsForSale.size >= SALE_NUM) {
            eggsForSale.forEach(({eid}) => {
                EggsInOrder.put(eid);
            });
            resolve({
                status: 0,
                eggsForSale
            });
        }

        //从关注鸡单元获取
        for(let i = 0, len = focusedRst.length; i < len; i++) {
            for(let j = 0, len = eggSearchRst.length; j < len; j++) {
                if(focusedRst[i].cuid ==  eggSearchRst[j].cuid && !EggsInOrder.has(eggSearchRst[j].eid)) {
                    eggsForSale.add(eggSearchRst[j]);
                }
                if(eggsForSale.size >= SALE_NUM) {
                    break;
                }
            }
            if(eggsForSale.size >= SALE_NUM) {
                break;
            }
        }
        if(eggsForSale.size >= SALE_NUM) {
            eggsForSale.forEach(({eid}) => {
                EggsInOrder.put(eid);
            });
            resolve({
                status: 0,
                eggsForSale
            });
        }

        //从其他单元获取
        const cuids = new Set(eggSearchRst.map(({cuid}) => cuid));
        for(let cuid of cuids ) {
            for(let j = 0, len = eggSearchRst.length; j < len; j++) {
                if(cuid == eggSearchRst[j].cuid && !EggsInOrder.has(eggSearchRst[j].eid)) {
                    eggsForSale.add(eggSearchRst[j]);
                }
                if(eggsForSale.size >= SALE_NUM) {
                    break;
                }
            }
            if(eggsForSale.size >= SALE_NUM) {
                break;
            }
        }
        if(eggsForSale.size >= SALE_NUM) {
            eggsForSale.forEach(({eid}) => {
                EggsInOrder.put(eid);
            });
            resolve({
                status: 0,
                eggsForSale
            });
        }

        reject();
    });
}
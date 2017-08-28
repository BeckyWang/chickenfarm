/************** 获取地址栏参数 *******************/
export function getQueryString(name) {
	const reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	const r = window.location.search.substr(1).match(reg);
	if(r!=null) {
		return unescape(r[2]);
	}
	return null;
};

export function objToQueryString(object) {
	if (!object) {
		return '';
	}
	return '?' +
		Object.keys(object).map((key) =>
			encodeURIComponent(key) + '=' + encodeURIComponent(object[key])
		).join('&');
}

export function randomchar(number) {
    const chars = '0123456789ABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('');
    const len = chars.length;
    let result = '';
    for(let i = 0; i < number; i++) {
        result += chars[Math.floor(Math.random() * len)];
    }
    return result;
}

export function renderMobile(number) {
    return `${number.slice(0, 3)}****${number.slice(-4)}`;
}
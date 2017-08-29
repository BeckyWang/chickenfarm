import React from 'react';

import { randomchar } from '../../unit/tool';
import { getWXSignature } from '../../unit/fetch';

class Pay extends React.Component {
    constructor() {
        super();
        this.state = {
            status: '',
            prepay_id: '',
            signature: ''
        }
        this.toPay = this.toPay.bind(this);
    }

    componentWillMount() {
        (async () => {
            try {
                const timestamp = +(new Date()).valueOf().toString().slice(0, 10);
                const nonceStr = randomchar(32);
                const {signature} = await getWXSignature({
                    timestamp, // 必填，生成签名的时间戳
                    noncestr: nonceStr, // 必填，生成签名的随机串
                    url: window.location.href,
                    jsapi_ticket: this.props.jsapiTicket
                });
                this.setState({ signature });
                wx.config({
                    debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: 'wx20cc91f559b59b67', // 必填，公众号的唯一标识
                    timestamp, // 必填，生成签名的时间戳
                    nonceStr, // 必填，生成签名的随机串
                    signature,// 必填，签名，见附录1
                    jsApiList: ['chooseWXPay'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                });
            } catch(e) {

            }
        })();
    }

    toPay() {
        
        const xhr2 = new XMLHttpRequest();
        const url2 = 'http://www.chickenfarm.com.cn/weixin/api/v1/paytest';
        xhr2.open('POST', url2);
        xhr2.setRequestHeader('ACCESSTOKEN', this.props.accessToken);
        xhr2.setRequestHeader('OPENID', this.props.openId);
        xhr2.setRequestHeader('IP', window.returnCitySN.cip);
        xhr2.onreadystatechange = () => {
            if(xhr2.readyState === 4) {
                if(xhr2.status === 200) {
                    const { prepay_id } = JSON.parse(xhr2.responseText);
                    this.setState({
                        prepay_id,
                    });
                    (async() => {
                        const timestamp = +(new Date()).valueOf().toString().slice(0, 10);
                        const nonceStr = randomchar(32);

                        const { signature: paySign } = await getWXSignature({
                            appId: 'wx20cc91f559b59b67',
                            timeStamp: timestamp,
                            nonceStr,
                            package: `prepay_id=${prepay_id}`,
                            signType: 'MD5',
                        });

                        this.setState({
                            paySign
                        });

                        wx.chooseWXPay({
                            appId: 'wx20cc91f559b59b67',
                            timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                            nonceStr, // 支付签名随机串，不长于 32 位
                            package: `prepay_id=${prepay_id}`, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                            signType: 'MD5', // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                            paySign, // 支付签名
                            success: function(res) {
                                console.log(JSON.stringify(res))
                            }
                        });

                    })();

                }
                this.setState({
                    status: xhr2.status + '=>' + xhr2.responseText
                })
            }
        };
        xhr2.send();

    }

    render() {
        return (
            <div>
                <br/>
                <button onClick={this.toPay}>支付</button>
                <br/>
                <br/>
                {window.returnCitySN.cip}
                <br/>
                <br/>
                {this.props.accessToken}
                <br/>
                <br/>
                {this.props.openId}
                <br/>
                <br/>
                {this.props.jsapiTicket}
                <br/>
                <br/>
                {this.state.signature}
                <br/>
                <br/>
                {this.state.prepay_id}
                <br/>
                <br/>
                {this.state.paySign}
                <br/>
                <br/>
                {this.state.status}
            </div>
        );
    }
}

export default Pay;
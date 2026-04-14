const crypto = require('crypto');

function createPaymentUrl({
    tmnCode,
    hashSecret,
    vnpUrl,
    returnUrl,
    orderId,
    amount,
    bankCode = '',
    orderInfo,
    orderType = 'other',
    locale = 'vn',
    ipAddr
}) {
    let date = new Date();
    let createDate = formatDate(date);

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if (bankCode !== null && bankCode !== '') {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Sắp xếp params theo alphabet
    let sortedParams = sortObject(vnp_Params);

    // Chuỗi dữ liệu để băm
    let signData = "";
    Object.keys(sortedParams).forEach((key, index) => {
        if (index > 0) signData += "&";
        signData += key + "=" + encodeURIComponent(sortedParams[key]).replace(/%20/g, "+");
    });

    // Tạo chữ ký
    let hmac = crypto.createHmac("sha512", hashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    // Chuỗi query params cuối cùng
    let finalQuery = "";
    Object.keys(sortedParams).forEach((key, index) => {
        if (index > 0) finalQuery += "&";
        finalQuery += key + "=" + encodeURIComponent(sortedParams[key]).replace(/%20/g, "+");
    });
    finalQuery += "&vnp_SecureHash=" + signed;

    return vnpUrl + '?' + finalQuery;
}

function verifyReturnUrl(query, hashSecret) {
    let vnp_SecureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    let sortedParams = sortObject(query);
    let signData = "";
    Object.keys(sortedParams).forEach((key, index) => {
        if (index > 0) signData += "&";
        signData += key + "=" + encodeURIComponent(sortedParams[key]).replace(/%20/g, "+");
    });

    let hmac = crypto.createHmac("sha512", hashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    return vnp_SecureHash === signed;
}

function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${y}${m}${d}${h}${min}${s}`;
}

module.exports = {
    createPaymentUrl,
    verifyReturnUrl
};

import moment from "moment";
require("dotenv").config();
import orderService from "../services/orderService";

function sortObject(obj) {
  let sorted = {};
  let keys = [];

  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(encodeURIComponent(key));
    }
  }

  keys.sort();

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    sorted[key] = encodeURIComponent(obj[decodeURIComponent(key)]).replace(
      /%20/g,
      "+"
    );
  }

  return sorted;
}

const createPayment = async (req, res) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";

  let date = new Date();
  let createDate = moment(date).format("YYYYMMDDHHmmss");

  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress;

  let tmnCode = process.env.VNP_TMNCODE;
  let secretKey = process.env.VNP_HASH_SECRET;
  let vnpUrl = process.env.VNP_URL;
  let returnUrl = process.env.VNP_RETURN_URL;

  let orderId = req.body.orderId || moment(date).format("DDHHmmss");
  let amount = req.body.amount;

  let bankCode = "";
  let locale = "vn";

  let currCode = "VND";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;

  if (bankCode) {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);
  const querystring = require("qs");
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
  return res.json({ paymentUrl: vnpUrl });
};

const vnpayReturn = async (req, res) => {
  let vnp_Params = req.query;

  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);
  const querystring = require("qs");
  const crypto = require("crypto");

  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const orderInfo = vnp_Params["vnp_OrderInfo"]; // "Thanh toan cho ma GD:123456"
    const orderCode = orderInfo?.split(":")[1]; // Lấy mã đơn hàng từ orderInfo

    if (!orderCode) {
      return res.redirect(
        `${process.env.CLIENT_URL}/thanh-toan-that-bai?error=missing-order-code`
      );
    }

    if (responseCode === "00") {
      await orderService.updatePaymentSuccess(orderCode);
      return res.redirect(`${process.env.CLIENT_URL}/thanh-toan-thanh-cong`);
    } else {
      await orderService.updatePaymentFailed(orderCode);
      return res.redirect(`${process.env.CLIENT_URL}/thanh-toan-that-bai`);
    }
  } else {
    return res.redirect(
      `${process.env.CLIENT_URL}/thanh-toan-that-bai?error=invalid-signature`
    );
  }
};

export default {
  createPayment,
  vnpayReturn,
};

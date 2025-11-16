// _base.js - 云函数通用初始化
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

module.exports = {
  cloud,
  db
};

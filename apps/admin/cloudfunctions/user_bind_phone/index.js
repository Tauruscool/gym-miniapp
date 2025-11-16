// /apps/admin/cloudfunctions/user_bind_phone/index.js

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();



exports.main = async (event) => {

  const { phone } = event;

  if (!phone) throw new Error('缺少手机号');

  const { OPENID } = cloud.getWXContext();



  // 找到当前登录用户

  const uRes = await db.collection('users').where({ openid: OPENID }).get();

  if (!uRes.data.length) throw new Error('请先登录再绑定手机号');



  // 检查是否已被其他账号绑定（简单唯一性保护）

  const _ = db.command;

  const dup = await db.collection('users')

    .where({ phone, openid: _.neq(OPENID) })

    .get();

  if (dup.data.length) throw new Error('该手机号已被其他账号绑定');



  await db.collection('users')

    .where({ openid: OPENID })

    .update({ data: { phone, updatedAt: new Date() } });



  return { ok: true, phone };

};


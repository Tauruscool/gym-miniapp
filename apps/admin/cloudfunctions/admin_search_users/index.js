// 模糊搜索学员（手机号 / 昵称），返回 userId/nickname/phone

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const _ = db.command;

exports.main = async (event = {}) => {
  const { q = "", page = 0, pageSize = 20, tenantId = 't_default' } = event;

  const limit = Math.min(pageSize, 50);

  const conds = [{ tenantId }];

  if (q) {
    const re = db.RegExp({ regexp: q, options: 'i' });
    // 手机或昵称命中其一即可
    conds.push(_.or([{ phone: re }, { nickname: re }]));
  }

  const res = await db.collection('users')
    .where(_.and(conds))
    .field({
      userId: true,
      nickname: true,
      phone: true,
      _id: true
    })
    .orderBy('nickname', 'asc')
    .skip(page * limit)
    .limit(limit)
    .get();

  const list = res.data.map((u, idx) => ({
    idx,
    userId: u.userId || u._id, // 老数据无 userId 时用 _id 兜底
    nickname: u.nickname || '未命名',
    phone: u.phone || ''
  }));

  return { list, hasMore: list.length === limit, page, pageSize: limit };
};


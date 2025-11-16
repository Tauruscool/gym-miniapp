const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const {
    q = '',
    createdFrom,
    createdTo,
    page = 1,
    pageSize = 20
  } = event || {}

  // 1. 确定 userId / tenantId
  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ userId: true, tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    return { list: [], total: 0, reason: 'no_user' }
  }

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId

  // 2. 时间 & 关键字过滤
  let createdCond = null
  if (createdFrom) createdCond = _.gte(createdFrom)
  if (createdTo) {
    const toCond = _.lte(createdTo)
    createdCond = createdCond ? _.and(createdCond, toCond) : toCond
  }

  const reg = q
    ? db.RegExp({ regexp: q, options: 'i' })
    : null

  const base = {
    userId: uid,
    ...(tenantId ? { tenantId } : {}),
    ...(createdCond ? { createdAt: createdCond } : {})
  }

  const where = reg
    ? _.and([base, { comment: reg }])
    : base

  // 3. total + 分页数据
  const coll = db.collection('training_reports')
  const totalRes = await coll.where(where).count()
  const total = totalRes.total || 0

  const listRes = await coll.where(where)
    .orderBy('createdAt', 'desc')
    .limit(pageSize)
    .skip((page - 1) * pageSize)
    .field({
      _id: true,
      userId: true,
      coachId: true,
      sessionId: true,
      RPE: true,
      comment: true,
      createdAt: true
    })
    .get()

  return {
    list: listRes.data || [],
    total
  }
}

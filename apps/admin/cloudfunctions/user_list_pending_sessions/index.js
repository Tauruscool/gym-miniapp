const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event) => {
  const { includeConfirmed = false, q = '', startFrom, startTo } = event || {}

  const { OPENID } = cloud.getWXContext()

  // 1. 找到当前用户
  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ userId: true, tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    return { list: [], reason: 'no_user' }
  }

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId

  // 2. 状态 + 时间过滤
  const statusFilter = includeConfirmed
    ? _.in(['pending', 'confirmed'])
    : 'pending'

  let startCond = null
  if (startFrom) startCond = _.gte(startFrom)
  if (startTo) {
    const toCond = _.lte(startTo)
    startCond = startCond ? _.and(startCond, toCond) : toCond
  }

  const reg = q
    ? db.RegExp({ regexp: q, options: 'i' })
    : null

  const base = {
    userId: uid,
    status: statusFilter,
    ...(tenantId ? { tenantId } : {}),
    ...(startCond ? { startAt: startCond } : {})
  }

  const where = reg
    ? _.and([base, { title: reg }])
    : base

  // 3. 查课
  const ret = await db.collection('sessions')
    .where(where)
    .orderBy('startAt', 'asc')
    .field({
      _id: true,
      title: true,
      startAt: true,
      endAt: true,
      status: true
    })
    .limit(100)
    .get()

  return { list: ret.data || [] }
}

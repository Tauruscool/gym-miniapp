const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const { q = '', status, startFrom, startTo } = event || {}

  // 1. 找到当前管理员所在租户
  const aRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ tenantId: true })
    .limit(1)
    .get()

  const tenantId = aRes.data?.[0]?.tenantId || 'default'

  // 2. 时间范围条件
  let startCond = null
  if (startFrom) startCond = _.gte(startFrom)
  if (startTo) {
    const toCond = _.lte(startTo)
    startCond = startCond ? _.and(startCond, toCond) : toCond
  }

  // 3. 关键字：匹配 title；同时模糊搜学员（手机号/昵称）
  const reg = q ? db.RegExp({ regexp: q, options: 'i' }) : null
  let userIdsByKeyword = []
  if (q) {
    const u = await db.collection('users')
      .where(_.and([
        { tenantId },
        _.or([{ phone: reg }, { nickname: reg }])
      ]))
      .field({ userId: true, _id: true })
      .limit(50)
      .get()
    userIdsByKeyword = (u.data || []).map(x => x.userId || x._id)
  }

  const base = {
    tenantId,
    ...(status ? { status } : {}),
    ...(startCond ? { startAt: startCond } : {})
  }

  const where = q
    ? _.and([
        base,
        _.or([
          { title: reg },
          { userId: _.in(userIdsByKeyword) }
        ])
      ])
    : base

  // 4. 查 sessions
  const sessRes = await db.collection('sessions')
    .where(where)
    .orderBy('startAt', 'asc')
    .field({
      _id: true,
      userId: true,
      userPhone: true,   // ★ 加上这个
      title: true,
      startAt: true,
      endAt: true,
      status: true,
      coachId: true
    })
    .limit(100)
    .get()

  let sessions = sessRes.data || []

  // 如果课程里本身已经有 userPhone，直接返回即可
  const missingPhone = sessions.filter(s => !s.userPhone && s.userId)
  if (missingPhone.length) {
    // 兜底：为旧数据补一次手机号
    const userIds = [...new Set(missingPhone.map(s => s.userId))]
    const usersRes = await db.collection('users')
      .where({ userId: _.in(userIds) })
      .field({ userId: true, phone: true })
      .get()
    const phoneMap = {}
    ;(usersRes.data || []).forEach(u => {
      phoneMap[u.userId] = u.phone || ''
    })
    sessions = sessions.map(s => ({
      ...s,
      userPhone: s.userPhone || phoneMap[s.userId] || ''
    }))
  }

  return { list: sessions }
}

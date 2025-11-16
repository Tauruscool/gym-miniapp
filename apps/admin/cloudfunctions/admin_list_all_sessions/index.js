const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()

  const {
    date,         // 'YYYY-MM-DD'
    status = 'all',
    tenantId
  } = event || {}

  if (!date) {
    throw new Error('admin_list_all_sessions: 缺少 date')
  }

  // 1. 获取当前管理员的 tenantId（如果未传入）
  let finalTenantId = tenantId
  if (!finalTenantId) {
    const aRes = await db.collection('users')
      .where({ openid: OPENID })
      .field({ tenantId: true })
      .limit(1)
      .get()
    finalTenantId = aRes.data?.[0]?.tenantId || 'default'
  }

  const start = new Date(`${date}T00:00:00`)
  const end = new Date(`${date}T23:59:59`)
  const startIso = start.toISOString()
  const endIso = end.toISOString()

  const where = {
    startAt: _.and(_.gte(startIso), _.lte(endIso)),
    ...(finalTenantId ? { tenantId: finalTenantId } : {})
  }

  if (status && status !== 'all') {
    where.status = status
  }

  // 2. 先查当天所有课程
  const sessRes = await db.collection('sessions')
    .where(where)
    .orderBy('startAt', 'asc')
    .limit(500)
    .field({
      _id: true,
      title: true,
      startAt: true,
      endAt: true,
      status: true,
      userId: true,
      tenantId: true
    })
    .get()

  const sessions = sessRes.data || []

  if (!sessions.length) {
    return { list: [] }
  }

  // 3. 补学员昵称、手机号
  const userIds = Array.from(new Set(
    sessions.map(s => s.userId).filter(Boolean)
  ))

  let usersMap = {}

  if (userIds.length) {
    // 兼容 userId 和 _id 字段
    const uRes = await db.collection('users')
      .where(_.or([
        { userId: _.in(userIds) },
        { _id: _.in(userIds) }
      ]))
      .field({ userId: true, _id: true, nickname: true, phone: true })
      .get()

    usersMap = (uRes.data || []).reduce((acc, u) => {
      const key = u.userId || u._id
      acc[key] = u
      return acc
    }, {})
  }

  const list = sessions.map(s => {
    const u = usersMap[s.userId] || {}
    return {
      ...s,
      userName: u.nickname || '未命名',
      userPhone: u.phone || ''
    }
  })

  return { list }
}


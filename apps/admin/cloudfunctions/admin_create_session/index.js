const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event, context) => {

  const { OPENID } = cloud.getWXContext()

  const { userId, coachId, startAt, endAt, title } = event || {}

  if (!userId) throw new Error('admin_create_session: 缺少 userId')

  if (!startAt || !endAt) throw new Error('admin_create_session: 缺少时间')

  // 1) 时间统一为 ISO

  const toISO = (t) => {

    const d = new Date(t)          // 兼容字符串/ISO

    if (isNaN(+d)) throw new Error('admin_create_session: 非法时间')

    return d.toISOString()

  }

  const sISO = toISO(startAt)

  const eISO = toISO(endAt)

  // 2. 查学员信息，拿 tenantId + phone

  const uRes = await db.collection('users')

    .where(_.or([{ userId }, { _id: userId }]))

    .field({ tenantId: true, phone: true, userId: true })

    .limit(1)

    .get()

  if (!uRes.data.length) {

    throw new Error('admin_create_session: 未找到该学员')

  }

  const user = uRes.data[0]

  let tenantId = user.tenantId

  const userPhone = user.phone || ''

  // 3. 如 tenantId 仍为空，用当前管理员的 tenantId 兜底

  if (!tenantId) {

    const aRes = await db.collection('users')

      .where({ openid: OPENID })

      .field({ tenantId: true })

      .limit(1)

      .get()

    tenantId = aRes.data?.[0]?.tenantId || 'default'

  }

  // 4. 写入 sessions，附带 userPhone

  const doc = {

    userId,

    userPhone,                        // ★ 学员手机号直接冗余在课程里

    coachId: coachId || null,

    startAt: sISO,

    endAt: eISO,

    title: title || '未命名课程',

    status: 'pending',

    tenantId,

    createdAt: db.serverDate()

  }

  const { _id } = await db.collection('sessions').add({ data: doc })

  return { sessionId: _id }

}

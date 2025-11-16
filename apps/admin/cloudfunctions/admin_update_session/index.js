const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { sessionId, startAt, endAt } = event || {}

  if (!sessionId) throw new Error('admin_update_session: 缺少 sessionId')

  if (!startAt || !endAt) throw new Error('admin_update_session: 缺少时间')

  const toISO = (t) => {
    const d = new Date(t)
    if (isNaN(+d)) throw new Error('admin_update_session: 非法时间')
    return d.toISOString()
  }

  const sISO = toISO(startAt)
  const eISO = toISO(endAt)

  await db.collection('sessions').doc(sessionId).update({
    data: { startAt: sISO, endAt: eISO }
  })

  return { ok: true }
}


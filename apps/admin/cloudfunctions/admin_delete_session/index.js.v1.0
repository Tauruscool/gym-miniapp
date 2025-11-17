const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { sessionId } = event || {}

  if (!sessionId) throw new Error('admin_delete_session: 缺少 sessionId')

  // 简单版本：直接删除。你要"软删"可以改成 status: 'canceled'
  await db.collection('sessions').doc(sessionId).remove()

  return { ok: true }
}


const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const DEFAULT_TENANT_ID = 't_default'

async function getAdminTenantId() {
  const { OPENID } = cloud.getWXContext()

  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    throw new Error('admin_update_session: 未找到管理员用户')
  }

  const doc = uRes.data[0]
  return doc.tenantId || DEFAULT_TENANT_ID
}

exports.main = async (event) => {
  const { id, title, startAt, endAt, status } = event || {}

  if (!id) {
    throw new Error('admin_update_session: 缺少 id')
  }

  const tenantId = await getAdminTenantId()

  const coll = db.collection('sessions')

  // 先查一遍，确保 tenantId 一致
  const sRes = await coll
    .where({ _id: id, tenantId })
    .limit(1)
    .get()

  if (!sRes.data.length) {
    throw new Error('admin_update_session: 课程不存在或无权限')
  }

  const data = {}
  if (typeof title === 'string') data.title = title
  if (typeof status === 'string') data.status = status
  if (startAt) data.startAt = startAt
  if (endAt) data.endAt = endAt

  if (!Object.keys(data).length) {
    return { ok: true, reason: 'no_change' }
  }

  data.updatedAt = new Date().toISOString()

  await coll.doc(id).update({ data })

  return { ok: true }
}

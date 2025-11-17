const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const DEFAULT_TENANT_ID = 't_default'

async function getAdminContext() {
  const { OPENID } = cloud.getWXContext()

  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ userId: true, tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    throw new Error('report_and_deduct: 未找到管理员用户')
  }

  const doc = uRes.data[0]
  const coachId = doc.userId || doc._id
  const tenantId = doc.tenantId || DEFAULT_TENANT_ID

  return { coachId, tenantId }
}

exports.main = async (event) => {
  const { sessionId, userId, items, RPE, comment, amount } = event || {}

  if (!sessionId) throw new Error('report_and_deduct: 缺少 sessionId')
  if (!userId) throw new Error('report_and_deduct: 缺少 userId')
  if (!Array.isArray(items) || !items.length) {
    throw new Error('report_and_deduct: 缺少动作明细')
  }

  const { coachId, tenantId } = await getAdminContext()

  const sessionsColl = db.collection('sessions')
  const reportsColl = db.collection('training_reports')
  const walletsColl = db.collection('wallets')
  const txnsColl = db.collection('wallet_txns')

  // 1. 课程校验：必须同 tenant，且属于该学员
  const sRes = await sessionsColl
    .where({ _id: sessionId, userId, tenantId })
    .limit(1)
    .get()

  if (!sRes.data.length) {
    throw new Error('report_and_deduct: 课程不存在或无权限')
  }

  const now = new Date().toISOString()
  const safeAmount = Number(amount) || 0

  // 2. 钱包 & 扣费
  const wRes = await walletsColl
    .where({ userId, tenantId })
    .limit(1)
    .get()

  let wallet = wRes.data[0]
  let newBalance

  if (!wallet) {
    wallet = {
      userId,
      tenantId,
      balance: 0,
      createdAt: now
    }
    if (safeAmount !== 0) {
      wallet.balance = wallet.balance - safeAmount
    }
    const addRes = await walletsColl.add({
      data: { ...wallet, updatedAt: now }
    })
    wallet._id = addRes._id
    newBalance = wallet.balance
  } else {
    const old = Number(wallet.balance) || 0
    newBalance = safeAmount !== 0 ? old - safeAmount : old
    await walletsColl.doc(wallet._id).update({
      data: { balance: newBalance, updatedAt: now }
    })
  }

  if (safeAmount !== 0) {
    await txnsColl.add({
      data: {
        userId,
        tenantId,
        amount: -Math.abs(safeAmount),
        type: 'deduct',
        sessionId,
        createdAt: now
      }
    })
  }

  // 3. 写训练报告（扁平结构，和 user 端读取保持一致）
  const reportDoc = {
    sessionId,
    userId,
    coachId,
    tenantId,
    items,
    RPE: typeof RPE === 'number' ? RPE : (RPE != null ? Number(RPE) : null),
    comment: comment || '',
    createdAt: now
  }

  const rRes = await reportsColl.add({ data: reportDoc })

  // 4. 课程状态置 done
  await sessionsColl.doc(sessionId).update({
    data: {
      status: 'done',
      updatedAt: now
    }
  })

  return {
    ok: true,
    reportId: rRes._id,
    balance: newBalance,
    sessionStatus: 'done'
  }
}

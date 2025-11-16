const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const {
    userId,
    nickname,
    gender,
    heightCm,
    weightKg,
    bodyFat,
    phone,
    timesBalance,
    balanceAmount
  } = event || {}

  if (!userId) throw new Error('admin_update_user_detail: 缺少 userId')

  const usersColl = db.collection('users')
  const walletsColl = db.collection('wallets')

  // 找到 user 文档
  const uRes = await usersColl
    .where(_.or([{ userId }, { _id: userId }]))
    .limit(1)
    .get()

  if (!uRes.data.length) throw new Error('未找到该学员')

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId || null

  const toNum = (v) => {
    if (v === '' || v == null) return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }

  // 更新 users
  const userUpdate = {
    nickname: nickname != null ? nickname : userDoc.nickname || '',
    gender: gender != null ? gender : userDoc.gender || '',
    phone: phone != null ? phone : userDoc.phone || ''
  }

  const h = toNum(heightCm)
  const w = toNum(weightKg)
  const bf = toNum(bodyFat)
  const tb = toNum(timesBalance)

  if (h != null) userUpdate.heightCm = h
  if (w != null) userUpdate.weightKg = w
  if (bf != null) userUpdate.bodyFat = bf
  if (tb != null) userUpdate.timesBalance = tb

  await usersColl.doc(userDoc._id).update({ data: userUpdate })

  // 更新或创建钱包余额
  if (balanceAmount != null && balanceAmount !== '') {
    const bal = toNum(balanceAmount) || 0
    const wRes = await walletsColl.where({ userId: uid }).limit(1).get()
    if (wRes.data.length) {
      await walletsColl.doc(wRes.data[0]._id).update({
        data: { balance: bal }
      })
    } else {
      await walletsColl.add({
        data: {
          userId: uid,
          balance: bal,
          tenantId: tenantId || null
        }
      })
    }
  }

  return { ok: true }
}


const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { userId } = event || {}
  if (!userId) throw new Error('admin_get_user_detail: 缺少 userId')

  const usersColl = db.collection('users')
  const walletsColl = db.collection('wallets')

  const uRes = await usersColl
    .where(_.or([{ userId }, { _id: userId }]))
    .limit(1)
    .get()

  if (!uRes.data.length) {
    throw new Error('未找到该学员')
  }

  const user = uRes.data[0]
  const uid = user.userId || user._id

  const wRes = await walletsColl
    .where({ userId: uid })
    .limit(1)
    .get()

  const wallet = wRes.data[0] || { userId: uid, balance: 0 }

  return { user, wallet }
}


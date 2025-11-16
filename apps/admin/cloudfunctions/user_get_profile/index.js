const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()

  const usersColl = db.collection('users')
  const walletsColl = db.collection('wallets')

  const uRes = await usersColl
    .where({ openid: OPENID })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    return { user: null, wallet: null, reason: 'no_user' }
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


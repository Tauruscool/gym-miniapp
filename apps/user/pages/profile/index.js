Page({
  data: {
    info: {},
    wallet: {},
    genderText: ''
  },
  onShow() {
    this.loadProfile()
  },
  async loadProfile() {
    wx.showLoading({ title: '加载中' })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'user_get_profile'
      })
      const user = result.user || {}
      const wallet = result.wallet || {}
      const genderText =
        user.gender === 'male' ? '男' :
        user.gender === 'female' ? '女' : '未设置'
      this.setData({ info: user, wallet, genderText })
    } catch (e) {
      console.error('loadProfile error', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})


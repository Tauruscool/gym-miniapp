Page({
  data: {
    q: '',
    list: [],
    loading: false
  },
  onLoad() {
    // 默认拉一次，看看当前租户名下所有学员
    this.search()
  },
  onQ(e) {
    this.setData({ q: e.detail.value })
  },
  onSearch() {
    this.search()
  },
  async search() {
    this.setData({ loading: true })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_search_users',
        data: {
          q: this.data.q.trim(),
          page: 0,
          pageSize: 50
        }
      })
      const list = (result && result.list) || []
      this.setData({ list })
    } catch (err) {
      console.error('load users error', err)
      wx.showToast({ title: '加载学员失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  goDetail(e) {
    const userId = e.currentTarget.dataset.id
    if (!userId) return
    wx.navigateTo({
      url: `/pages/users/detail/index?userId=${userId}`
    })
  }
})


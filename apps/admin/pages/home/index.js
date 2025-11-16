Page({
  data: {},

  // 课程管理（去你现在的课程列表页）
  goSessions() {
    wx.navigateTo({
      url: '/pages/sessions/index'
    })
  },

  // 课程表（新建的"浏览全部课程"页面）
  goOverview() {
    wx.navigateTo({
      url: '/pages/sessions/overview/index'
    })
  },

  // 学员管理页（下面 B 部分要新建的页面）
  goUsers() {
    wx.navigateTo({
      url: '/pages/users/index'
    })
  }
})


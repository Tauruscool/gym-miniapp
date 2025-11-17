// apps/admin/pages/sessions/detail/index.js

Page({
  data: {
    id: '',
    title: '',
    status: '',
    start: '',
    end: '',
    phone: '',
    statusText: '',
    // 用于编辑的时间字段
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  },
  onLoad(options) {
    const status = options.status || ''
    const start = decodeURIComponent(options.start || '')
    const end = decodeURIComponent(options.end || '')
    const { date: sd, time: st } = this.parseISO(start)
    const { date: ed, time: et } = this.parseISO(end)
    this.setData({
      id: options.id || '',
      title: decodeURIComponent(options.title || ''),
      status,
      start,
      end,
      phone: options.phone || '',
      statusText: this.mapStatus(status),
      startDate: sd,
      startTime: st,
      endDate: ed,
      endTime: et
    })
  },
  mapStatus(s) {
    if (s === 'pending') return '待确认'
    if (s === 'confirmed') return '已确认'
    if (s === 'done') return '已完成'
    return '未知'
  },
  parseISO(iso) {
    if (!iso) return { date: '', time: '' }
    const d = new Date(iso)
    if (isNaN(+d)) return { date: '', time: '' }
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
    return { date, time }
  },
  // picker 事件
  onStartDate(e) { this.setData({ startDate: e.detail.value }) },
  onStartTime(e) { this.setData({ startTime: e.detail.value }) },
  onEndDate(e) { this.setData({ endDate: e.detail.value }) },
  onEndTime(e) { this.setData({ endTime: e.detail.value }) },
  // 保存时间修改
  async saveTime() {
    const { id, startDate, startTime, endDate, endTime } = this.data
    if (!id) return wx.showToast({ title: '缺少课程ID', icon: 'none' })
    if (!startDate || !startTime || !endDate || !endTime) {
      return wx.showToast({ title: '请先选完整时间', icon: 'none' })
    }
    const toLocal = (d, t) => `${d} ${t}:00`
    wx.showLoading({ title: '保存中' })
    try {
      await wx.cloud.callFunction({
        name: 'admin_update_session',
        data: {
          sessionId: id,
          startAt: toLocal(startDate, startTime),
          endAt: toLocal(endDate, endTime)
        }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      const { id, startDate, startTime, endDate, endTime } = this.data
      console.error('admin_update_session error', {
        data: { sessionId: id, startAt: `${startDate} ${startTime}`, endAt: `${endDate} ${endTime}` },
        err: e
      })
      wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  // 删除课程
  deleteSession() {
    const { id } = this.data
    if (!id) return
    wx.showModal({
      title: '确认删除',
      content: '删除后该课程将无法恢复，确定要删除吗？',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          await wx.cloud.callFunction({
            name: 'admin_delete_session',
            data: { sessionId: id }
          })
          wx.hideLoading()
          wx.showToast({ title: '已删除', icon: 'success' })
          // 返回上一页并让列表刷新
          setTimeout(() => {
            const pages = getCurrentPages()
            const prev = pages[pages.length - 2]
            if (prev && typeof prev.fetch === 'function') {
              prev.fetch()
            }
            wx.navigateBack()
          }, 500)
        } catch (e) {
          const { id } = this.data
          console.error('admin_delete_session error', {
            data: { sessionId: id },
            err: e
          })
          wx.hideLoading()
          wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
        }
      }
    })
  },
  // 保留原来的报告跳转
  goEditReport() {
    const { id, phone } = this.data
    wx.navigateTo({
      url: `/pages/report/report?sessionId=${id}&phone=${phone}`
    })
  },
  goViewReport() {
    const { id, phone } = this.data
    wx.navigateTo({
      url: `/pages/report/report?sessionId=${id}&phone=${phone}&mode=view`
    })
  }
})


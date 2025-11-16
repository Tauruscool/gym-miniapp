// apps/admin/pages/sessions/index.js

Page({
  data: {
    q: '',
    status: '',
    startDate: '',
    endDate: '',
    list: [],
    loading: false
  },
  onLoad() {
    this.fetch()
  },
  onKeyword(e) {
    this.setData({ q: e.detail.value })
  },
  setStatus(e) {
    const status = e.currentTarget.dataset.status || ''
    this.setData({ status }, () => this.fetch())
  },
  onStartDate(e) {
    this.setData({ startDate: e.detail.value })
  },
  onEndDate(e) {
    this.setData({ endDate: e.detail.value })
  },
  // 日期 -> ISO 字符串
  toIsoStart(d) {
    if (!d) return undefined
    return new Date(`${d} 00:00:00`.replace(/-/g, '/')).toISOString()
  },
  toIsoEnd(d) {
    if (!d) return undefined
    return new Date(`${d} 23:59:59`.replace(/-/g, '/')).toISOString()
  },
  async fetch() {
    this.setData({ loading: true })
    try {
      const { q, status, startDate, endDate } = this.data
      const { result } = await wx.cloud.callFunction({
        name: 'admin_list_sessions',
        data: {
          q: q || undefined,
          status: status || undefined,
          startFrom: this.toIsoStart(startDate),
          startTo: this.toIsoEnd(endDate)
        }
      })
      this.setData({ list: (result && result.list) || [] })
      console.log('admin sessions list:', this.data.list)
    } catch (e) {
      console.error('fetch sessions error', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  goCreate() {
    wx.navigateTo({ url: '/pages/schedule/schedule' })
  },
  goDetail(e) {
    const { id, title, status, start, end, phone } = e.currentTarget.dataset
    wx.navigateTo({
      url:
        '/pages/sessions/detail/index?' +
        `id=${id}&title=${encodeURIComponent(title || '')}` +
        `&status=${status}` +
        `&start=${encodeURIComponent(start || '')}` +
        `&end=${encodeURIComponent(end || '')}` +
        `&phone=${phone || ''}`
    })
  }
})

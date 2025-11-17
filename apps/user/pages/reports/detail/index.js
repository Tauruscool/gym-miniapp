Page({
  data: {
    report: null,
    session: null,
    sessionLabel: '',
    loading: false
  },
  onLoad(q) {
    this.id = q.id
    this.fetch()
  },
  makeSessionLabel(session) {
    if (!session) return ''
    const title = session.title || '未命名课程'
    const formatTime = (iso) => {
      if (!iso) return ''
      const d = new Date(iso)
      if (Number.isNaN(+d)) return ''
      const pad = (n) => (n < 10 ? '0' + n : '' + n)
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    const start = formatTime(session.startAt)
    const end = formatTime(session.endAt)
    if (start && end) {
      return `课程：${title} · ${start}-${end}`
    }
    return `课程：${title}`
  },
  async fetch() {
    if (!this.id) return
    this.setData({ loading: true })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'user_get_report',
        data: { reportId: this.id }
      })
      const report = result?.report || null
      const session = result?.session || null
      const sessionLabel = this.makeSessionLabel(session)
      this.setData({ report, session, sessionLabel })
    } catch (e) {
      console.error('user_get_report error', { id: this.id, err: e })
      wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})


const statusMap = {
  pending: '待确认',
  confirmed: '已确认',
  done: '已完成'
}

const fmtHM = iso => {
  if (!iso) return ''
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// 返回某个日期所在周的周一
const getMonday = (d) => {
  const day = d.getDay() || 7 // 周日=0，转成7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const formatDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 当天显示用的 MM-DD
const formatMonthDay = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

// 按时间配置生成 上午/下午/晚上 + 每小时 slot
function buildSegmentsForDay(sessions, timeConfig) {
  const { startHour, endHour, segments } = timeConfig
  const bucket = {} // key: hour -> [sessions]
  sessions.forEach(s => {
    const d = new Date(s.startAt)
    const hour = d.getHours()
    if (hour < startHour || hour >= endHour) return
    const key = String(hour)
    if (!bucket[key]) bucket[key] = []
    bucket[key].push(s)
  })
  const result = segments.map(seg => {
    const slots = []
    for (let h = seg.from; h < seg.to; h++) {
      const timeLabel = `${String(h).padStart(2, '0')}:00`
      const key = String(h)
      const list = (bucket[key] || []).map(it => ({
        ...it,
        startHM: fmtHM(it.startAt),
        endHM: fmtHM(it.endAt),
        statusText: statusMap[it.status] || it.status
      }))
      slots.push({
        time: timeLabel,
        hour: h,
        sessions: list
      })
    }
    return {
      key: seg.key,
      label: seg.label,
      slots
    }
  })
  return result
}

Page({
  data: {
    weekDays: [],
    selectedDate: '',
    weekStart: '',
    weekRangeLabel: '',   // 当前周范围：11-10 ~ 11-16
    statusTabs: [
      { value: 'all',      label: '全部' },
      { value: 'pending',  label: '待确认' },
      { value: 'confirmed',label: '已确认' },
      { value: 'done',     label: '已完成' }
    ],
    status: 'all',
    statusLabel: '全部',
    list: [],
    segments: [],
    loading: false,
    timeConfig: {
      startHour: 9,
      endHour: 21,
      segments: [
        { key: 'morning',   label: '上午',   from: 9,  to: 12 },
        { key: 'afternoon', label: '下午',   from: 12, to: 18 },
        { key: 'evening',   label: '晚上',   from: 18, to: 21 }
      ]
    }
  },
  onLoad() {
    const today = new Date()
    const monday = getMonday(today)
    this.buildWeek(monday, formatDate(today))
    this.refresh()
  },
  // 根据周一和选中日期，构造 weekDays + weekRangeLabel
  buildWeek(mondayDate, selected) {
    const todayStr = formatDate(new Date())
    const weekDays = []
    const labels = ['周一','周二','周三','周四','周五','周六','周日']
    // 计算周一~周日
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate)
      d.setDate(mondayDate.getDate() + i)
      const dateStr = formatDate(d)
      weekDays.push({
        label: labels[i],
        day: String(d.getDate()).padStart(2, '0'),
        dateStr,
        isToday: dateStr === todayStr
      })
    }
    // 周范围：周一 ~ 周日
    const start = new Date(mondayDate)
    const end = new Date(mondayDate)
    end.setDate(end.getDate() + 6)
    const rangeLabel = `${formatMonthDay(start)} ~ ${formatMonthDay(end)}`
    this.setData({
      weekDays,
      weekStart: formatDate(mondayDate),
      selectedDate: selected || weekDays[0].dateStr,
      weekRangeLabel: rangeLabel
    })
  },
  // 点上方那一周里的某一天
  onPickDate(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ selectedDate: date })
    this.refresh()
  },
  // 从日期选择器切换周：选任意日期 -> 找到该周周一
  onWeekDateChange(e) {
    const dateStr = e.detail.value
    if (!dateStr) return
    const d = new Date(dateStr)
    const monday = getMonday(d)
    this.buildWeek(monday, formatDate(d))
    this.refresh()
  },
  // 打开状态筛选菜单
  onOpenStatusSheet() {
    const tabs = this.data.statusTabs
    wx.showActionSheet({
      itemList: tabs.map(t => t.label),
      success: (res) => {
        const idx = res.tapIndex
        const picked = tabs[idx]
        if (!picked) return
        this.setData({
          status: picked.value,
          statusLabel: picked.label
        })
        this.refresh()
      }
    })
  },
  async refresh() {
    const { selectedDate, status, timeConfig } = this.data
    if (!selectedDate) return
    this.setData({ loading: true })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_list_all_sessions',
        data: {
          date: selectedDate,
          status
        }
      })
      const raw = (result && result.list) || []
      const segments = buildSegmentsForDay(raw, timeConfig)
      this.setData({
        list: raw,
        segments
      })
    } catch (err) {
      const { selectedDate, status } = this.data
      console.error('admin_list_all_sessions error', {
        data: { date: selectedDate, status },
        err
      })
      wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/sessions/detail/index?id=${id}`
    })
  }
})

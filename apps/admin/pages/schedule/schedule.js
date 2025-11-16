function today() {
  const d = new Date();
  const pad = n => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

Page({
  data: {
    searchInput: '',
    searchResults: [],
    chosenUserId: null,
    chosenUser: null,
    title: '',
    startDate: today(),
    startTime: '09:00',
    endDate: today(),
    endTime: '10:00',
    creating: false
  },

  onSearchInput(e) {
    this.setData({ searchInput: e.detail.value.trim() });
  },

  searchUsers() {
    const q = this.data.searchInput;
    if (!q) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '搜索中' });
    wx.cloud.callFunction({
      name: 'admin_search_users',
      data: { q, page: 0, pageSize: 20 }
    }).then(r => {
      const list = r.result?.list || [];
      this.setData({ searchResults: list });
      if (!list.length) {
        wx.showToast({ icon: 'none', title: '未找到学员' });
      }
    }).catch(err => {
      console.error('searchUsers error', err);
      wx.showToast({ icon: 'none', title: (err.message || '搜索失败').slice(0, 17) });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  pickUser(e) {
    const { userId, nickname, phone } = e.currentTarget.dataset || {};
    if (!userId) {
      wx.showToast({ title: '未拿到用户ID', icon: 'none' });
      console.warn('pickUser 缺少 userId', e.currentTarget.dataset);
      return;
    }
    this.setData({
      chosenUserId: userId,
      chosenUser: { userId, nickname, phone }
    });
    wx.showToast({ title: '已选择学员' });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value.trim() });
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value });
  },

  // 组合日期时间为 ISO 字符串
  toISO(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    const d = new Date(`${dateStr} ${timeStr}:00`.replace(/-/g, '/'));
    return isNaN(+d) ? null : d.toISOString();
  },

  async createPendingSession() {
    const { chosenUserId, title, startDate, startTime, endDate, endTime } = this.data;
    if (!chosenUserId) {
      return wx.showToast({ title: '请先选择学员', icon: 'none' });
    }
    const sISO = this.toISO(startDate, startTime);
    const eISO = this.toISO(endDate || startDate, endTime);
    if (!sISO || !eISO) {
      return wx.showToast({ title: '请完整选择开始/结束时间', icon: 'none' });
    }
    if (new Date(eISO).getTime() <= new Date(sISO).getTime()) {
      return wx.showToast({ icon: 'none', title: '结束时间必须晚于开始时间' });
    }
    this.setData({ creating: true });
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_create_session',
        data: {
          userId: chosenUserId,
          title: title || '未命名课程',
          startAt: sISO,
          endAt: eISO
          // 不再传 tenantId
        }
      });
      // 不再展示/复制 sessionId
      wx.showToast({ title: '已创建（待确认）' });
      // 清空表单
      this.setData({
        searchInput: '',
        searchResults: [],
        chosenUserId: null,
        chosenUser: null,
        title: '',
        startDate: today(),
        startTime: '09:00',
        endDate: today(),
        endTime: '10:00'
      });
    } catch (e) {
      console.error('createPendingSession error', e);
      wx.showToast({ title: '创建失败', icon: 'none' });
    } finally {
      this.setData({ creating: false });
    }
  }
});

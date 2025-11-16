Page({
  data: { q: '', startDate: '', endDate: '', list: [], loading: false },
  onKeyword(e) {
    this.setData({ q: e.detail.value });
  },
  onStartDate(e) {
    this.setData({ startDate: e.detail.value });
  },
  onEndDate(e) {
    this.setData({ endDate: e.detail.value });
  },
  iso(d) {
    return d ? new Date(`${d} 00:00:00`.replace(/-/g, '/')).toISOString() : undefined;
  },
  isoEnd(d) {
    return d ? new Date(`${d} 23:59:59`.replace(/-/g, '/')).toISOString() : undefined;
  },
  onLoad() {
    this.fetch();
  },
  async fetch() {
    this.setData({ loading: true });
    try {
      const { q, startDate, endDate } = this.data;
      const { result } = await wx.cloud.callFunction({
        name: 'user_list_confirmed_sessions',
        data: {
          q: q || undefined,
          startFrom: this.iso(startDate),
          startTo: this.isoEnd(endDate)
        }
      });
      this.setData({ list: result?.list || [] });
    } catch (e) {
      console.error('fetch confirmed sessions error', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
  goReports() {
    wx.navigateTo({ url: '/pages/reports/list/index' });
  }
});


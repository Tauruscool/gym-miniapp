Page({
  data: { q: '', createdFrom: '', createdTo: '', list: [], loading: false },
  onKeyword(e) {
    this.setData({ q: e.detail.value });
  },
  onCreatedFrom(e) {
    this.setData({ createdFrom: e.detail.value });
  },
  onCreatedTo(e) {
    this.setData({ createdTo: e.detail.value });
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
      const { q, createdFrom, createdTo } = this.data;
      const { result } = await wx.cloud.callFunction({
        name: 'user_list_reports',
        data: {
          q: q || undefined,
          createdFrom: this.iso(createdFrom),
          createdTo: this.isoEnd(createdTo),
          page: 1,
          pageSize: 50
        }
      });
      this.setData({ list: result?.list || [] });
    } catch (e) {
      const { q, createdFrom, createdTo } = this.data
      console.error('user_list_reports error', {
        data: { q, createdFrom, createdTo },
        err: e
      })
      wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ loading: false });
    }
  },
  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/reports/detail/index?id=${id}` });
  }
});


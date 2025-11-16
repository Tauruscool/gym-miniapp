Page({
  data: { report: null, loading: false },
  onLoad(q) {
    this.id = q.id;
    this.fetch();
  },
  async fetch() {
    if (!this.id) return;
    this.setData({ loading: true });
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'user_get_report',
        data: { reportId: this.id }
      });
      this.setData({ report: result?.report || null });
    } catch (e) {
      console.error('fetch report detail error', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});


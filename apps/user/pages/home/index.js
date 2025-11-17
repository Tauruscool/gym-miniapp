Page({

  data: {
    q: '',
    startDate: '',
    endDate: '',
    pending: [],
    loading: false,
    emptyHint: ''
  },

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
    this.bootstrap()
  },

  onShow() {
    // 可选：返回页面时刷新
    // this.refreshPending()
  },

  async bootstrap() {
    try {
      this.setData({ loading: true });
      await wx.cloud.callFunction({ name: 'auth_login' });  // 确保 users 落库
      await this.refreshPending();
    } catch (e) {
      console.error('auth_login / bootstrap error', { err: e })
      wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ loading: false });
    }
  },

  async refreshPending() {
    this.setData({ loading: true, emptyHint: '' });
    try {
      const { q, startDate, endDate } = this.data;
      const { result } = await wx.cloud.callFunction({
        name: 'user_list_pending_sessions',
        data: {
          q: q || undefined,
          startFrom: this.iso(startDate),
          startTo: this.isoEnd(endDate)
        }
      });
      const list = result?.list || [];
      this.setData({
        pending: list,
        emptyHint: list.length ? '' : '暂无待确认课程'
      });
      console.log('pending sessions:', list);
    } catch (e) {
      const { q, startDate, endDate } = this.data
      console.error('user_list_pending_sessions error', {
        data: { q, startDate, endDate },
        err: e
      })
      wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh && wx.stopPullDownRefresh();
    }
  },

  onPullDownRefresh() {
    this.refreshPending()
  },

  onLogin() {
    wx.cloud.callFunction({ name: "auth_login" })
      .then(res => {
        const { userId } = res.result || {};
        if (userId) wx.setStorageSync("userId", userId);
        wx.showToast({ title: "登录成功" });
        this.refreshPending();
      })
      .catch(err => {
        console.error('auth_login error', { err })
        wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
      });
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value.trim() }); },

  bindPhone() {
    const phone = this.data.phone;
    if (!phone) return wx.showToast({ icon:'none', title:'请先输入手机号' });
    wx.cloud.callFunction({ name:'user_bind_phone', data:{ phone } })
      .then(()=> wx.showToast({ title:'绑定成功' }))
      .catch(err=>{
        const { phone } = this.data
        console.error('user_bind_phone error', {
          data: { phone },
          err
        })
        wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
      });
  },

  goConfirmed() {
    wx.navigateTo({ url: '/pages/sessions/confirmed/index' });
  },

  goReports() {
    wx.navigateTo({ url: '/pages/reports/list/index' });
  },

  confirmAndAddCalendar(e) {
    const sessionId = e.currentTarget.dataset.id;
    this.confirmById(sessionId);
  },

  confirmById(sessionId){
    wx.cloud.callFunction({ name:'confirm_session', data:{ sessionId } })
      .then(r => {
        // confirm_session 返回的是平铺结构，不是嵌套在 session 中
        const s = r.result;
        if (!s || !s.title) throw new Error('未找到课程');

        // 写系统日历（真机更可靠）
        if (wx.addPhoneCalendar) {
          wx.addPhoneCalendar({
            title: s.title || '私教课',
            startTime: Math.floor(new Date(s.startAt).getTime()/1000),
            endTime: Math.floor(new Date(s.endAt).getTime()/1000),
            success: ()=> wx.showToast({ title:'已加到日历' }),
            fail: ()=> wx.showToast({ icon:'none', title:'请在真机测试日历写入' })
          });
        } else {
          wx.showToast({ icon:'none', title:'基础库过低或工具不支持日历' });
        }

        // 列表里剔除
        const rest = this.data.pending.filter(x => x._id !== sessionId);
        this.setData({ pending: rest });
      })
      .catch(err => {
        console.error('confirm_session error', {
          data: { sessionId },
          err
        })
        wx.showToast({ title: '请求失败，请稍后重试', icon: 'none' })
      });
  },

  fmt(iso) {
    const d = new Date(iso);
    const pad = n => (n<10 ? '0'+n : ''+n);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

});

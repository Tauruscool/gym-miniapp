Page({
  data: {
    userId: '',
    form: {
      nickname: '',
      gender: '',
      heightCm: '',
      weightKg: '',
      bodyFat: '',
      phone: '',
      timesBalance: '',
      balanceAmount: ''
    },
    genderOptions: [
      { value: '', label: '未设置' },
      { value: 'male', label: '男' },
      { value: 'female', label: '女' }
    ],
    genderIndex: 0,
    genderLabel: '未设置'
  },
  onLoad(options) {
    const userId = options.userId || ''
    this.setData({ userId })
    if (userId) {
      this.loadDetail()
    }
  },
  async loadDetail() {
    wx.showLoading({ title: '加载中' })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_get_user_detail',
        data: { userId: this.data.userId }
      })
      const user = result.user || {}
      const wallet = result.wallet || {}
      const form = {
        nickname: user.nickname || '',
        gender: user.gender || '',
        heightCm: user.heightCm != null ? String(user.heightCm) : '',
        weightKg: user.weightKg != null ? String(user.weightKg) : '',
        bodyFat: user.bodyFat != null ? String(user.bodyFat) : '',
        phone: user.phone || '',
        timesBalance: user.timesBalance != null ? String(user.timesBalance) : '',
        balanceAmount: wallet.balance != null ? String(wallet.balance) : ''
      }
      const idx = this.data.genderOptions.findIndex(opt => opt.value === form.gender)
      const genderIndex = idx >= 0 ? idx : 0
      const genderLabel = this.data.genderOptions[genderIndex].label
      this.setData({ form, genderIndex, genderLabel })
    } catch (e) {
      console.error('loadDetail error', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`form.${field}`]: value })
  },
  onGenderChange(e) {
    const index = Number(e.detail.value || 0)
    const opt = this.data.genderOptions[index]
    this.setData({
      genderIndex: index,
      genderLabel: opt.label,
      'form.gender': opt.value
    })
  },
  async onSave() {
    const { userId, form } = this.data
    if (!userId) return
    wx.showLoading({ title: '保存中' })
    try {
      await wx.cloud.callFunction({
        name: 'admin_update_user_detail',
        data: {
          userId,
          ...form
        }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      console.error('save user error', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})


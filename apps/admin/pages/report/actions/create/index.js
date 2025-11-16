Page({

  data: {

    name: '',

    groupOptions: ['背', '胸', '下肢', '后链', '核心', '肩', '臂'],

    groupIndex: 0,

    unitOptions: ['kg', '次', '秒', '米'],

    unitIndex: 0,

    defaultLoad: ''

  },

  onNameInput(e) {

    this.setData({ name: e.detail.value });

  },

  onGroupChange(e) {

    this.setData({ groupIndex: Number(e.detail.value) });

  },

  onUnitChange(e) {

    this.setData({ unitIndex: Number(e.detail.value) });

  },

  onLoadInput(e) {

    this.setData({ defaultLoad: e.detail.value });

  },

  async onSave() {

    const { name, groupOptions, groupIndex, unitOptions, unitIndex, defaultLoad } = this.data;

    if (!name) {

      wx.showToast({ title: '请输入动作名称', icon: 'none' });

      return;

    }

    const muscleGroup = groupOptions[groupIndex];

    const unit = unitOptions[unitIndex];

    try {

      wx.showLoading({ title: '保存中', mask: true });

      await wx.cloud.callFunction({

        name: 'admin_create_training_action',

        data: {

          name,

          muscleGroup,

          unit,

          defaultLoad: defaultLoad ? Number(defaultLoad) : null

        }

      });

      wx.hideLoading();

      wx.showToast({ title: '已保存', icon: 'success' });

      // 通知上一页刷新动作列表

      const pages = getCurrentPages();

      const prev = pages[pages.length - 2];

      if (prev && typeof prev.onNewActionCreated === 'function') {

        prev.onNewActionCreated();

      }

      setTimeout(() => {

        wx.navigateBack();

      }, 400);

    } catch (err) {

      wx.hideLoading();

      console.error('create action error', err);

      wx.showToast({ title: '保存失败', icon: 'none' });

    }

  }

});


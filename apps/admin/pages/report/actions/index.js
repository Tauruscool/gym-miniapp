Page({

  data: {

    allActions: [],      // 所有动作

    visibleActions: [],  // 当前分类 + 关键字过滤后的动作

    groups: [],          // 分类列表，如 [{ name: '下肢', label: '下肢' }, ...]

    activeGroup: '',

    keyword: '',

    loading: false,

    selectedCount: 0

  },

  onLoad() {

    this.eventChannel = this.getOpenerEventChannel();

    let preSelected = [];

    // 接收上一个页面传来的已选动作

    this.eventChannel.on('initSelectedActions', data => {

      preSelected = (data && data.items) || [];

      this.loadActions(preSelected);

    });

  },

  // 从云函数加载动作列表

  async loadActions(preSelected) {

    this.setData({ loading: true });

    try {

      const { result } = await wx.cloud.callFunction({

        name: 'catalog_search',

        data: {

          key: '',     // 空关键字 = 全部

          muscle: ''  // 不按肌群筛选

        }

      });

      const list = (result && result.list) || [];

      // 已选动作 map，用 code 去重

      const selectedMap = {};

      preSelected.forEach(a => {

        if (a.code) selectedMap[a.code] = true;

      });

      // 给动作打上 _selected

      const allActions = list.map(a => ({

        ...a,

        _selected: !!selectedMap[a.code]

      }));

      // 构造分类列表

      const groupMap = {};

      allActions.forEach(a => {

        const g = a.muscleGroup || '未分组';

        groupMap[g] = true;

      });

      const groups = Object.keys(groupMap).map(name => ({

        name,

        label: name

      }));

      const activeGroup = groups.length ? groups[0].name : '';

      this.setData({

        allActions,

        groups,

        activeGroup

      });

      this.applyFilter();

    } catch (err) {

      console.error('load actions error', err);

      wx.showToast({ title: '加载动作失败', icon: 'none' });

      this.setData({ loading: false });

    }

  },

  applyFilter() {

    const { allActions, activeGroup, keyword } = this.data;

    let list = allActions;

    if (activeGroup) {

      list = list.filter(a => (a.muscleGroup || '未分组') === activeGroup);

    }

    if (keyword && keyword.trim()) {

      const kw = keyword.trim().toLowerCase();

      list = list.filter(a =>

        (a.name || '').toLowerCase().includes(kw)

      );

    }

    const selectedCount = allActions.filter(a => a._selected).length;

    this.setData({

      visibleActions: list,

      selectedCount,

      loading: false

    });

  },

  onPickGroup(e) {

    const name = e.currentTarget.dataset.name;

    this.setData({

      activeGroup: name

    });

    this.applyFilter();

  },

  onKeywordInput(e) {

    this.setData({

      keyword: e.detail.value

    });

  },

  onSearch() {

    this.applyFilter();

  },

  // 切换选中状态

  toggleAction(e) {

    const code = e.currentTarget.dataset.code;

    const { allActions } = this.data;

    const idx = allActions.findIndex(a => a.code === code);

    if (idx === -1) return;

    const key = `allActions[${idx}]._selected`;

    this.setData({

      [key]: !allActions[idx]._selected

    });

    this.applyFilter();

  },

  // 确认选择，返回上一个页面

  onConfirm() {

    const { allActions } = this.data;

    const selected = allActions.filter(a => a._selected);

    this.eventChannel.emit('actionsSelected', {

      items: selected

    });

    wx.navigateBack();

  },

  // 跳转到新增动作页面

  goCreateAction() {

    wx.navigateTo({

      url: '/pages/report/actions/create/index'

    });

  },

  // 新增动作后的回调，刷新列表

  onNewActionCreated() {

    // 记录当前已选动作，刷新列表后保持选中

    const selected = this.data.allActions.filter(a => a._selected);

    this.loadActions(selected);

  }

});


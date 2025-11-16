const musclesDefault = ["全部", "下肢", "后链", "胸", "背", "核心"];



Page({

  data: {

    userQ:"", userResults:[],

    chosenUser:{}, chosenUserId:"",   // 单独保存 userId，更稳

    // 课程

    statusFilters: ["待确认或已确认", "仅待确认", "仅已确认"],

    statusIdx: 0, onlyFuture: false, sessions: [], sessionId: "",

    // 报告

    deductChips: [0, 50, 100, 200],

    deduct: 0, isCustomDeduct: false,

    comment: "",

    RPE: 7, rpeOptions: [1,2,3,4,5,6,7,8,9,10],

    // 动作库

    key: "", muscles: musclesDefault, muscleIdx: 0,

    results: [], selected: []

  },

  /* ===== A. 学员选择 ===== */

  onUserQ(e){ this.setData({ userQ: e.detail.value.trim() }); },

  searchUsers(){

    wx.showLoading({ title:'搜索中' });

    wx.cloud.callFunction({

      name:'admin_search_users',

      data:{ q:this.data.userQ, page:0, pageSize:20 }

    }).then(r=>{

      this.setData({ userResults: r.result?.list || [] });

      if (!(r.result?.list||[]).length) wx.showToast({ icon:'none', title:'未找到学员' });

    }).catch(err=>{

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'搜索失败').slice(0,17) });

    }).finally(()=> wx.hideLoading());

  },

  pickUser(e){

    const ds = e.currentTarget.dataset || {};

    // 只从 dataset 取值，严防 undefined

    const userId = ds.userId;

    if (!userId || userId === 'undefined'){

      console.error('pickUser 缺少 userId', ds);

      wx.showToast({ icon:'none', title:'学员数据异常' });

      return;

    }

    const nickname = ds.nickname || '未命名';

    const phone = ds.phone || '';

    const chosenUser = { userId, nickname, phone };

    this.setData(

      { chosenUser, chosenUserId: userId, sessions: [], sessionId: "" },

      () => {

        this.loadSessions(userId);      // setData 回调里调用，避免读到旧值

        wx.showToast({ title:'已选择学员' });

      }

    );

  },

  /* ===== B. 课程选择 ===== */

  onStatusChange(e){ this.setData({ statusIdx: Number(e.detail.value) }); },

  toggleFuture(e){ this.setData({ onlyFuture: e.detail.value }); },

  loadSessions(passedUserId){

    const userId = passedUserId || this.data.chosenUserId;

    if (!userId) return wx.showToast({ icon:'none', title:'请先选择学员' });

    const mapping = [

      ['pending','confirmed'],

      ['pending'],

      ['confirmed']

    ];

    wx.showLoading({ title:'加载课程' });

    wx.cloud.callFunction({

      name:'admin_list_sessions',

      data:{

        userId,

        statusIn: mapping[this.data.statusIdx],

        onlyFuture: this.data.onlyFuture,

        page: 0, pageSize: 50

      }

    }).then(r=>{

      const list = r.result?.list || [];

      // 格式化日期和时间
      const fmtDate = iso => {
        if (!iso) return '';
        const d = new Date(iso);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const fmtHM = iso => {
        if (!iso) return '';
        const d = new Date(iso);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      };

      const enhanced = list.map(s => {
        const dateStr = fmtDate(s.startAt);
        const timeRange = `${fmtHM(s.startAt)}~${fmtHM(s.endAt)}`;
        return {
          ...s,
          _dateStr: dateStr,
          _timeRange: timeRange
        };
      });

      this.setData({ sessions: enhanced });

      if (!enhanced.length) wx.showToast({ icon:'none', title:'暂无课程' });

    }).catch(err=>{

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'加载失败').slice(0,17) });

    }).finally(()=> wx.hideLoading());

  },

  pickSession(e){ this.setData({ sessionId: e.currentTarget.dataset.id }); },

  /* ===== C. 报告输入 ===== */

  pickDeductChip(e){

    const v = Number(e.currentTarget.dataset.v);

    this.setData({ deduct: v, isCustomDeduct: false });

  },

  enableCustomDeduct(){ this.setData({ isCustomDeduct: true }); },

  onDeduct(e){

    const n = Number(e.detail.value || 0);

    this.setData({ deduct: isNaN(n)?0:n });

  },

  onComment(e){ this.setData({ comment: e.detail.value }); },

  pickRPE(e){ this.setData({ RPE: Number(e.currentTarget.dataset.v) }); },

  /* ===== D. 动作库 ===== */

  onKey(e){ this.setData({ key: e.detail.value.trim() }); },

  onMuscleChange(e){ this.setData({ muscleIdx: Number(e.detail.value) }); },

  search(){

    wx.showLoading({ title:'搜索中' });

    const muscle = this.data.muscleIdx === 0 ? "" : this.data.muscles[this.data.muscleIdx];

    wx.cloud.callFunction({

      name:'catalog_search',

      data:{ key:this.data.key, muscle, page:0, pageSize:20 }

    }).then(r=>{

      const list = r.result?.list || [];

      this.setData({ results: list });

      if (!list.length) wx.showToast({ icon:'none', title:'没有匹配的动作' });

    }).catch(err=>{

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'搜索失败').slice(0,17) });

    }).finally(()=> wx.hideLoading());

  },

  addOne(e){

    const code = e.currentTarget.dataset.code;

    const found = this.data.results.find(x => x.code === code);

    if (!found) return;

    if (this.data.selected.some(x => x.code === code))

      return wx.showToast({ icon:'none', title:'已在已选中' });

    const item = {

      code: found.code, name: found.name, unit: found.unit,

      sets: 3, reps: found.unit === 'sec' ? 1 : 8,

      load: Number(found.defaultLoad || 0), notes:''

    };

    this.setData({ selected: this.data.selected.concat(item) });

  },

  removeOne(e){ this.setData({ selected: this.data.selected.filter(x => x.code !== e.currentTarget.dataset.code) }); },

  stopPropagation(e){ /* 阻止事件冒泡，避免触发跳转 */ },

  goSelectActions(){

    console.log('goSelectActions tap');  // 方便在控制台确认点击有没有触发

    const selected = this.data.selected || [];

    wx.navigateTo({

      url: '/pages/report/actions/index',

      success: (res) => {

        const eventChannel = res.eventChannel;

        // 把当前已选动作传给新页面做初始化

        eventChannel.emit('initSelectedActions', {

          items: selected

        });

        // 监听新页面选完返回

        eventChannel.on('actionsSelected', data => {

          if (data && data.items) {

            // 将返回的动作转换为带编辑字段的格式

            const enhanced = data.items.map(item => {

              // 如果已存在，保留原有的编辑字段

              const existing = this.data.selected.find(x => x.code === item.code);

              if (existing) {

                return existing;

              }

              // 新动作，设置默认值

              return {

                code: item.code,

                name: item.name,

                unit: item.unit || 'kg',

                muscleGroup: item.muscleGroup || '',

                defaultLoad: item.defaultLoad || 0,

                sets: 3,

                reps: item.unit === 'sec' ? 1 : 8,

                load: Number(item.defaultLoad || 0),

                notes: ''

              };

            });

            this.setData({

              selected: enhanced

            });

          }

        });

      }

    });

  },

  editItem(e){

    const { code, field } = e.currentTarget.dataset;

    const val = field === 'notes' ? e.detail.value : Number(e.detail.value || 0);

    this.setData({ selected: this.data.selected.map(x => x.code===code ? { ...x, [field]: val } : x) });

  },

  /* ===== E. 提交 ===== */

  submit(){

    const { chosenUserId, sessionId, selected, deduct, comment, RPE } = this.data;

    if (!chosenUserId)   return wx.showToast({ icon:'none', title:'请先选择学员' });

    if (!sessionId)      return wx.showToast({ icon:'none', title:'请先选择课程' });

    if (!selected.length)return wx.showToast({ icon:'none', title:'请先添加动作' });

    const report = { coachId:'coach_001', items:selected, RPE, comment };

    wx.showLoading({ title:'提交中' });

    wx.cloud.callFunction({

      name:'report_and_deduct',

      data:{ sessionId, report, deductAmount: Number(deduct||0) }

    }).then(()=>{

      wx.hideLoading();

      wx.showToast({ title:'已提交' });

      this.setData({ selected: [], comment:'', sessionId:'' });

    }).catch(err=>{

      wx.hideLoading();

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'提交失败').slice(0,17) });

    });

  },

  /* 工具 */

  fmt(iso){ const d=new Date(iso); const p=n=>n<10?'0'+n:n; return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; },

  statusText(s){ return s==='pending'?'待确认':(s==='confirmed'?'已确认':'已完成'); }

});
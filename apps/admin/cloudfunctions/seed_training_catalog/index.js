// 幂等灌库：没有就插入；已有就更新字段（补齐 muscleGroup / defaultLoad 等）

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async () => {
  const tenantId = 't_default';
  const rows = [
    // 胸
    { code: 'BENCH_BAR', name: '杠铃卧推', muscleGroup: '胸', unit: 'kg', defaultLoad: 20 },
    { code: 'BENCH_DB', name: '哑铃卧推', muscleGroup: '胸', unit: 'kg', defaultLoad: 12 },
    { code: 'INCLINE_DB', name: '上斜哑铃卧推', muscleGroup: '胸', unit: 'kg', defaultLoad: 10 },
    { code: 'FLY_DB', name: '哑铃飞鸟', muscleGroup: '胸', unit: 'kg', defaultLoad: 6 },
    // 背
    { code: 'ROW_BAR', name: '杠铃划船', muscleGroup: '背', unit: 'kg', defaultLoad: 30 },
    { code: 'ROW_DB', name: '单臂哑铃划船', muscleGroup: '背', unit: 'kg', defaultLoad: 16 },
    { code: 'PULLDOWN', name: '高位下拉', muscleGroup: '背', unit: 'kg', defaultLoad: 25 },
    { code: 'PULLUP', name: '引体向上', muscleGroup: '背', unit: '次', defaultLoad: 5 },
    // 下肢
    { code: 'SQUAT_BAR', name: '杠铃深蹲', muscleGroup: '下肢', unit: 'kg', defaultLoad: 40 },
    { code: 'SPLIT_SQ', name: '保加利亚分腿蹲', muscleGroup: '下肢', unit: 'kg', defaultLoad: 10 },
    { code: 'LUNGE', name: '弓步蹲', muscleGroup: '下肢', unit: 'kg', defaultLoad: 8 },
    // 后链
    { code: 'DEADLIFT', name: '硬拉', muscleGroup: '后链', unit: 'kg', defaultLoad: 50 },
    { code: 'RDL', name: '罗马尼亚硬拉', muscleGroup: '后链', unit: 'kg', defaultLoad: 40 },
    { code: 'HIP_THRUST', name: '臀桥', muscleGroup: '后链', unit: 'kg', defaultLoad: 40 },
    // 核心
    { code: 'PLANK', name: '平板支撑', muscleGroup: '核心', unit: '秒', defaultLoad: 30 },
    { code: 'HANG_LEG', name: '悬垂举腿', muscleGroup: '核心', unit: '次', defaultLoad: 10 },
    { code: 'CRUNCH', name: '卷腹', muscleGroup: '核心', unit: '次', defaultLoad: 15 },
    // 肩
    { code: 'OH_PRESS', name: '肩上推举', muscleGroup: '肩', unit: 'kg', defaultLoad: 15 },
    { code: 'LAT_RAISE', name: '侧平举', muscleGroup: '肩', unit: 'kg', defaultLoad: 6 },
    // 臂
    { code: 'CURL_DB', name: '哑铃弯举', muscleGroup: '臂', unit: 'kg', defaultLoad: 8 },
    { code: 'TRI_EXT', name: '绳索下压', muscleGroup: '臂', unit: 'kg', defaultLoad: 12 }
  ];

  let inserted = 0, updated = 0;

  for (const r of rows) {
    const q = await db.collection('training_catalog').where({ tenantId, code: r.code }).get();
    if (!q.data.length) {
      await db.collection('training_catalog').add({ data: { ...r, tenantId, createdAt:new Date() } });
      inserted++;
    } else {
      // 补齐/更新字段（不会动你自定义的其他字段）
      const id = q.data[0]._id;
      await db.collection('training_catalog').doc(id).update({
        data: {
          name: r.name, muscleGroup: r.muscleGroup, unit: r.unit, defaultLoad: r.defaultLoad,
          updatedAt: new Date()
        }
      });
      updated++;
    }
  }

  return { inserted, updated };
};

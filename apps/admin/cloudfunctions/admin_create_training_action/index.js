const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { name, muscleGroup, unit = 'kg', defaultLoad, tenantId } = event;

  if (!name || !muscleGroup) {
    return { ok: false, error: '缺少 name 或 muscleGroup' };
  }

  const { OPENID } = cloud.getWXContext();
  const finalTenantId = tenantId || 't_default';
  const code = `C${Date.now()}`;  // 简单生成一个唯一 code

  await db.collection('training_catalog').add({
    data: {
      code,
      name,
      muscleGroup,
      unit,
      defaultLoad: defaultLoad || null,
      tenantId: finalTenantId,
      createdBy: OPENID,
      createdAt: db.serverDate()
    }
  });

  return { ok: true, code };
};


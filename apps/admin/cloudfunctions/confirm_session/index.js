// confirm_session - 确认训练会话
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { sessionId } = event;

  if (!sessionId) {
    throw new Error('参数不完整：需要 sessionId');
  }

  const tenantId = 't_default';
  const now = new Date();

  try {
    // 查询会话
    const sessionQuery = await db.collection('sessions')
      .doc(sessionId)
      .get();

    if (!sessionQuery.data) {
      throw new Error('会话不存在');
    }

    const session = sessionQuery.data;

    // 更新会话状态为 confirmed
    await db.collection('sessions')
      .doc(sessionId)
      .update({
        data: {
          status: 'confirmed',
          updatedAt: now
        }
      });

    // 返回会话详情（包含时间信息）
    return {
      sessionId: sessionId,
      startAt: session.startAt,
      endAt: session.endAt,
      title: session.title,
      coachId: session.coachId,
      userId: session.userId,
      status: 'confirmed'
    };
  } catch (error) {
    throw new Error(`确认会话失败: ${error.message}`);
  }
};

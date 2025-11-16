const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const _ = db.command;

exports.main = async (event = {}) => {
  const { key = "", muscle = "", page = 0, pageSize = 20, tenantId = "t_default" } = event;

  const limit = Math.min(pageSize, 50);

  const clauses = [{ tenantId }];
  if (muscle) clauses.push({ muscleGroup: muscle });
  if (key) {
    const re = db.RegExp({ regexp: key, options: 'i' });
    clauses.push(_.or([{ name: re }, { code: re }]));
  }

  const where = _.and(clauses);

  const snap = await db.collection('training_catalog')
    .where(where).orderBy('name', 'asc')
    .skip(page * limit).limit(limit).get();

  const list = snap.data.map(x => ({
    code: x.code, name: x.name, muscleGroup: x.muscleGroup,
    unit: x.unit, defaultLoad: x.defaultLoad ?? 0
  }));

  return { list, page, pageSize: limit, hasMore: list.length === limit };
};

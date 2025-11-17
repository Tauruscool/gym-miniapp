// 通用云函数调用封装
// 提供统一的错误处理和日志记录

function callCloud(name, data, extraContext) {
  return wx.cloud.callFunction({ name, data })
    .then(res => res)
    .catch(err => {
      console.error(`${name} error`, {
        data,
        extra: extraContext || null,
        err
      });
      wx.showToast({
        title: '请求失败，请稍后重试',
        icon: 'none'
      });
      throw err;
    });
}

module.exports = {
  callCloud
};


// 统一响应格式工具
class ResponseHelper {
  // 成功响应
  static success(res, data = null, message = '操作成功', code = 200) {
    return res.status(code).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // 错误响应
  static error(res, message = '操作失败', code = 500, errors = null) {
    return res.status(code).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // 分页响应
  static paginated(res, data, total, page, limit, message = '查询成功') {
    return res.json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  }

  // 验证错误响应
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // 未授权响应
  static unauthorized(res, message = '未授权访问') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // 禁止访问响应
  static forbidden(res, message = '禁止访问') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // 资源未找到响应
  static notFound(res, message = '资源未找到') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseHelper;

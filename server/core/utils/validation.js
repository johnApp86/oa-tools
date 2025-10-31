const { body, validationResult } = require('express-validator');

// 通用验证规则
const commonValidations = {
  // 必填字段
  required: (field, message) => body(field).notEmpty().withMessage(message || `${field}不能为空`),
  
  // 数字验证
  numeric: (field, message) => body(field).isNumeric().withMessage(message || `${field}必须是数字`),
  
  // 整数验证
  integer: (field, message) => body(field).isInt().withMessage(message || `${field}必须是整数`),
  
  // 邮箱验证
  email: (field, message) => body(field).isEmail().withMessage(message || `${field}格式不正确`),
  
  // 日期验证
  date: (field, message) => body(field).isISO8601().withMessage(message || `${field}日期格式不正确`),
  
  // 长度验证
  length: (field, min, max, message) => body(field).isLength({ min, max }).withMessage(message || `${field}长度必须在${min}-${max}之间`),
  
  // 枚举值验证
  enum: (field, values, message) => body(field).isIn(values).withMessage(message || `${field}值无效`),
  
  // 手机号验证
  phone: (field, message) => body(field).matches(/^1[3-9]\d{9}$/).withMessage(message || `${field}手机号格式不正确`)
};

// 处理验证结果
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// 分页参数验证
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: '分页参数无效',
      timestamp: new Date().toISOString()
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next();
};

module.exports = {
  commonValidations,
  handleValidationErrors,
  validatePagination
};

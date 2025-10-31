const jwt = require('jsonwebtoken');

const JWT_SECRET = 'oa-system-secret-key';

// 验证token中间件
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'token无效' });
  }
};

module.exports = { verifyToken };

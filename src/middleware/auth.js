const jwt = require("jsonwebtoken");
const { User } = require("../database/models");

// التحقق من JWT token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    return user;
  } catch (error) {
    throw new Error("Token غير صالح");
  }
};

// استخراج token من header
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

// Middleware للمصادقة
const authMiddleware = async (req) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return { user: null };
    }

    const user = await verifyToken(token);
    return { user };
  } catch (error) {
    console.error("خطأ في المصادقة:", error.message);
    return { user: null };
  }
};

// Middleware للتحقق من المصادقة الإلزامية
const requireAuth = async (req) => {
  const { user } = await authMiddleware(req);

  if (!user) {
    throw new Error("غير مصرح لك بالوصول");
  }

  return { user };
};

module.exports = {
  authMiddleware,
  requireAuth,
  verifyToken,
  extractToken,
};

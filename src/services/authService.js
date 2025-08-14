const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../database/models");

class AuthService {
  // إنشاء JWT token
  static generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );
  }

  // تشفير كلمة المرور
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // التحقق من كلمة المرور
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // تسجيل الدخول
  static async login(email, password) {
    // البحث عن المستخدم
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    // التحقق من كلمة المرور
    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    // إنشاء token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  // تسجيل مستخدم جديد
  static async register(userData) {
    const { email, password, name, avatar } = userData;

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }

    // تشفير كلمة المرور
    const hashedPassword = await this.hashPassword(password);

    // إنشاء المستخدم
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      avatar,
    });

    // إنشاء token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  // تحديث كلمة المرور
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    // التحقق من كلمة المرور الحالية
    const isValidPassword = await this.verifyPassword(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      throw new Error("كلمة المرور الحالية غير صحيحة");
    }

    // تشفير كلمة المرور الجديدة
    const hashedNewPassword = await this.hashPassword(newPassword);

    // تحديث كلمة المرور
    await User.update(userId, { password: hashedNewPassword });

    return { message: "تم تغيير كلمة المرور بنجاح" };
  }

  // إعادة تعيين كلمة المرور (للمستقبل)
  static async resetPassword(email) {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error("البريد الإلكتروني غير موجود");
    }

    // هنا يمكن إرسال رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني
    // سيتم تنفيذها لاحقاً

    return {
      message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
    };
  }

  // التحقق من صحة token
  static async verifyToken(token) {
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
  }
}

module.exports = AuthService;

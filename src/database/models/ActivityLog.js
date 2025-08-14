const prisma = require("../connection");

class ActivityLog {
  // إنشاء سجل نشاط جديد
  static async create(activityData) {
    return await prisma.activityLog.create({
      data: activityData,
      include: {
        user: true,
        task: true,
        board: true,
      },
    });
  }

  // البحث عن سجل نشاط بواسطة المعرف
  static async findById(id) {
    return await prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: true,
        task: true,
        board: true,
      },
    });
  }

  // الحصول على سجلات النشاط مع فلترة وترتيب
  static async findMany(options = {}) {
    const {
      where = {},
      orderBy = { createdAt: "desc" },
      take = 10,
      skip = 0,
      cursor,
      include = {
        user: true,
        task: true,
        board: true,
      },
    } = options;

    return await prisma.activityLog.findMany({
      where,
      orderBy,
      take,
      skip,
      cursor,
      include,
    });
  }

  // الحصول على عدد سجلات النشاط
  static async count(options = {}) {
    const { where = {} } = options;
    return await prisma.activityLog.count({ where });
  }

  // الحصول على سجلات نشاط المستخدم
  static async findByUserId(userId, options = {}) {
    return await this.findMany({
      where: { userId },
      ...options,
    });
  }

  // الحصول على سجلات نشاط المهمة
  static async findByTaskId(taskId, options = {}) {
    return await this.findMany({
      where: { taskId },
      ...options,
    });
  }

  // الحصول على سجلات نشاط اللوحة
  static async findByBoardId(boardId, options = {}) {
    return await this.findMany({
      where: { boardId },
      ...options,
    });
  }

  // الحصول على سجلات نشاط بنوع معين
  static async findByType(type, options = {}) {
    return await this.findMany({
      where: { type },
      ...options,
    });
  }

  // الحصول على سجلات نشاط في فترة زمنية
  static async findByDateRange(startDate, endDate, options = {}) {
    return await this.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      ...options,
    });
  }

  // تحديث سجل نشاط
  static async update(id, activityData) {
    return await prisma.activityLog.update({
      where: { id },
      data: activityData,
      include: {
        user: true,
        task: true,
        board: true,
      },
    });
  }

  // حذف سجل نشاط
  static async delete(id) {
    return await prisma.activityLog.delete({
      where: { id },
    });
  }

  // الحصول على إحصائيات النشاط
  static async getActivityStats(options = {}) {
    const { where = {}, groupBy = "type" } = options;

    return await prisma.activityLog.groupBy({
      by: [groupBy],
      where,
      _count: {
        [groupBy]: true,
      },
    });
  }

  // الحصول على أحدث النشاطات
  static async getRecentActivity(limit = 10) {
    return await this.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  // إنشاء سجل نشاط تلقائي
  static async logActivity(
    type,
    description,
    metadata = {},
    userId,
    taskId = null,
    boardId = null
  ) {
    try {
      return await this.create({
        type,
        description,
        metadata,
        userId,
        taskId,
        boardId,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }
}

module.exports = ActivityLog;

const prisma = require("../connection");

class Comment {
  // إنشاء تعليق جديد
  static async create(commentData) {
    return await prisma.comment.create({
      data: commentData,
      include: {
        user: true,
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });
  }

  // البحث عن تعليق بواسطة المعرف
  static async findById(id) {
    return await prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });
  }

  // الحصول على تعليقات مهمة معينة
  static async findByTaskId(taskId) {
    return await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: true,
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // الحصول على تعليقات المستخدم
  static async findByUserId(userId) {
    return await prisma.comment.findMany({
      where: { userId },
      include: {
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // تحديث محتوى التعليق
  static async update(id, content) {
    return await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: true,
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });
  }

  // حذف تعليق
  static async delete(id) {
    return await prisma.comment.delete({
      where: { id },
    });
  }

  // الحصول على عدد التعليقات في مهمة معينة
  static async getCountByTaskId(taskId) {
    return await prisma.comment.count({
      where: { taskId },
    });
  }

  // الحصول على أحدث التعليقات
  static async getRecent(limit = 10) {
    return await prisma.comment.findMany({
      include: {
        user: true,
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }
}

module.exports = Comment;

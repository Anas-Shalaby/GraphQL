const prisma = require("../connection");

class Board {
  // إنشاء لوحة جديدة
  static async create(boardData) {
    return await prisma.board.create({
      data: boardData,
      include: {
        members: {
          include: {
            user: true,
          },
        },
        columns: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  // البحث عن لوحة بواسطة المعرف
  static async findById(id) {
    return await prisma.board.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        columns: {
          orderBy: {
            order: "asc",
          },
          include: {
            tasks: {
              orderBy: {
                order: "asc",
              },
              include: {
                assignee: true,
                comments: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // الحصول على جميع اللوحات
  static async findAll() {
    return await prisma.board.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        columns: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  // الحصول على لوحات المستخدم
  static async findByUserId(userId) {
    return await prisma.board.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        columns: {
          include: {
            tasks: {
              include: {
                comments: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  // تحديث بيانات اللوحة
  static async update(id, boardData) {
    return await prisma.board.update({
      where: { id },
      data: boardData,
      include: {
        members: {
          include: {
            user: true,
          },
        },
        columns: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  // حذف لوحة
  static async delete(id) {
    return await prisma.board.delete({
      where: { id },
    });
  }

  // إضافة عضو إلى اللوحة
  static async addMember(boardId, userId, role = "MEMBER") {
    return await prisma.boardMember.create({
      data: {
        boardId,
        userId,
        role,
      },
      include: {
        user: true,
        board: true,
      },
    });
  }

  // إزالة عضو من اللوحة
  static async removeMember(boardId, userId) {
    return await prisma.boardMember.delete({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });
  }
}

module.exports = Board;

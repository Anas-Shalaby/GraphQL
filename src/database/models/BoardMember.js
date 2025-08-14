const prisma = require("../connection");

class BoardMember {
  // إنشاء عضو جديد في اللوحة
  static async create(memberData) {
    return await prisma.boardMember.create({
      data: memberData,
      include: {
        user: true,
        board: true,
      },
    });
  }

  // البحث عن عضو بواسطة المعرف
  static async findById(id) {
    return await prisma.boardMember.findUnique({
      where: { id },
      include: {
        user: true,
        board: true,
      },
    });
  }

  static async findByUserAndBoard(userId, boardId) {
    return await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
      include: {
        user: true,
        board: true,
      },
    });
  }

  // الحصول على جميع أعضاء لوحة معينة
  static async findByBoardId(boardId) {
    return await prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
    });
  }

  // الحصول على جميع اللوحات التي ينتمي إليها المستخدم
  static async findByUserId(userId) {
    return await prisma.boardMember.findMany({
      where: { userId },
      include: {
        board: {
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
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });
  }

  // تحديث دور العضو
  static async updateRole(userId, boardId, role) {
    return await prisma.boardMember.update({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
      data: { role },
      include: {
        user: true,
        board: true,
      },
    });
  }

  // حذف عضو من اللوحة
  static async delete(userId, boardId) {
    return await prisma.boardMember.delete({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });
  }

  // التحقق من صلاحيات المستخدم في اللوحة
  static async checkPermission(userId, boardId, requiredRole = "MEMBER") {
    const member = await this.findByUserAndBoard(userId, boardId);

    if (!member) {
      return false;
    }

    const roleHierarchy = {
      OWNER: 3,
      ADMIN: 2,
      MEMBER: 1,
    };

    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  }

  // الحصول على دور المستخدم في اللوحة
  static async getUserRole(userId, boardId) {
    const member = await this.findByUserAndBoard(userId, boardId);
    return member ? member.role : null;
  }

  // التحقق من وجود المستخدم في اللوحة
  static async isMember(userId, boardId) {
    const member = await this.findByUserAndBoard(userId, boardId);
    return !!member;
  }
}

module.exports = BoardMember;

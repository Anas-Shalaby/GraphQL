const prisma = require("../connection");

class Column {
  static async create(columnData) {
    return await prisma.column.create({
      data: columnData,
      include: {
        board: true,
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
    });
  }

  // البحث عن عمود بواسطة المعرف
  static async findById(id) {
    return await prisma.column.findUnique({
      where: { id },
      include: {
        board: true,
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
    });
  }

  // الحصول على أعمدة لوحة معينة
  static async findByBoardId(boardId) {
    return await prisma.column.findMany({
      where: { boardId },
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
    });
  }

  // تحديث بيانات العمود
  static async update(id, columnData) {
    return await prisma.column.update({
      where: { id },
      data: columnData,
      include: {
        board: true,
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
    });
  }

  // حذف عمود
  static async delete(id) {
    return await prisma.column.delete({
      where: { id },
    });
  }

  // إعادة ترتيب الأعمدة
  static async reorder(boardId, columnOrders) {
    const updates = columnOrders.map(({ id, order }) =>
      prisma.column.update({
        where: { id },
        data: { order },
      })
    );

    return await prisma.$transaction(updates);
  }

  // الحصول على أعلى ترتيب في لوحة معينة
  static async getMaxOrder(boardId) {
    const result = await prisma.column.findFirst({
      where: { boardId },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    return result ? result.order : 0;
  }
}

module.exports = Column;

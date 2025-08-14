const prisma = require("../connection");

class Task {
  // إنشاء مهمة جديدة
  static async create(taskData) {
    return await prisma.task.create({
      data: taskData,
      include: {
        column: {
          include: {
            board: true,
          },
        },
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  // البحث عن مهمة بواسطة المعرف
  static async findById(id) {
    return await prisma.task.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            board: true,
          },
        },
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  // الحصول على مهام عمود معين
  static async findByColumnId(columnId) {
    return await prisma.task.findMany({
      where: { columnId },
      orderBy: {
        order: "asc",
      },
      include: {
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  // الحصول على مهام المستخدم
  static async findByAssigneeId(assigneeId) {
    return await prisma.task.findMany({
      where: { assigneeId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  // تحديث بيانات المهمة
  static async update(id, taskData) {
    return await prisma.task.update({
      where: { id },
      data: taskData,
      include: {
        column: {
          include: {
            board: true,
          },
        },
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  // حذف مهمة
  static async delete(id) {
    return await prisma.task.delete({
      where: { id },
    });
  }

  // نقل مهمة إلى عمود آخر
  static async moveTask(taskId, columnId, order) {
    return await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId,
        order,
      },
      include: {
        column: {
          include: {
            board: true,
          },
        },
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  // إعادة ترتيب المهام في عمود معين
  static async reorderTasks(columnId, taskOrders) {
    const updates = taskOrders.map(({ id, order }) =>
      prisma.task.update({
        where: { id },
        data: { order },
      })
    );

    return await prisma.$transaction(updates);
  }

  // الحصول على أعلى ترتيب في عمود معين
  static async getMaxOrder(columnId) {
    const result = await prisma.task.findFirst({
      where: { columnId },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    return result ? result.order : 0;
  }
  static async taskAnalytics(boardId, dateFrom, dateTo) {
    try {
      // Build where clause for tasks
      const taskWhere = {};
      if (boardId) {
        taskWhere.column = { boardId };
      }

      // Get task counts
      const totalTasks = await prisma.task.count({ where: taskWhere });
      const completedTasks = await prisma.task.count({
        where: { ...taskWhere, status: "COMPLETED" },
      });
      const inProgressTasks = await prisma.task.count({
        where: { ...taskWhere, status: "IN_PROGRESS" },
      });
      const overdueTasks = await prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { lt: new Date() },
          status: { not: "COMPLETED" },
        },
      });

      // Get tasks by priority
      const taskByPriorityRaw = await prisma.task.groupBy({
        by: ["priority"],
        where: taskWhere,
        _count: { priority: true },
      });

      // Get tasks by status
      const taskByStatusRaw = await prisma.task.groupBy({
        by: ["status"],
        where: taskWhere,
        _count: { status: true },
      });

      // Get recent activity
      const recentActivity = await prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          task: true,
          board: true,
        },
      });

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        averageCompletionTime: null, // You can implement this calculation later
        taskByPriority: taskByPriorityRaw.map((item) => ({
          priority: item.priority,
          count: item._count.priority,
        })),
        taskByStatus: taskByStatusRaw.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        recentActivity,
      };
    } catch (error) {
      console.error("Error in taskAnalytics:", error);
      throw error;
    }
  }
  // البحث عن المهام
  static async search(query, boardId) {
    return await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            column: {
              boardId,
            },
          },
        ],
      },
      include: {
        column: {
          include: {
            board: true,
          },
        },
        assignee: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }
}

module.exports = Task;

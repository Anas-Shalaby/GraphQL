const { ActivityLog, User, Task, Board } = require("../../database/models");

const activityResolvers = {
  Query: {
    activityLogs: async (
      _,
      { first = 10, after, filter, orderBy },
      { user }
    ) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      try {
        // Build where clause based on filter
        const where = {};

        if (filter) {
          if (filter.type) where.type = filter.type;
          if (filter.userId) where.userId = filter.userId;
          if (filter.taskId) where.taskId = filter.taskId;
          if (filter.boardId) where.boardId = filter.boardId;
          if (filter.dateFrom || filter.dateTo) {
            where.createdAt = {};
            if (filter.dateFrom)
              where.createdAt.gte = new Date(filter.dateFrom);
            if (filter.dateTo) where.createdAt.lte = new Date(filter.dateTo);
          }
        }

        // Build orderBy clause
        let orderByClause = { createdAt: "desc" };
        if (orderBy) {
          switch (orderBy.field) {
            case "CREATED_AT":
              orderByClause = { createdAt: orderBy.direction.toLowerCase() };
              break;
            case "TYPE":
              orderByClause = { type: orderBy.direction.toLowerCase() };
              break;
            case "USER_NAME":
              orderByClause = {
                user: { name: orderBy.direction.toLowerCase() },
              };
              break;
          }
        }

        // Get total count
        const totalCount = await ActivityLog.count({ where });

        // Get activity logs with pagination
        const logs = await ActivityLog.findMany({
          where,
          orderBy: orderByClause,
          take: first + 1, // Take one extra to determine if there's a next page
          skip: after ? 1 : 0, // Skip the cursor if provided
          cursor: after ? { id: after } : undefined,
          include: {
            user: true,
            task: true,
            board: true,
          },
        });

        // Check if there's a next page
        const hasNextPage = logs.length > first;
        const edges = logs.slice(0, first).map((log) => ({
          node: log,
          cursor: log.id,
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage: !!after,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          },
          totalCount,
        };
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        throw new Error("حدث خطأ في جلب سجل النشاطات");
      }
    },

    taskAnalytics: async (_, { boardId, dateFrom, dateTo }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      try {
        return await Task.taskAnalytics(boardId, dateFrom, dateTo);
      } catch (error) {
        console.error("Error fetching task analytics:", error);
        throw new Error("حدث خطأ في جلب إحصائيات المهام");
      }
    },

    recentActivity: async (_, { limit = 10 }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      try {
        return await ActivityLog.getRecentActivity(limit);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        throw new Error("حدث خطأ في جلب النشاطات الأخيرة");
      }
    },

    userActivitySummary: async (_, { userId, period = "WEEK" }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const targetUserId = userId || user.id;

      try {
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();

        switch (period) {
          case "DAY":
            startDate.setDate(now.getDate() - 1);
            break;
          case "WEEK":
            startDate.setDate(now.getDate() - 7);
            break;
          case "MONTH":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "YEAR":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        // Get activity counts
        const totalActivities = await ActivityLog.count({
          where: {
            userId: targetUserId,
            createdAt: { gte: startDate },
          },
        });

        const tasksCreated = await ActivityLog.count({
          where: {
            userId: targetUserId,
            type: "TASK_CREATED",
            createdAt: { gte: startDate },
          },
        });

        const tasksCompleted = await ActivityLog.count({
          where: {
            userId: targetUserId,
            type: "TASK_COMPLETED",
            createdAt: { gte: startDate },
          },
        });

        const commentsAdded = await ActivityLog.count({
          where: {
            userId: targetUserId,
            type: "COMMENT_ADDED",
            createdAt: { gte: startDate },
          },
        });

        const boardsCreated = await ActivityLog.count({
          where: {
            userId: targetUserId,
            type: "BOARD_CREATED",
            createdAt: { gte: startDate },
          },
        });

        return {
          totalActivities,
          tasksCreated,
          tasksCompleted,
          commentsAdded,
          boardsCreated,
          activityByDay: [], // You can implement this with date grouping
          mostActiveBoards: [], // You can implement this with board grouping
          activityCount: [], // You can implement this with type grouping
        };
      } catch (error) {
        console.error("Error fetching user activity summary:", error);
        throw new Error("حدث خطأ في جلب ملخص نشاط المستخدم");
      }
    },
  },

  Mutation: {
    createActivityLog: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      try {
        const activityLog = await ActivityLog.create({
          ...input,
          userId: input.userId || user.id,
        });

        return activityLog;
      } catch (error) {
        console.error("Error creating activity log:", error);
        throw new Error("حدث خطأ في إنشاء سجل النشاط");
      }
    },

    exportActivityReport: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      try {
        // This is a placeholder implementation
        // You would typically generate a file and return a download URL
        return {
          downloadUrl: `/reports/activity-${Date.now()}.${input.format.toLowerCase()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          reportType: input.format,
        };
      } catch (error) {
        console.error("Error exporting activity report:", error);
        throw new Error("حدث خطأ في تصدير التقرير");
      }
    },
  },

  ActivityLog: {
    createdAt: (parent) => parent.createdAt.toISOString(),
    metadata: (parent) => parent.metadata || null,
  },
};

module.exports = activityResolvers;

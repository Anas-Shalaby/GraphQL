const { Task, Column, BoardMember } = require("../../database/models");

const taskResolvers = {
  Query: {
    // الحصول على مهمة بواسطة المعرف
    task: async (_, { id }, { user }) => {
      const task = await Task.findById(id);
      if (!task) {
        throw new Error("المهمة غير موجودة");
      }

      // التحقق من الصلاحيات
      const isMember = await BoardMember.isMember(
        user.id,
        task.column.board.id
      );
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذه المهمة");
      }

      return task;
    },

    // الحصول على مهام عمود معين
    columnTasks: async (_, { columnId }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const column = await Column.findById(columnId);
      if (!column) {
        throw new Error("العمود غير موجود");
      }

      const isMember = await BoardMember.isMember(user.id, column.board.id);
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذا العمود");
      }

      return await Task.findByColumnId(columnId);
    },

    // الحصول على مهام المستخدم
    myTasks: async (_, __, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      return await Task.findByAssigneeId(user.id);
    },

    // البحث في المهام
    searchTasks: async (_, { query, boardId }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const isMember = await BoardMember.isMember(user.id, boardId);
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذه اللوحة");
      }

      return await Task.search(query, boardId);
    },
    taskAnalytics: async (_, { boardId, dateFrom, dateTo }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      return await Task.taskAnalytics(boardId, dateFrom, dateTo);
    },
  },

  Mutation: {
    // إنشاء مهمة جديدة
    createTask: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const column = await Column.findById(input.columnId);
      if (!column) {
        throw new Error("العمود غير موجود");
      }

      // التحقق من الصلاحيات
      const isMember = await BoardMember.isMember(user.id, column.board.id);
      if (!isMember) {
        throw new Error("غير مصرح لك بإنشاء مهام في هذه اللوحة");
      }

      // الحصول على أعلى ترتيب
      const maxOrder = await Task.getMaxOrder(input.columnId);

      const taskData = {
        ...input,
        order: maxOrder + 1,
      };

      const task = await Task.create(taskData);

      return {
        task,
        message: "تم إنشاء المهمة بنجاح",
      };
    },

    // تحديث بيانات المهمة
    updateTask: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const task = await Task.findById(id);
      if (!task) {
        throw new Error("المهمة غير موجودة");
      }

      // التحقق من الصلاحيات
      const isMember = await BoardMember.isMember(
        user.id,
        task.column.board.id
      );
      if (!isMember) {
        throw new Error("غير مصرح لك بتحديث هذه المهمة");
      }

      // التحقق من أن المستخدم يمكنه تحديث المهمة (إما منسوب إليه أو مدير)
      const canUpdate =
        task.assigneeId === user.id ||
        (await BoardMember.checkPermission(
          user.id,
          task.column.board.id,
          "ADMIN"
        ));

      if (!canUpdate) {
        throw new Error("غير مصرح لك بتحديث هذه المهمة");
      }

      const updatedTask = await Task.update(id, input);

      return {
        task: updatedTask,
        message: "تم تحديث المهمة بنجاح",
      };
    },

    // حذف مهمة
    deleteTask: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const task = await Task.findById(id);
      if (!task) {
        throw new Error("المهمة غير موجودة");
      }

      // التحقق من الصلاحيات
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        task.column.board.id,
        "ADMIN"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بحذف هذه المهمة");
      }

      await Task.delete(id);
      return true;
    },

    // نقل مهمة إلى عمود آخر
    moveTask: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const task = await Task.findById(input.taskId);
      if (!task) {
        throw new Error("المهمة غير موجودة");
      }

      const targetColumn = await Column.findById(input.columnId);
      if (!targetColumn) {
        throw new Error("العمود الهدف غير موجود");
      }

      // التحقق من أن العمودين في نفس اللوحة
      if (task.column.board.id !== targetColumn.board.id) {
        throw new Error("لا يمكن نقل المهمة إلى لوحة أخرى");
      }

      // التحقق من الصلاحيات
      const isMember = await BoardMember.isMember(
        user.id,
        task.column.board.id
      );
      if (!isMember) {
        throw new Error("غير مصرح لك بنقل هذه المهمة");
      }

      const movedTask = await Task.moveTask(
        input.taskId,
        input.columnId,
        input.order
      );

      return {
        task: movedTask,
        message: "تم نقل المهمة بنجاح",
      };
    },

    // إعادة ترتيب المهام
    reorderTasks: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const column = await Column.findById(input.columnId);
      if (!column) {
        throw new Error("العمود غير موجود");
      }

      // التحقق من الصلاحيات
      const isMember = await BoardMember.isMember(user.id, column.board.id);
      if (!isMember) {
        throw new Error("غير مصرح لك بإعادة ترتيب المهام");
      }

      await Task.reorderTasks(input.columnId, input.taskOrders);

      return {
        success: true,
        message: "تم إعادة ترتيب المهام بنجاح",
      };
    },
    createActivityLog: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      return await ActivityLog.create(input);
    },
  },

  // Field resolvers
  Task: {
    // تحويل التواريخ إلى strings
    createdAt: (parent) => parent.createdAt.toISOString(),
    updatedAt: (parent) => parent.updatedAt.toISOString(),
    dueDate: (parent) => (parent.dueDate ? parent.dueDate.toISOString() : null),

    // التأكد من أن comments دائماً مصفوفة
    comments: (parent) => {
      return parent.comments || [];
    },
  },
};

module.exports = taskResolvers;

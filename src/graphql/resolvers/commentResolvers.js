const { Comment, Task, BoardMember } = require("../../database/models");

const commentResolvers = {
  Query: {
    comment: async (_, { id }, { user }) => {
      const comment = await Comment.findById(id);
      if (!comment) {
        throw new Error("التعليق غير موجود");
      }

      const isMember = await BoardMember.isMember(
        user.id,
        comment.task.column.board.id
      );
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذا التعليق");
      }

      return comment;
    },

    taskComments: async (_, { taskId }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("المهمة غير موجودة");
      }

      const isMember = await BoardMember.isMember(
        user.id,
        task.column.board.id
      );
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذه المهمة");
      }

      return await Comment.findByTaskId(taskId);
    },
  },

  Mutation: {
    createComment: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const task = await Task.findById(input.taskId);
      if (!task) {
        throw new Error("المهمة غير موجودة");
      }

      const isMember = await BoardMember.isMember(
        user.id,
        task.column.board.id
      );
      if (!isMember) {
        throw new Error("غير مصرح لك بإضافة تعليقات لهذه المهمة");
      }

      const commentData = {
        ...input,
        userId: user.id,
      };

      const comment = await Comment.create(commentData);

      return {
        comment,
        message: "تم إضافة التعليق بنجاح",
      };
    },

    updateComment: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new Error("التعليق غير موجود");
      }

      // التحقق من أن المستخدم هو صاحب التعليق أو مدير
      const canUpdate =
        comment.user.id === user.id ||
        (await BoardMember.checkPermission(
          user.id,
          comment.task.column.board.id,
          "ADMIN"
        ));

      if (!canUpdate) {
        throw new Error("غير مصرح لك بتحديث هذا التعليق");
      }

      const updatedComment = await Comment.update(id, input.content);

      return {
        comment: updatedComment,
        message: "تم تحديث التعليق بنجاح",
      };
    },

    deleteComment: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new Error("التعليق غير موجود");
      }

      const canDelete =
        comment.user.id === user.id ||
        (await BoardMember.checkPermission(
          user.id,
          comment.task.column.board.id,
          "ADMIN"
        ));

      if (!canDelete) {
        throw new Error("غير مصرح لك بحذف هذا التعليق");
      }

      await Comment.delete(id);
      return true;
    },
    createActivityLog: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      return await ActivityLog.create(input);
    },
  },

  // Field resolvers
  Comment: {
    // تحويل التواريخ إلى strings
    createdAt: (parent) => parent.createdAt.toISOString(),
    updatedAt: (parent) => parent.updatedAt.toISOString(),
  },
};

module.exports = commentResolvers;

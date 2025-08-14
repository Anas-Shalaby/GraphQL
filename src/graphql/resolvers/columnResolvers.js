const { Column, Board, BoardMember } = require("../../database/models");

const columnResolvers = {
  Query: {
    // الحصول على عمود بواسطة المعرف
    column: async (_, { id }, { user }) => {
      const column = await Column.findById(id);
      if (!column) {
        throw new Error("العمود غير موجود");
      }

      // التحقق من الصلاحيات
      const isMember = await BoardMember.isMember(user.id, column.board.id);
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذا العمود");
      }

      return column;
    },

    // الحصول على أعمدة لوحة معينة
    boardColumns: async (_, { boardId }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const isMember = await BoardMember.isMember(user.id, boardId);
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذه اللوحة");
      }

      return await Column.findByBoardId(boardId);
    },
  },

  Mutation: {
    // إنشاء عمود جديد
    createColumn: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      // التحقق من الصلاحيات
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        input.boardId,
        "ADMIN"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بإنشاء أعمدة في هذه اللوحة");
      }

      // الحصول على أعلى ترتيب
      const maxOrder = await Column.getMaxOrder(input.boardId);

      const columnData = {
        ...input,
        order: maxOrder + 1,
      };

      return await Column.create(columnData);
    },

    // تحديث بيانات العمود
    updateColumn: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const column = await Column.findById(id);
      if (!column) {
        throw new Error("العمود غير موجود");
      }

      // التحقق من الصلاحيات
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        column.board.id,
        "ADMIN"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بتحديث هذا العمود");
      }

      return await Column.update(id, input);
    },

    // حذف عمود
    deleteColumn: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const column = await Column.findById(id);
      if (!column) {
        throw new Error("العمود غير موجود");
      }

      // التحقق من الصلاحيات
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        column.board.id,
        "ADMIN"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بحذف هذا العمود");
      }

      // التحقق من وجود مهام في العمود
      if (column.tasks && column.tasks.length > 0) {
        throw new Error("لا يمكن حذف عمود يحتوي على مهام");
      }

      await Column.delete(id);
      return true;
    },

    // إعادة ترتيب الأعمدة
    reorderColumns: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      // التحقق من الصلاحيات
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        input.boardId,
        "ADMIN"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بإعادة ترتيب الأعمدة");
      }

      await Column.reorder(input.boardId, input.columnOrders);

      return {
        success: true,
        message: "تم إعادة ترتيب الأعمدة بنجاح",
      };
    },
  },

  // Field resolvers
  Column: {
    // تحويل التواريخ إلى strings
    createdAt: (parent) => parent.createdAt.toISOString(),
    updatedAt: (parent) => parent.updatedAt.toISOString(),

    // التأكد من أن tasks دائماً مصفوفة
    tasks: (parent) => {
      return parent.tasks || [];
    },
  },
};

module.exports = columnResolvers;

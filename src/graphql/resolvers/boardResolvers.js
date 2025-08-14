const { Board, BoardMember, ActivityLog } = require("../../database/models");

const boardResolvers = {
  Query: {
    // الحصول على لوحة بواسطة المعرف
    board: async (_, { id }, { user }) => {
      const board = await Board.findById(id);
      if (!board) {
        throw new Error("اللوحة غير موجودة");
      }

      // التحقق من الصلاحيات إذا لم تكن اللوحة عامة
      if (!board.isPublic) {
        if (!user) {
          throw new Error("غير مصرح لك بالوصول لهذه اللوحة");
        }

        const isMember = await BoardMember.isMember(user.id, id);
        if (!isMember) {
          throw new Error("غير مصرح لك بالوصول لهذه اللوحة");
        }
      }

      return board;
    },

    // الحصول على جميع اللوحات
    boards: async (_, __, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }
      return await Board.findByUserId(user.id);
    },

    // الحصول على لوحات المستخدم
    myBoards: async (_, __, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }
      return await Board.findByUserId(user.id);
    },

    // الحصول على اللوحات العامة
    publicBoards: async () => {
      return await Board.findAll().then((boards) =>
        boards.filter((board) => board.isPublic)
      );
    },

    // الحصول على أعضاء لوحة معينة
    boardMembers: async (_, { boardId }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const isMember = await BoardMember.isMember(user.id, boardId);
      if (!isMember) {
        throw new Error("غير مصرح لك بالوصول لهذه اللوحة");
      }

      return await BoardMember.findByBoardId(boardId);
    },

    // التحقق من صلاحيات المستخدم
    checkPermission: async (_, { boardId, requiredRole }, { user }) => {
      if (!user) {
        return false;
      }

      return await BoardMember.checkPermission(user.id, boardId, requiredRole);
    },
  },

  Mutation: {
    // إنشاء لوحة جديدة
    createBoard: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      const board = await Board.create(input);

      // إضافة المستخدم كمالك للوحة
      await Board.addMember(board.id, user.id, "OWNER");

      return {
        board,
        message: "تم إنشاء اللوحة بنجاح",
      };
    },

    // تحديث بيانات اللوحة
    updateBoard: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      // التحقق من الصلاحيات
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        id,
        "ADMIN"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بتحديث هذه اللوحة");
      }

      const board = await Board.update(id, input);
      if (!board) {
        throw new Error("اللوحة غير موجودة");
      }

      return {
        board,
        message: "تم تحديث اللوحة بنجاح",
      };
    },

    // حذف لوحة
    deleteBoard: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      // التحقق من الصلاحيات (فقط المالك يمكنه الحذف)
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        id,
        "OWNER"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بحذف هذه اللوحة");
      }

      const deleted = await Board.delete(id);
      if (!deleted) {
        throw new Error("اللوحة غير موجودة");
      }

      return true;
    },

    // إضافة عضو إلى اللوحة
    addMember: async (_, { input }, { user }) => {
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
        throw new Error("غير مصرح لك بإضافة أعضاء لهذه اللوحة");
      }

      const member = await Board.addMember(
        input.boardId,
        input.userId,
        input.role || "MEMBER"
      );

      return {
        member,
        message: "تم إضافة العضو بنجاح",
      };
    },

    // تحديث دور العضو
    updateMemberRole: async (_, { input }, { user }) => {
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
        throw new Error("غير مصرح لك بتحديث أدوار الأعضاء");
      }

      const member = await BoardMember.updateRole(
        input.userId,
        input.boardId,
        input.role
      );

      return {
        member,
        message: "تم تحديث دور العضو بنجاح",
      };
    },

    // إزالة عضو من اللوحة
    removeMember: async (_, { boardId, userId }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      // التحقق من الصلاحيات
      const hasPermission = await BoardMember.checkPermission(
        user.id,
        boardId,
        "ADMIN"
      );
      if (!hasPermission) {
        throw new Error("غير مصرح لك بإزالة الأعضاء من هذه اللوحة");
      }

      // لا يمكن للمستخدم إزالة نفسه إذا كان المالك الوحيد
      if (userId === user.id) {
        const members = await BoardMember.findByBoardId(boardId);
        const owners = members.filter((m) => m.role === "OWNER");
        if (owners.length === 1) {
          throw new Error("لا يمكن إزالة المالك الوحيد من اللوحة");
        }
      }

      await Board.removeMember(boardId, userId);

      return true;
    },
    createActivityLog: async (
      _,
      { type, description, createdAt, userId, taskId, boardId, metadata },
      { user }
    ) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      return await ActivityLog.create(
        type,
        description,
        createdAt,
        userId,
        taskId,
        boardId,
        metadata
      );
    },
  },

  // Field resolvers
  Board: {
    // تحويل التواريخ إلى strings
    createdAt: (parent) => parent.createdAt.toISOString(),
    updatedAt: (parent) => parent.updatedAt.toISOString(),

    // التأكد من أن columns دائماً مصفوفة
    columns: (parent) => {
      return parent.columns || [];
    },

    // التأكد من أن members دائماً مصفوفة
    members: (parent) => {
      return parent.members || [];
    },
  },

  BoardMember: {
    // تحويل التواريخ إلى strings
    joinedAt: (parent) => parent.joinedAt.toISOString(),
  },
};

module.exports = boardResolvers;

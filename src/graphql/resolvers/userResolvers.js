const { User } = require("../../database/models");

const userResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }
      return await User.findById(user.id);
    },

    user: async (_, { id }) => {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("المستخدم غير موجود");
      }
      return user;
    },

    users: async () => {
      return await User.findAll();
    },
  },

  Mutation: {
    createUser: async (_, { input }) => {
      const existingUser = await User.findByEmail(input.email);
      if (existingUser) {
        throw new Error("البريد الإلكتروني مستخدم بالفعل");
      }

      return await User.create(input);
    },

    updateUser: async (_, { id, input }, { user }) => {
      if (!user || user.id !== id) {
        throw new Error("غير مصرح لك بتحديث هذا المستخدم");
      }

      const updatedUser = await User.update(id, input);
      if (!updatedUser) {
        throw new Error("المستخدم غير موجود");
      }

      return updatedUser;
    },

    deleteUser: async (_, { id }, { user }) => {
      if (!user || user.id !== id) {
        throw new Error("غير مصرح لك بحذف هذا المستخدم");
      }

      const deleted = await User.delete(id);
      if (!deleted) {
        throw new Error("المستخدم غير موجود");
      }

      return true;
    },
  },

  User: {
    createdAt: (parent) => parent.createdAt.toISOString(),
    updatedAt: (parent) => parent.updatedAt.toISOString(),

    boards: (parent) => {
      return parent.boards || [];
    },

    tasks: (parent) => {
      return parent.tasks || [];
    },

    comments: (parent) => {
      return parent.comments || [];
    },
  },
};

module.exports = userResolvers;

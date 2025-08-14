const AuthService = require("../../services/authService");

const authResolvers = {
  Mutation: {
    register: async (_, { input }) => {
      try {
        const result = await AuthService.register(input);
        return {
          user: result.user,
          token: result.token,
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },

    login: async (_, { input }) => {
      try {
        const result = await AuthService.login(input.email, input.password);
        return {
          user: result.user,
          token: result.token,
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },

    changePassword: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("غير مصرح لك بالوصول");
      }

      try {
        await AuthService.changePassword(
          user.id,
          input.currentPassword,
          input.newPassword
        );
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

module.exports = authResolvers;

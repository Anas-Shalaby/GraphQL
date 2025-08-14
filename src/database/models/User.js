const prisma = require("../connection");

class User {
  static async create(userData) {
    return await prisma.user.create({
      data: userData,
    });
  }

  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        boards: {
          include: {
            board: true,
          },
        },
        tasks: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });
  }

  static async update(id, userData) {
    return await prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  static async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  static async findAll() {
    return await prisma.user.findMany({
      include: {
        boards: {
          include: {
            board: true,
          },
        },
      },
    });
  }
}

module.exports = User;

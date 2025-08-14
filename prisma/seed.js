const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("بدء ملء قاعدة البيانات بالبيانات التجريبية...");

  // تشفير كلمة المرور الافتراضية
  const hashedPassword = await bcrypt.hash("123456", 12);

  // إنشاء مستخدمين تجريبيين
  const user1 = await prisma.user.upsert({
    where: { email: "ahmed@example.com" },
    update: {},
    create: {
      email: "ahmed@example.com",
      password: hashedPassword,
      name: "أحمد محمد",
      avatar:
        "https://ui-avatars.com/api/?name=أحمد+محمد&background=3B82F6&color=fff",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "fatima@example.com" },
    update: {},
    create: {
      email: "fatima@example.com",
      password: hashedPassword,
      name: "فاطمة علي",
      avatar:
        "https://ui-avatars.com/api/?name=فاطمة+علي&background=10B981&color=fff",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "omar@example.com" },
    update: {},
    create: {
      email: "omar@example.com",
      password: hashedPassword,
      name: "عمر حسن",
      avatar:
        "https://ui-avatars.com/api/?name=عمر+حسن&background=F59E0B&color=fff",
    },
  });

  console.log("تم إنشاء المستخدمين:", {
    user1: user1.name,
    user2: user2.name,
    user3: user3.name,
  });

  // إنشاء لوحة تجريبية
  const board = await prisma.board.create({
    data: {
      title: "مشروع تطوير الموقع",
      description: "لوحة لإدارة مهام تطوير الموقع الجديد",
      color: "#3B82F6",
      isPublic: false,
      members: {
        create: [
          { userId: user1.id, role: "OWNER" },
          { userId: user2.id, role: "ADMIN" },
          { userId: user3.id, role: "MEMBER" },
        ],
      },
      columns: {
        create: [
          { title: "المهام الجديدة", order: 1, color: "#6B7280" },
          { title: "قيد التنفيذ", order: 2, color: "#F59E0B" },
          { title: "قيد المراجعة", order: 3, color: "#8B5CF6" },
          { title: "مكتمل", order: 4, color: "#10B981" },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      columns: true,
    },
  });

  console.log("تم إنشاء اللوحة:", board.title);

  // الحصول على الأعمدة المنشأة
  const columns = await prisma.column.findMany({
    where: { boardId: board.id },
    orderBy: { order: "asc" },
  });

  // إنشاء مهام تجريبية
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "تصميم واجهة المستخدم",
        description: "تصميم واجهة المستخدم الرئيسية للموقع",
        priority: "HIGH",
        order: 1,
        columnId: columns[0].id, // المهام الجديدة
        assigneeId: user1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "تطوير قاعدة البيانات",
        description: "إنشاء وتصميم قاعدة البيانات للمشروع",
        priority: "URGENT",
        order: 2,
        columnId: columns[0].id, // المهام الجديدة
        assigneeId: user2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "برمجة الواجهة الأمامية",
        description: "تطوير الواجهة الأمامية باستخدام React",
        priority: "HIGH",
        order: 1,
        columnId: columns[1].id, // قيد التنفيذ
        assigneeId: user1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "اختبار الوظائف",
        description: "إجراء اختبارات شاملة للوظائف الجديدة",
        priority: "MEDIUM",
        order: 1,
        columnId: columns[2].id, // قيد المراجعة
        assigneeId: user3.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "إعداد الخادم",
        description: "إعداد وإعداد الخادم للإنتاج",
        priority: "LOW",
        order: 1,
        columnId: columns[3].id, // مكتمل
        assigneeId: user2.id,
      },
    }),
  ]);

  console.log("تم إنشاء المهام:", tasks.length);

  // إنشاء تعليقات تجريبية
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content: "تم البدء في العمل على التصميم",
        taskId: tasks[0].id,
        userId: user1.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "أحتاج إلى مزيد من التفاصيل حول المتطلبات",
        taskId: tasks[0].id,
        userId: user2.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "تم الانتهاء من قاعدة البيانات بنجاح",
        taskId: tasks[1].id,
        userId: user2.id,
      },
    }),
  ]);

  console.log("تم إنشاء التعليقات:", comments.length);

  console.log("تم ملء قاعدة البيانات بنجاح! 🎉");
}

main()
  .catch((e) => {
    console.error("خطأ في ملء قاعدة البيانات:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

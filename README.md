# Mini Team Kanban Board API

تطبيق API لإدارة لوحات Kanban للفرق الصغيرة باستخدام GraphQL و Prisma.

## المميزات

- إدارة المستخدمين والفرق
- إنشاء وإدارة لوحات Kanban
- إدارة المهام والأعمدة
- نظام التعليقات
- نظام الصلاحيات (مالك، مدير، عضو)
- البحث في المهام
- إعادة ترتيب المهام والأعمدة

## التقنيات المستخدمة

- **GraphQL** - للـ API
- **Prisma** - ORM لقاعدة البيانات
- **PostgreSQL** - قاعدة البيانات
- **Express** - خادم الويب
- **Apollo Server** - خادم GraphQL

## إعداد المشروع

### 1. تثبيت المتطلبات

```bash
npm install
```

### 2. إعداد قاعدة البيانات

أولاً، تأكد من تشغيل PostgreSQL على جهازك، ثم قم بإنشاء قاعدة بيانات جديدة.

### 3. إعداد متغيرات البيئة

انسخ ملف `env.example` إلى `.env` وقم بتحديث القيم:

```bash
cp env.example .env
```

ثم قم بتحديث القيم في ملف `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/kanban_board?schema=public"
PORT=4000
NODE_ENV=development

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
```

### 4. إنشاء قاعدة البيانات

```bash
# إنشاء جداول قاعدة البيانات
npm run db:push

# أو استخدام الـ migrations
npm run db:migrate
```

### 5. توليد Prisma Client

```bash
npm run db:generate
```

### 6. ملء قاعدة البيانات ببيانات تجريبية

```bash
npm run db:seed
```

### 7. تشغيل الخادم

```bash
npm run dev
```

## هيكل قاعدة البيانات

### النماذج الرئيسية

1. **User** - المستخدمين
2. **Board** - لوحات Kanban
3. **BoardMember** - أعضاء اللوحات
4. **Column** - أعمدة اللوحات
5. **Task** - المهام
6. **Comment** - التعليقات

### العلاقات

- المستخدم يمكن أن يكون عضو في عدة لوحات
- اللوحة تحتوي على عدة أعمدة
- العمود يحتوي على عدة مهام
- المهمة يمكن أن يكون لها تعليقات
- المهمة يمكن أن يكون لها منسوب إليها

## الأدوار والصلاحيات

- **OWNER** - مالك اللوحة (أعلى صلاحيات)
- **ADMIN** - مدير اللوحة (يمكن إدارة الأعضاء والمهام)
- **MEMBER** - عضو عادي (يمكن إدارة المهام المنسوبة إليه)

## أوامر مفيدة

```bash
# تشغيل Prisma Studio (واجهة قاعدة البيانات)
npm run db:studio

# إنشاء migration جديد
npx prisma migrate dev --name migration_name

# إعادة تعيين قاعدة البيانات
npx prisma migrate reset

# عرض حالة قاعدة البيانات
npx prisma db pull
```

## البيانات التجريبية

بعد تشغيل `npm run db:seed`، ستجد:

- 3 مستخدمين تجريبيين
- لوحة واحدة مع 4 أعمدة
- 5 مهام تجريبية
- 3 تعليقات تجريبية

### بيانات تسجيل الدخول التجريبية

- **أحمد محمد**: ahmed@example.com / 123456
- **فاطمة علي**: fatima@example.com / 123456
- **عمر حسن**: omar@example.com / 123456

## GraphQL API

تم إنشاء GraphQL API كامل مع جميع العمليات المطلوبة:

### الاستعلامات المتاحة (Queries)

- **المستخدمين**: `users`, `user(id)`, `me`
- **اللوحات**: `boards`, `board(id)`, `myBoards`, `publicBoards`
- **الأعمدة**: `column(id)`, `boardColumns(boardId)`
- **المهام**: `task(id)`, `columnTasks(columnId)`, `myTasks`, `searchTasks`
- **التعليقات**: `comment(id)`, `taskComments(taskId)`
- **الأعضاء**: `boardMembers(boardId)`, `checkPermission`

### الطفرات المتاحة (Mutations)

- **المصادقة**: `register`, `login`, `changePassword`
- **المستخدمين**: `createUser`, `updateUser`, `deleteUser`
- **اللوحات**: `createBoard`, `updateBoard`, `deleteBoard`
- **الأعضاء**: `addMember`, `updateMemberRole`, `removeMember`
- **الأعمدة**: `createColumn`, `updateColumn`, `deleteColumn`, `reorderColumns`
- **المهام**: `createTask`, `updateTask`, `deleteTask`, `moveTask`, `reorderTasks`
- **التعليقات**: `createComment`, `updateComment`, `deleteComment`

### اختبار API

```bash
# تشغيل الخادم
npm run dev

# تشغيل GraphQL Playground
npm run playground
```

ثم افتح المتصفح على:

- **الخادم الرئيسي**: http://localhost:4000/graphql
- **GraphQL Playground**: http://localhost:4001

### أمثلة الاستعلامات

راجع الملفات التالية للحصول على أمثلة شاملة:

- `examples/queries.graphql` - أمثلة عامة للاستعلامات والطفرات
- `examples/auth-queries.graphql` - أمثلة خاصة بالمصادقة

### كيفية استخدام المصادقة

1. **تسجيل الدخول**:

   ```graphql
   mutation {
     login(input: { email: "ahmed@example.com", password: "123456" }) {
       user {
         id
         name
         email
       }
       token
     }
   }
   ```

2. **استخدام Token**:
   أضف الـ token إلى HTTP Headers في GraphQL Playground:
   ```json
   {
     "Authorization": "Bearer YOUR_TOKEN_HERE"
   }
   ```

## الترخيص

MIT License

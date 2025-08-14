const { gql } = require("graphql-tag");

const types = gql`
  scalar JSON

  enum Role {
    OWNER
    ADMIN
    MEMBER
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    COMPLETED
  }

  enum ActivityType {
    TASK_CREATED
    TASK_UPDATED
    TASK_MOVED
    TASK_ASSIGNED
    TASK_COMPLETED
    TASK_DELETED
    COMMENT_ADDED
    BOARD_CREATED
    MEMBER_ADDED
    MEMBER_REMOVED
  }

  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    createdAt: String!
    updatedAt: String!
    boards: [BoardMember!]!
    tasks: [Task!]!
    comments: [Comment!]!
  }

  type Board {
    id: ID!
    title: String!
    description: String
    color: String!
    isPublic: Boolean!
    createdAt: String!
    updatedAt: String!
    members: [BoardMember!]!
    columns: [Column!]!
  }

  type BoardMember {
    id: ID!
    role: Role!
    joinedAt: String!
    user: User!
    board: Board!
  }

  type Column {
    id: ID!
    title: String!
    order: Int!
    color: String!
    createdAt: String!
    updatedAt: String!
    board: Board!
    tasks: [Task!]!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    priority: Priority!
    status: TaskStatus!
    dueDate: String
    order: Int!
    createdAt: String!
    updatedAt: String!
    column: Column!
    assignee: User
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    content: String!
    createdAt: String!
    updatedAt: String!
    task: Task!
    user: User!
  }

  type ActivityLog {
    id: ID!
    type: ActivityType!
    description: String!
    metadata: JSON
    createdAt: String!
    user: User!
    task: Task
    board: Board
  }
  type TaskAnalytics {
    totalTasks: Int!
    completedTasks: Int!
    inProgressTasks: Int!
    overdueTasks: Int!
    averageCompletionTime: Float
    taskByPriority: [PriorityCount!]!
    taskByStatus: [StatusCount!]!
    recentActivity: [ActivityLog!]!
  }

  type PriorityCount {
    priority: Priority!
    count: Int!
  }

  type StatusCount {
    status: TaskStatus!
    count: Int!
  }

  type ActivityLogConnection {
    edges: [ActivityLogEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }
  type ActivityLogEdge {
    node: ActivityLog!
    cursor: String!
  }
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  enum ActivityPeriod {
    DAY
    WEEK
    MONTH
    YEAR
  }
  type UserActivitySummary {
    totalActivities: Int!
    tasksCreated: Int!
    tasksCompleted: Int!
    commentsAdded: Int!
    boardsCreated: Int!
    activityByDay: [ActivityByDay!]!
    mostActiveBoards: [Board!]!
    activityCount: [ActivityCount!]!
  }
  type ExportReport {
    downloadUrl: String!
    expiresAt: String!
    reportType: ExportFormat!
  }
  type ActivityByDay {
    date: String!
    count: Int!
  }

  type ActivityCount {
    type: ActivityType!
    count: Int!
  }

  input CreateActivityLogInput {
    type: ActivityType!
    description: String!
    createdAt: String
    userId: ID
    taskId: ID
    boardId: ID
    metadata: JSON
  }

  input ActivityLogFilter {
    type: ActivityType
    userId: ID
    taskId: ID
    boardId: ID
    dateFrom: String
    dateTo: String
  }

  input ExportReportInput {
    startDate: String!
    endDate: String!
    userId: ID
    boardId: ID
    type: ActivityType
    format: ExportFormat!
  }

  enum ExportFormat {
    CSV
    EXCEL
  }
  type ExportReport {
    filename: String!
  }

  input ActivityLogOrderBy {
    field: ActivityLogOrderField!
    direction: OrderDirection!
  }

  enum ActivityLogOrderField {
    CREATED_AT
    TYPE
    USER_NAME
  }
  enum OrderDirection {
    ASC
    DESC
  }
  input CreateUserInput {
    email: String!
    password: String!
    name: String!
    avatar: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input CreateBoardInput {
    title: String!
    description: String
    color: String
    isPublic: Boolean
  }

  input CreateColumnInput {
    title: String!
    color: String
    boardId: ID!
  }

  input CreateTaskInput {
    title: String!
    description: String
    priority: Priority
    status: TaskStatus
    dueDate: String
    columnId: ID!
    assigneeId: ID
  }

  input CreateCommentInput {
    content: String!
    taskId: ID!
  }

  input UpdateUserInput {
    name: String
    avatar: String
  }

  input UpdateBoardInput {
    title: String
    description: String
    color: String
    isPublic: Boolean
  }

  input UpdateColumnInput {
    title: String
    color: String
    order: Int
  }

  input UpdateTaskInput {
    title: String
    description: String
    priority: Priority
    status: TaskStatus
    dueDate: String
    assigneeId: ID
  }

  input UpdateCommentInput {
    content: String!
  }

  input ReorderColumnsInput {
    boardId: ID!
    columnOrders: [ColumnOrderInput!]!
  }

  input ColumnOrderInput {
    id: ID!
    order: Int!
  }

  input ReorderTasksInput {
    columnId: ID!
    taskOrders: [TaskOrderInput!]!
  }

  input TaskOrderInput {
    id: ID!
    order: Int!
  }

  input MoveTaskInput {
    taskId: ID!
    columnId: ID!
    order: Int!
  }

  input AddMemberInput {
    boardId: ID!
    userId: ID!
    role: Role
  }

  input UpdateMemberRoleInput {
    boardId: ID!
    userId: ID!
    role: Role!
  }

  type AuthResponse {
    user: User!
    token: String!
  }

  type BoardResponse {
    board: Board!
    message: String!
  }

  type TaskResponse {
    task: Task!
    message: String!
  }

  type CommentResponse {
    comment: Comment!
    message: String!
  }

  type ReorderResponse {
    success: Boolean!
    message: String!
  }

  type MemberResponse {
    member: BoardMember!
    message: String!
  }

  type Query {
    me: User
    user(id: ID!): User
    users: [User!]!

    board(id: ID!): Board
    boards: [Board!]!
    myBoards: [Board!]!
    publicBoards: [Board!]!

    column(id: ID!): Column
    boardColumns(boardId: ID!): [Column!]!

    task(id: ID!): Task
    columnTasks(columnId: ID!): [Task!]!
    myTasks: [Task!]!
    searchTasks(query: String!, boardId: ID!): [Task!]!

    comment(id: ID!): Comment
    taskComments(taskId: ID!): [Comment!]!

    boardMembers(boardId: ID!): [BoardMember!]!
    checkPermission(boardId: ID!, requiredRole: Role): Boolean!

    activityLogs(
      first: Int
      after: String
      filter: ActivityLogFilter
      orderBy: ActivityLogOrderBy
    ): ActivityLogConnection!

    taskAnalytics(boardId: ID, dateFrom: String, dateTo: String): TaskAnalytics!
    userActivitySummary(
      userId: ID
      period: ActivityPeriod
    ): UserActivitySummary!
    recentActivity(limit: Int): [ActivityLog!]!
  }

  type Mutation {
    register(input: CreateUserInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    changePassword(input: ChangePasswordInput!): Boolean!

    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    createBoard(input: CreateBoardInput!): BoardResponse!
    updateBoard(id: ID!, input: UpdateBoardInput!): BoardResponse!
    deleteBoard(id: ID!): Boolean!

    createColumn(input: CreateColumnInput!): Column!
    updateColumn(id: ID!, input: UpdateColumnInput!): Column!
    deleteColumn(id: ID!): Boolean!
    reorderColumns(input: ReorderColumnsInput!): ReorderResponse!

    createTask(input: CreateTaskInput!): TaskResponse!
    updateTask(id: ID!, input: UpdateTaskInput!): TaskResponse!
    deleteTask(id: ID!): Boolean!
    moveTask(input: MoveTaskInput!): TaskResponse!
    reorderTasks(input: ReorderTasksInput!): ReorderResponse!

    createComment(input: CreateCommentInput!): CommentResponse!
    updateComment(id: ID!, input: UpdateCommentInput!): CommentResponse!
    deleteComment(id: ID!): Boolean!

    addMember(input: AddMemberInput!): MemberResponse!
    updateMemberRole(input: UpdateMemberRoleInput!): MemberResponse!
    removeMember(boardId: ID!, userId: ID!): Boolean!
    createActivityLog(input: CreateActivityLogInput!): ActivityLog!
    exportActivityReport(input: ExportReportInput!): ExportReport!
  }
`;

module.exports = types;

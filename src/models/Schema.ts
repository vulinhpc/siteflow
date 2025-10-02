import {
  bigint,
  boolean,
  date,
  decimal,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'in_progress',
  'on_hold',
  'completed',
]);

export const taskStatusEnum = pgEnum('task_status', [
  'WAITING',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
]);

export const logTaskStatusEnum = pgEnum('log_task_status', [
  'WAITING',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
]);

export const mediaKindEnum = pgEnum('media_kind', [
  'IMAGE',
  'VIDEO',
  'DOCUMENT',
  'AUDIO',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'ADVANCE',
  'EXPENSE',
]);

export const costTypeEnum = pgEnum('cost_type', [
  'MATERIAL',
  'LABOR',
  'EQUIPMENT',
  'OTHER',
]);

export const dailyLogStatusEnum = pgEnum('daily_log_status', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'DECLINED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PARTIAL',
  'PAID',
]);

export const roleEnum = pgEnum('role_enum', [
  'OWNER',
  'ADMIN',
  'PM',
  'ENGINEER',
  'ACCOUNTANT',
  'VIEWER',
]);

// ============================================================================
// ORGANIZATION (giữ nguyên từ boilerplate)
// ============================================================================

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
      slugIdx: uniqueIndex('organization_slug_idx').on(table.slug),
    };
  },
);

// ============================================================================
// USERS (RBAC)
// ============================================================================

export const usersSchema = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: text('clerk_user_id').notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    displayName: varchar('display_name', { length: 255 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => {
    return {
      clerkUserIdIdx: uniqueIndex('users_clerk_user_id_idx').on(
        table.clerkUserId,
      ),
      emailIdx: index('users_email_idx').on(table.email),
    };
  },
);

// ============================================================================
// MEMBERSHIPS (RBAC)
// ============================================================================

export const membershipsSchema = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersSchema.id, { onDelete: 'cascade' }),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => {
    return {
      userOrgIdx: uniqueIndex('memberships_user_org_idx').on(
        table.userId,
        table.orgId,
      ),
      userIdIdx: index('memberships_user_id_idx').on(table.userId),
      orgIdIdx: index('memberships_org_id_idx').on(table.orgId),
      roleIdx: index('memberships_role_idx').on(table.role),
    };
  },
);

// ============================================================================
// PROJECTS
// ============================================================================

export const projectsSchema = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    status: projectStatusEnum('status').notNull().default('planning'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    budgetTotal: decimal('budget_total', { precision: 15, scale: 2 }),
    currency: text('currency').notNull().default('VND'),
    description: text('description'),
    thumbnailUrl: text('thumbnail_url'),
    address: text('address'),
    scale: json('scale'),
    investorName: text('investor_name'),
    investorPhone: text('investor_phone'),
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      orgIdIdx: index('projects_org_id_idx').on(table.orgId),
      statusIdx: index('projects_status_idx').on(table.status),
      createdAtIdx: index('projects_created_at_idx').on(table.createdAt),
    };
  },
);

// ============================================================================
// PROJECT MEMBERS
// ============================================================================

export const projectMembersSchema = pgTable(
  'project_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsSchema.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(), // Clerk user ID
    role: text('role').notNull(), // Flexible role: manager, engineer, accountant, etc.
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      projectUserRoleIdx: uniqueIndex(
        'project_members_project_user_role_idx',
      ).on(table.projectId, table.userId, table.role),
      projectIdIdx: index('project_members_project_id_idx').on(table.projectId),
      userIdIdx: index('project_members_user_id_idx').on(table.userId),
      roleIdx: index('project_members_role_idx').on(table.role),
    };
  },
);

// ============================================================================
// CATEGORIES (Hạng mục)
// ============================================================================

export const categoriesSchema = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsSchema.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    budget: decimal('budget', { precision: 15, scale: 2 }),
    order: integer('order').default(0),
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      orgIdIdx: index('categories_org_id_idx').on(table.orgId),
      projectIdIdx: index('categories_project_id_idx').on(table.projectId),
      createdAtIdx: index('categories_created_at_idx').on(table.createdAt),
    };
  },
);

// ============================================================================
// TASKS (Đầu việc)
// ============================================================================

export const tasksSchema = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsSchema.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categoriesSchema.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('WAITING'),
    priority: integer('priority').default(0), // 0 = low, 1 = medium, 2 = high
    estimatedHours: decimal('estimated_hours', { precision: 8, scale: 2 }),
    actualHours: decimal('actual_hours', { precision: 8, scale: 2 }),
    dueDate: timestamp('due_date', { mode: 'date' }),
    assignedTo: text('assigned_to'), // Clerk user ID
    order: integer('order').default(0),
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      orgIdIdx: index('tasks_org_id_idx').on(table.orgId),
      projectIdIdx: index('tasks_project_id_idx').on(table.projectId),
      categoryIdIdx: index('tasks_category_id_idx').on(table.categoryId),
      statusIdx: index('tasks_status_idx').on(table.status),
      createdAtIdx: index('tasks_created_at_idx').on(table.createdAt),
    };
  },
);

// ============================================================================
// DAILY LOGS (Nhật ký công trường)
// ============================================================================

export const dailyLogsSchema = pgTable(
  'daily_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsSchema.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categoriesSchema.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    reporterId: text('reporter_id').notNull(), // Clerk user ID
    notes: text('notes'),
    media: json('media').notNull(), // Array of media objects, ≥1 required on FE
    status: dailyLogStatusEnum('status').notNull().default('DRAFT'),
    reviewComment: text('review_comment'),
    qcRating: smallint('qc_rating'), // 1-5 rating
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      orgIdIdx: index('daily_logs_org_id_idx').on(table.orgId),
      projectIdIdx: index('daily_logs_project_id_idx').on(table.projectId),
      categoryIdIdx: index('daily_logs_category_id_idx').on(table.categoryId),
      dateIdx: index('daily_logs_date_idx').on(table.date),
      statusIdx: index('daily_logs_status_idx').on(table.status),
      createdAtIdx: index('daily_logs_created_at_idx').on(table.createdAt),
    };
  },
);

// ============================================================================
// DAILY LOG TASKS (Trạng thái task trong nhật ký)
// ============================================================================

export const dailyLogTasksSchema = pgTable(
  'daily_log_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    dailyLogId: uuid('daily_log_id')
      .notNull()
      .references(() => dailyLogsSchema.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasksSchema.id, { onDelete: 'cascade' }),
    status: logTaskStatusEnum('status').notNull().default('WAITING'),
    progress: integer('progress').default(0), // 0-100
    notes: text('notes'),
    hoursWorked: decimal('hours_worked', { precision: 8, scale: 2 }),
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      orgIdIdx: index('daily_log_tasks_org_id_idx').on(table.orgId),
      dailyLogIdIdx: index('daily_log_tasks_daily_log_id_idx').on(
        table.dailyLogId,
      ),
      taskIdIdx: index('daily_log_tasks_task_id_idx').on(table.taskId),
      statusIdx: index('daily_log_tasks_status_idx').on(table.status),
      createdAtIdx: index('daily_log_tasks_created_at_idx').on(table.createdAt),
      // Unique constraint: dailyLogId + taskId
      dailyLogTaskUniqueIdx: uniqueIndex(
        'daily_log_tasks_daily_log_task_unique_idx',
      ).on(table.dailyLogId, table.taskId),
    };
  },
);

// ============================================================================
// MEDIA ASSETS (Tài nguyên media)
// ============================================================================

export const mediaAssetsSchema = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projectsSchema.id, {
      onDelete: 'cascade',
    }),
    dailyLogId: uuid('daily_log_id').references(() => dailyLogsSchema.id, {
      onDelete: 'cascade',
    }),
    url: text('url').notNull(),
    kind: mediaKindEnum('kind').notNull(),
    metadata: json('metadata'),
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      projectIdIdx: index('media_assets_project_id_idx').on(table.projectId),
      dailyLogIdIdx: index('media_assets_daily_log_id_idx').on(
        table.dailyLogId,
      ),
      kindIdx: index('media_assets_kind_idx').on(table.kind),
      createdAtIdx: index('media_assets_created_at_idx').on(table.createdAt),
    };
  },
);

// ============================================================================
// TRANSACTIONS (Giao dịch tài chính)
// ============================================================================

export const transactionsSchema = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsSchema.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    type: transactionTypeEnum('type').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('VND'),
    costType: costTypeEnum('cost_type').notNull(),
    description: text('description'),
    invoiceNo: text('invoice_no'),
    vendor: text('vendor'),
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('PENDING'),
    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    paymentDate: date('payment_date'),
    attachments: json('attachments'),
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      orgIdIdx: index('transactions_org_id_idx').on(table.orgId),
      projectIdIdx: index('transactions_project_id_idx').on(table.projectId),
      typeIdx: index('transactions_type_idx').on(table.type),
      paymentStatusIdx: index('transactions_payment_status_idx').on(
        table.paymentStatus,
      ),
      dateIdx: index('transactions_date_idx').on(table.date),
      createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
    };
  },
);

// ============================================================================
// SHARE LINKS (Link chia sẻ công khai)
// ============================================================================

export const shareLinksSchema = pgTable(
  'share_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsSchema.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    hideFinance: boolean('hide_finance').notNull().default(false),
    showInvestorContact: boolean('show_investor_contact')
      .notNull()
      .default(false),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    createdBy: text('created_by').notNull(), // Clerk user ID
    // Audit fields
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => {
    return {
      orgIdIdx: index('share_links_org_id_idx').on(table.orgId),
      projectIdIdx: index('share_links_project_id_idx').on(table.projectId),
      tokenIdx: uniqueIndex('share_links_token_idx').on(table.token),
      createdAtIdx: index('share_links_created_at_idx').on(table.createdAt),
    };
  },
);

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already defined above with export keyword

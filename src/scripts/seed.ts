/* eslint-disable no-console */
import { db } from "@/db";
import {
  categoriesSchema,
  dailyLogsSchema,
  dailyLogTasksSchema,
  organizationSchema,
  projectsSchema,
  tasksSchema,
} from "@/models/Schema";

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    console.log("✅ Using database connection");

    // 1. Tạo organization mẫu
    const orgData = {
      id: "org_sample_123",
      stripeCustomerId: "cus_sample_123",
      stripeSubscriptionStatus: "active" as const,
    };

    try {
      await db.insert(organizationSchema).values(orgData);
      console.log("✅ Organization created:", orgData.id);
    } catch {
      console.log("ℹ️ Organization already exists:", orgData.id);
    }

    // 2. Tạo 30 projects mẫu
    const statuses = [
      "PLANNING",
      "IN_PROGRESS",
      "DONE",
      "ON_HOLD",
      "CANCELLED",
    ] as const;
    const projects = [];

    for (let i = 0; i < 30; i++) {
      const name = `Project ${i + 1}`;
      const status = statuses[i % statuses.length];
      const budget = 1000000000 + i * 100000000; // 1B to 4B
      const startDate = new Date(2024, 0, 1 + i * 10);
      const endDate = new Date(2024, 11, 31 - i * 5);

      const projectData = {
        id: `project_${i + 1}`,
        orgId: "org_sample_123",
        name,
        description: `Detailed description for ${name} - A comprehensive construction project with modern design and sustainable materials.`,
        status,
        budget: budget.toString(),
        startDate: startDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
        endDate,
        address: `Address ${i + 1}, Ho Chi Minh City`,
        clientName: `Client ${i + 1}`,
        clientContact: `090${String(i).padStart(7, "0")}`,
        thumbnailUrl: `https://picsum.photos/400/300?random=${i + 1}`,
      };

      try {
        const result = await db
          .insert(projectsSchema)
          .values(projectData)
          .returning({ id: projectsSchema.id, name: projectsSchema.name });
        projects.push(result[0]);
      } catch {
        console.log(`ℹ️ Project ${i + 1} already exists`);
        projects.push({ id: projectData.id, name: projectData.name });
      }
    }

    console.log("✅ Projects created:", projects.length);

    // 3. Tạo category mẫu cho project đầu tiên
    const categoryData = {
      id: "category_1",
      orgId: "org_sample_123",
      projectId: projects[0].id,
      name: "Phần móng và tầng trệt",
      description: "Thi công phần móng, tầng trệt và hầm",
      budget: "800000000.00",
      order: 1,
    };

    try {
      await db.insert(categoriesSchema).values(categoryData);
      console.log("✅ Category created:", categoryData.name);
    } catch {
      console.log("ℹ️ Category already exists");
    }

    // 4. Tạo tasks mẫu cho project đầu tiên
    const tasksData = [
      {
        id: "task_1",
        orgId: "org_sample_123",
        projectId: projects[0].id,
        categoryId: "category_1",
        name: "Đào móng",
        description: "Đào móng sâu 2m, rộng 1.5m",
        status: "DONE" as const,
        priority: 1,
        estimatedHours: 40,
        actualHours: 45,
        dueDate: new Date("2024-02-15"),
        assignedTo: "user_123",
        order: 1,
      },
      {
        id: "task_2",
        orgId: "org_sample_123",
        projectId: projects[0].id,
        categoryId: "category_1",
        name: "Đổ bê tông móng",
        description: "Đổ bê tông móng C25",
        status: "IN_PROGRESS" as const,
        priority: 2,
        estimatedHours: 24,
        actualHours: 12,
        dueDate: new Date("2024-02-28"),
        assignedTo: "user_456",
        order: 2,
      },
      {
        id: "task_3",
        orgId: "org_sample_123",
        projectId: projects[0].id,
        categoryId: "category_1",
        name: "Xây tường tầng trệt",
        description: "Xây tường gạch ống 20cm",
        status: "WAITING" as const,
        priority: 1,
        estimatedHours: 80,
        actualHours: null,
        dueDate: new Date("2024-03-15"),
        assignedTo: "user_789",
        order: 3,
      },
    ];

    try {
      await db.insert(tasksSchema).values(tasksData);
      console.log("✅ Tasks created:", tasksData.length);
    } catch {
      console.log("ℹ️ Tasks already exist");
    }

    // 5. Tạo daily log mẫu cho project đầu tiên
    const dailyLogData = {
      id: "dailylog_1",
      orgId: "org_sample_123",
      projectId: projects[0].id,
      categoryId: "category_1",
      logDate: new Date("2024-02-20"),
      weather: "Nắng",
      temperature: 28.5,
      notes: "Thời tiết tốt, tiến độ đúng kế hoạch",
      createdBy: "user_123",
    };

    try {
      await db.insert(dailyLogsSchema).values(dailyLogData);
      console.log("✅ Daily log created:", dailyLogData.id);
    } catch {
      console.log("ℹ️ Daily log already exists");
    }

    // 6. Tạo daily log tasks mẫu
    const dailyLogTasksData = [
      {
        id: "dailylogtask_1",
        orgId: "org_sample_123",
        dailyLogId: "dailylog_1",
        taskId: "task_1",
        status: "DONE" as const,
        progress: 100,
        notes: "Hoàn thành đào móng",
        hoursWorked: 45,
      },
      {
        id: "dailylogtask_2",
        orgId: "org_sample_123",
        dailyLogId: "dailylog_1",
        taskId: "task_2",
        status: "IN_PROGRESS" as const,
        progress: 50,
        notes: "Đang đổ bê tông, tiến độ 50%",
        hoursWorked: 12,
      },
      {
        id: "dailylogtask_3",
        orgId: "org_sample_123",
        dailyLogId: "dailylog_1",
        taskId: "task_3",
        status: "WAITING" as const,
        progress: 0,
        notes: "Chờ hoàn thành đổ bê tông móng",
        hoursWorked: 0,
      },
    ];

    try {
      await db.insert(dailyLogTasksSchema).values(dailyLogTasksData);
      console.log("✅ Daily log tasks created:", dailyLogTasksData.length);
    } catch {
      console.log("ℹ️ Daily log tasks already exist");
    }

    console.log("✅ Seeding completed");
    console.log("📊 Summary:");
    console.log(`   - 1 Organization: org_sample_123`);
    console.log(`   - ${projects.length} Projects`);
    console.log(`   - 1 Category: ${categoryData.name}`);
    console.log(`   - ${tasksData.length} Tasks`);
    console.log(`   - 1 Daily Log`);
    console.log(`   - ${dailyLogTasksData.length} Daily Log Tasks`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Chạy seed
seed()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });

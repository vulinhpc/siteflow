/* eslint-disable no-console */
import { db } from "@/db";
import {
  categoriesSchema,
  dailyLogsSchema,
  dailyLogTasksSchema,
  organizationSchema,
  projectsSchema,
  tasksSchema,
  transactionsSchema,
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

    // 2. Tạo 30 projects mẫu với đầy đủ thông tin mới
    const statuses = [
      "planning",
      "in_progress",
      "on_hold",
      "completed",
    ] as const;
    const projects = [];

    const projectTypes = [
      "Nhà ở cao cấp",
      "Chung cư",
      "Văn phòng",
      "Trung tâm thương mại",
      "Nhà máy",
      "Kho bãi",
    ];

    const districts = [
      "Quận 1",
      "Quận 2",
      "Quận 3",
      "Quận 7",
      "Thủ Đức",
      "Bình Thạnh",
      "Tân Bình",
      "Gò Vấp",
      "Phú Nhuận",
      "Tân Phú",
    ];

    for (let i = 0; i < 30; i++) {
      const projectType = projectTypes[i % projectTypes.length];
      const name = `${projectType} ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`;
      const status = statuses[i % statuses.length];
      const budget = 1000000000 + i * 100000000; // 1B to 4B
      const budgetTotal = budget * (1.1 + Math.random() * 0.2); // 10-30% higher than budget
      const startDate = new Date(2024, 0, 1 + i * 10);
      const endDate = new Date(2024, 11, 31 - i * 5);
      const district = districts[i % districts.length];

      const projectData = {
        id: `project_${i + 1}`,
        orgId: "org_sample_123",
        name,
        status,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        budgetTotal: budgetTotal.toString(),
        currency: "VND",
        description: `Dự án ${name} tại ${district}, TP.HCM. Công trình hiện đại với thiết kế bền vững và công nghệ tiên tiến.`,
        thumbnailUrl: `https://picsum.photos/400/300?random=${i + 1}`,
        address: `${123 + i} Đường Nguyễn Văn Linh, ${district}, TP.HCM`,
        scale: {
          area_m2: Math.floor(Math.random() * 5000) + 1000,
          floors: Math.floor(Math.random() * 20) + 5,
          notes: `${Math.floor(Math.random() * 200) + 50} căn hộ`,
        },
        investorName: `Công ty TNHH Đầu tư ${String.fromCharCode(65 + (i % 26))}`,
        investorPhone: `028${String(Math.floor(Math.random() * 10000000)).padStart(7, "0")}`,
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

    // 5. Tạo 50 daily logs mẫu với đầy đủ thông tin mới
    const logStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "DECLINED"] as const;
    const dailyLogs = [];

    for (let i = 0; i < 50; i++) {
      const logDate = new Date(2024, 1, 1 + i); // February onwards
      const status = logStatuses[i % logStatuses.length];
      const qcRating = Math.floor(Math.random() * 5) + 1; // 1-5 rating

      const dailyLogData = {
        id: `dailylog_${i + 1}`,
        orgId: "org_sample_123",
        projectId: projects[i % projects.length].id,
        categoryId: "category_1",
        date: logDate.toISOString().split("T")[0],
        reporterId: `user_${(i % 3) + 1}`,
        notes: `Báo cáo ngày ${logDate.toLocaleDateString("vi-VN")}. Tiến độ thi công theo kế hoạch. Công việc được thực hiện đúng quy trình an toàn.`,
        media: [
          {
            url: `https://picsum.photos/800/600?random=${i + 100}`,
            type: "image",
            caption: "Hình ảnh công trường",
          },
          {
            url: `https://picsum.photos/800/600?random=${i + 200}`,
            type: "image",
            caption: "Tiến độ thi công",
          },
        ],
        status,
        reviewComment:
          status === "APPROVED"
            ? "Đạt yêu cầu chất lượng"
            : status === "DECLINED"
              ? "Cần bổ sung thông tin"
              : null,
        qcRating: status === "APPROVED" ? qcRating : null,
      };

      try {
        await db.insert(dailyLogsSchema).values(dailyLogData);
        dailyLogs.push(dailyLogData);
      } catch {
        console.log(`ℹ️ Daily log ${i + 1} already exists`);
        dailyLogs.push(dailyLogData);
      }
    }

    console.log("✅ Daily logs created:", dailyLogs.length);

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

    // 7. Tạo 20 transactions mẫu với đầy đủ thông tin mới
    const transactionTypes = ["ADVANCE", "EXPENSE"] as const;
    const paymentStatuses = ["PENDING", "PARTIAL", "PAID"] as const;
    const costTypes = ["MATERIAL", "LABOR", "EQUIPMENT", "OTHER"] as const;
    const vendors = [
      "Công ty Xi măng Hà Tiên",
      "Thép Hòa Phát",
      "Gạch Đồng Tâm",
      "Điện Quang",
      "Công ty Xây dựng ABC",
      "Nhà thầu XYZ",
    ];

    const transactions = [];
    for (let i = 0; i < 20; i++) {
      const type = transactionTypes[i % transactionTypes.length];
      const paymentStatus = paymentStatuses[i % paymentStatuses.length];
      const costType = costTypes[i % costTypes.length];
      const amount = Math.random() * 500000000 + 50000000; // 50M - 550M VND
      const paidAmount =
        paymentStatus === "PAID"
          ? amount
          : paymentStatus === "PARTIAL"
            ? amount * 0.6
            : 0;
      const transactionDate = new Date(2024, 1, 1 + i * 3);
      const paymentDate =
        paymentStatus !== "PENDING"
          ? new Date(
              transactionDate.getTime() +
                Math.random() * 30 * 24 * 60 * 60 * 1000,
            )
          : null;

      const transactionData = {
        id: `transaction_${i + 1}`,
        orgId: "org_sample_123",
        projectId: projects[i % projects.length].id,
        date: transactionDate.toISOString().split("T")[0],
        type,
        amount: amount.toString(),
        currency: "VND",
        costType,
        description:
          type === "ADVANCE"
            ? `Tạm ứng đợt ${i + 1} cho dự án ${projects[i % projects.length].name}`
            : `Chi phí ${costType.toLowerCase()} - ${vendors[i % vendors.length]}`,
        invoiceNo: `INV-${String(i + 1).padStart(4, "0")}`,
        vendor: type === "EXPENSE" ? vendors[i % vendors.length] : null,
        paymentStatus,
        paidAmount: paidAmount.toString(),
        paymentDate: paymentDate
          ? paymentDate.toISOString().split("T")[0]
          : null,
        attachments:
          paymentStatus === "PAID"
            ? [
                {
                  filename: `receipt_${i + 1}.pdf`,
                  url: `https://example.com/receipts/receipt_${i + 1}.pdf`,
                },
                {
                  filename: `invoice_${i + 1}.pdf`,
                  url: `https://example.com/invoices/invoice_${i + 1}.pdf`,
                },
              ]
            : null,
      };

      try {
        await db.insert(transactionsSchema).values(transactionData);
        transactions.push(transactionData);
      } catch {
        console.log(`ℹ️ Transaction ${i + 1} already exists`);
        transactions.push(transactionData);
      }
    }

    console.log("✅ Transactions created:", transactions.length);

    console.log("✅ Seeding completed");
    console.log("📊 Summary:");
    console.log(`   - 1 Organization: org_sample_123`);
    console.log(`   - ${projects.length} Projects`);
    console.log(`   - 1 Category: ${categoryData.name}`);
    console.log(`   - ${tasksData.length} Tasks`);
    console.log(`   - ${dailyLogs.length} Daily Logs`);
    console.log(`   - ${dailyLogTasksData.length} Daily Log Tasks`);
    console.log(`   - ${transactions.length} Transactions`);
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

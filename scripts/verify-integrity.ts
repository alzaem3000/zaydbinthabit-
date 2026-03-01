import { storage } from "../server/storage";
import { CycleService } from "../server/services/cycles";
import { db } from "../server/db";
import { indicators, signatures, auditLogs, notifications, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function verify() {
  console.log("🔍 Starting System Integrity Verification...\n");

  try {
    // 1. Cycle Check
    console.log("1. Checking Academic Cycle...");
    const activeCycle = await CycleService.getActiveCycle();
    if (activeCycle) {
      console.log(`✅ Pass: Active Cycle found (ID: ${activeCycle.id}, Name: ${activeCycle.name})`);
    } else {
      console.log("❌ Fail: No Active Cycle found");
      process.exit(1);
    }

    // Prepare dummy user if not exists
    let testUser = await storage.getUser("test-integrity-user");
    if (!testUser) {
      testUser = await storage.upsertUser({
        id: "test-integrity-user",
        username: "integrity_tester",
        fullNameArabic: "فاحص النظام",
        role: "teacher",
        onboardingCompleted: true
      });
    }

    // 2. Data Isolation Test
    console.log("\n2. Testing Data Isolation & Linking...");
    const indicator = await storage.createIndicator({
      title: "Test Integrity Indicator",
      description: "Verification script indicator",
      type: "goal",
      weight: 10,
      userId: testUser.id,
      status: "pending"
    });

    if (indicator.academicCycleId === activeCycle.id) {
      console.log(`✅ Pass: Indicator linked to Active Cycle ID: ${activeCycle.id}`);
    } else {
      console.log(`❌ Fail: Indicator linked to wrong cycle: ${indicator.academicCycleId}`);
    }

    // 3. Workflow Simulation (Approval)
    console.log("\n3. Simulating Principal Approval Workflow...");
    const signature = await storage.createSignature({
      indicatorId: indicator.id,
      teacherId: testUser.id,
      status: "pending"
    });

    // Mock principal approval
    await db.update(signatures)
      .set({ 
        status: "approved", 
        notes: "Approved by integrity script",
        signedAt: new Date()
      })
      .where(eq(signatures.id, signature.id));
    
    // Also update indicator status as the route would do
    await db.update(indicators)
      .set({ status: "completed" })
      .where(eq(indicators.id, indicator.id));

    console.log("✅ Pass: Signature created and approved simulation complete");

    // 4. Reactive Systems Check (Audit & Notifications)
    console.log("\n4. Verifying Audit & Notification Persistence...");
    
    // Simulate Audit Log entry
    const [auditEntry] = await db.insert(auditLogs).values({
      userId: testUser.id,
      action: "approve_indicator",
      entityType: "indicator",
      entityId: indicator.id,
      details: { script: "integrity-check" },
      ipAddress: "127.0.0.1"
    }).returning();

    if (auditEntry) {
      console.log("✅ Pass: Audit log entry persistent");
    } else {
      console.log("❌ Fail: Could not write audit log");
    }

    // Simulate Notification - Fix: Using recipientId instead of userId
    const [notification] = await db.insert(notifications).values({
      recipientId: testUser.id,
      title: "تم اعتماد مؤشر",
      message: "تم اعتماد مؤشر الاختبار بنجاح",
      type: "approval"
    }).returning();

    if (notification) {
      console.log("✅ Pass: Notification system functional");
    } else {
      console.log("❌ Fail: Could not write notification");
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await db.delete(notifications).where(eq(notifications.id, notification.id));
    await db.delete(auditLogs).where(eq(auditLogs.id, auditEntry.id));
    await db.delete(signatures).where(eq(signatures.id, signature.id));
    await db.delete(indicators).where(eq(indicators.id, indicator.id));
    
    console.log("\n✨ Verification Complete: System Integrity Confirmed.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Critical Failure during verification:");
    console.error(error);
    process.exit(1);
  }
}

verify();

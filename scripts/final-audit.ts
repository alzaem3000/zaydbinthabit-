import fs from "fs";
import { db } from "../server/db";
import { performanceStandards } from "../shared/schema";

async function runAudit() {
  console.log("Starting Final System Audit...");
  
  // 1. Check browser-image-compression
  const pkgJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  if (pkgJson.dependencies["browser-image-compression"] || pkgJson.devDependencies["browser-image-compression"]) {
    console.log("✅ browser-image-compression found in package.json");
  } else {
    console.log("❌ browser-image-compression NOT found in package.json");
    process.exit(1);
  }

  // 2. Check performance_standards table
  try {
    const standards = await db.select().from(performanceStandards).limit(1);
    console.log("✅ performance_standards table exists and is accessible");
  } catch (error) {
    console.log("❌ performance_standards table error:", error);
    process.exit(1);
  }

  // 3. Check witness-upload-modal.tsx for imageCompression
  const modalPath = "client/src/components/witness-upload-modal.tsx";
  if (fs.existsSync(modalPath)) {
    const content = fs.readFileSync(modalPath, "utf8");
    if (content.includes("imageCompression")) {
      console.log("✅ witness-upload-modal.tsx contains imageCompression");
    } else {
      console.log("❌ witness-upload-modal.tsx missing imageCompression");
      process.exit(1);
    }
  }

  console.log("\n✅ SYSTEM INTEGRITY CONFIRMED");
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});

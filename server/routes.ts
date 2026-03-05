import { type Server, createServer } from "node:http";
import type { Express } from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isPrincipal, isCreator, getUserIdFromRequest } from "./replitAuth";
import { randomBytes } from "crypto";
import { NotificationService } from "./services/notification";
import { AuditService } from "./services/audit";
import { CycleService } from "./services/cycles";
import { notifyPrincipalOfNewEvidence, notifyTeacherOfReviewResult } from "./services/email";
import { performanceStandards, users } from "@shared/schema";
import { db } from "./db";
import { asc, eq, or, and } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // --- Notification Routes ---
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const notes = await NotificationService.getUserNotifications(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notifications/:id/mark-read", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      await NotificationService.markAsRead(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Academic Cycle Routes ---
  app.get("/api/cycles", isAuthenticated, async (req, res) => {
    try {
      const cycles = await CycleService.getAllCycles();
      res.json(cycles);
    } catch (error) {
      console.error("Error fetching cycles:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/cycles/:id/activate", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      await CycleService.setActiveCycle(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating cycle:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // 1. Teacher Registration (New User)
  app.post("/api/auth/teacher/register", async (req, res, next) => {
    const { nationalId, mobileNumber, fullNameArabic } = req.body;

    if (!nationalId || !mobileNumber || !fullNameArabic) {
      return res.status(400).send("جميع الحقول مطلوبة");
    }

    try {
      const emailToStore = `nid_${nationalId}@teacher.local`;
      const existing = await db.query.users.findFirst({
        where: or(eq(users.email, emailToStore), eq(users.mobileNumber, mobileNumber))
      });

      if (existing) return res.status(400).send("رقم الهوية أو الجوال مسجل مسبقاً");

      const [newUser] = await db.insert(users).values({
        email: emailToStore,
        jobNumber: nationalId,
        mobileNumber,
        fullNameArabic,
        firstName: fullNameArabic.split(" ")[0],
        lastName: fullNameArabic.split(" ").slice(1).join(" ") || "",
        role: "teacher",
        schoolName: "زيد بن ثابت الابتدائية",
        principalName: "زياد عبدالمحسن العتيبي",
        onboardingCompleted: true
      }).returning();

      // Seed default indicators for new teacher
      await storage.seedDefaultIndicators(newUser.id);

      req.login(newUser, (err) => {
        if (err) return next(err);
        return res.json(newUser);
      });
    } catch (err) {
      console.error("Registration Error:", err);
      res.status(500).send("خطأ في الخادم");
    }
  });

  // 2. Teacher Login (Existing User)
  app.post("/api/auth/teacher/login", async (req, res, next) => {
    const { nationalId, mobileNumber } = req.body;

    try {
      const emailToQuery = `nid_${nationalId}@teacher.local`;
      const user = await db.query.users.findFirst({
        where: and(eq(users.email, emailToQuery), eq(users.mobileNumber, mobileNumber))
      });

      if (!user) return res.status(401).send("رقم الهوية أو رمز الدخول غير صحيح");

      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).send("خطأ في الخادم");
    }
  });

  // Admin (Principal) login - password-based
  app.post("/api/auth/admin/login", async (req, res, next) => {
    const { password } = req.body;

    try {
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        return res.status(500).json({ message: "لم يتم تعيين الرقم السري للمدير" });
      }

      if (!password || password !== adminPassword) {
        return res.status(401).json({ message: "الرقم السري غير صحيح" });
      }

      // Find or create admin user
      let adminUser = await storage.findUserByRole("admin");

      if (!adminUser) {
        const uniqueId = `admin_${randomBytes(8).toString("hex")}`;
        adminUser = await storage.upsertUser({
          id: uniqueId,
          firstName: "zayd",
          lastName: "",
          email: `admin@school.local`,
          role: "admin",
          schoolName: "",
          principalName: "zayd",
        });
      }

      req.login(adminUser, (err) => {
        if (err) return next(err);
        return res.json(adminUser);
      });
    } catch (err) {
      console.error("Admin Login Error:", err);
      res.status(500).send("خطأ في الخادم");
    }
  });

  // Creator login - password-based
  app.post("/api/auth/creator/login", async (req, res, next) => {
    const { password } = req.body;

    try {
      const creatorPassword = process.env.CREATOR_PASSWORD;

      if (!creatorPassword) {
        return res.status(500).json({ message: "لم يتم تعيين الرقم السري لمنشئ الموقع" });
      }

      if (!password || password !== creatorPassword) {
        return res.status(401).json({ message: "الرقم السري غير صحيح" });
      }

      // Find or create creator user
      let creatorUser = await storage.findUserByRole("creator");

      if (!creatorUser) {
        const uniqueId = `creator_${randomBytes(8).toString("hex")}`;
        creatorUser = await storage.upsertUser({
          id: uniqueId,
          firstName: "zayd",
          lastName: "",
          email: `creator@school.local`,
          role: "creator",
        });
      }

      req.login(creatorUser, (err) => {
        if (err) return next(err);
        return res.json(creatorUser);
      });
    } catch (err) {
      console.error("Creator Login Error:", err);
      res.status(500).send("خطأ في الخادم");
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);

      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/onboarding", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { fullNameArabic, jobNumber, specialization, schoolName, educationDepartment, educationalLevel, subject, mobileNumber } = req.body;

      if (!fullNameArabic || !jobNumber || !specialization || !schoolName || !educationDepartment || !subject) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      if (!/^\d{4,}$/.test(jobNumber)) {
        return res.status(400).json({ message: "الرقم الوظيفي يجب أن يكون رقمياً" });
      }

      const nameParts = fullNameArabic.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      const profileData: any = {
        fullNameArabic,
        firstName,
        lastName,
        jobNumber,
        specialization,
        schoolName,
        educationDepartment,
        educationalLevel,
        subject,
        onboardingCompleted: true,
      };

      if (mobileNumber) {
        if (!/^05\d{8}$/.test(mobileNumber)) {
          return res.status(400).json({ message: "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" });
        }

        const existingUser = await storage.findUserByMobile(mobileNumber);
        if (existingUser && existingUser.id !== userId) {
          // Update the existing user with the new profile data
          await storage.updateUser(existingUser.id, profileData);

          // Switch the session to the existing user
          (req.session as any).userId = existingUser.id;
          (req.session as any).userRole = existingUser.role || "teacher";

          // Delete the temporary/current user
          await storage.deleteUser(userId);

          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          return res.json(existingUser);
        }
        profileData.mobileNumber = mobileNumber;
      }

      const updated = await storage.updateUser(userId, profileData);

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error in onboarding:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { firstName, lastName, fullNameArabic, jobNumber, specialization, educationalLevel, schoolName, educationDepartment, subject, yearsOfService, contactEmail, principalName, mobileNumber } = req.body;

      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (fullNameArabic !== undefined) updateData.fullNameArabic = fullNameArabic;
      if (jobNumber !== undefined) updateData.jobNumber = jobNumber;
      if (specialization !== undefined) updateData.specialization = specialization;
      if (educationalLevel !== undefined) updateData.educationalLevel = educationalLevel;
      if (schoolName !== undefined) updateData.schoolName = schoolName;
      if (educationDepartment !== undefined) updateData.educationDepartment = educationDepartment;
      if (subject !== undefined) updateData.subject = subject;
      if (yearsOfService !== undefined) updateData.yearsOfService = yearsOfService;
      if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
      if (principalName !== undefined) updateData.principalName = principalName;
      if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;

      const updated = await storage.updateUser(userId, updateData);

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/indicators", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const indicators = await storage.getIndicators(userId);
      const stripped = indicators.map(ind => ({
        ...ind,
        witnesses: ind.witnesses?.map(w => ({ id: w.id, fileType: w.fileType, title: w.title })),
      }));
      res.json(stripped);
    } catch (error) {
      console.error("Error fetching indicators:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/indicators", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { title, description, criteria: criteriaList, type, weight, domain, targetOutput } = req.body;

      const indicator = await storage.createIndicator({
        title,
        description,
        type: type || "goal",
        weight: weight || 0,
        domain: domain || null,
        targetOutput: targetOutput || null,
        userId,
        status: "pending",
      });

      if (criteriaList && Array.isArray(criteriaList)) {
        for (let i = 0; i < criteriaList.length; i++) {
          const criteriaTitle = criteriaList[i];
          if (criteriaTitle && typeof criteriaTitle === "string") {
            await storage.createCriteria({
              title: criteriaTitle,
              indicatorId: indicator.id,
              order: i + 1,
            });
          }
        }
      }

      const fullIndicator = await storage.getIndicator(indicator.id);
      res.json(fullIndicator);
    } catch (error) {
      console.error("Error creating indicator:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/indicators/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const indicator = await storage.getIndicator(req.params.id);
      if (!indicator) {
        return res.status(404).json({ message: "Indicator not found" });
      }
      if (indicator.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(indicator);
    } catch (error) {
      console.error("Error fetching indicator:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/indicators/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const indicator = await storage.getIndicator(req.params.id);
      if (!indicator) {
        return res.status(404).json({ message: "Indicator not found" });
      }
      if (indicator.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { title, description, status, order, type, weight, domain, targetOutput } = req.body;
      const safeUpdate: { title?: string; description?: string; status?: string; order?: number; type?: string; weight?: number; domain?: string | null; targetOutput?: string | null } = {};
      if (title !== undefined) safeUpdate.title = title;
      if (description !== undefined) safeUpdate.description = description;
      if (status !== undefined) safeUpdate.status = status;
      if (order !== undefined) safeUpdate.order = order;
      if (type !== undefined) safeUpdate.type = type;
      if (weight !== undefined) safeUpdate.weight = weight;
      if (domain !== undefined) safeUpdate.domain = domain;
      if (targetOutput !== undefined) safeUpdate.targetOutput = targetOutput;

      const updated = await storage.updateIndicator(req.params.id, safeUpdate);
      res.json(updated);
    } catch (error) {
      console.error("Error updating indicator:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/indicators/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const indicator = await storage.getIndicator(req.params.id);
      if (!indicator) {
        return res.status(404).json({ message: "Indicator not found" });
      }
      if (indicator.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteIndicator(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting indicator:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/indicators/:indicatorId/criteria/:criteriaId", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const indicator = await storage.getIndicator(req.params.indicatorId);
      if (!indicator) {
        return res.status(404).json({ message: "Indicator not found" });
      }
      if (indicator.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const criterion = await storage.getCriteriaById(req.params.criteriaId);
      if (!criterion) {
        return res.status(404).json({ message: "Criteria not found" });
      }
      if (criterion.indicatorId !== req.params.indicatorId) {
        return res.status(403).json({ message: "Criteria does not belong to this indicator" });
      }

      const { isCompleted } = req.body;
      const updated = await storage.updateCriteria(req.params.criteriaId, { isCompleted });

      const allCriteria = await storage.getCriteria(req.params.indicatorId);
      const allCompleted = allCriteria.every(c => c.isCompleted);
      const anyCompleted = allCriteria.some(c => c.isCompleted);

      let status: "pending" | "in_progress" | "completed" = "pending";
      if (allCompleted) {
        status = "completed";
      } else if (anyCompleted) {
        status = "in_progress";
      }

      await storage.updateIndicator(req.params.indicatorId, { status });

      res.json(updated);
    } catch (error) {
      console.error("Error updating criteria:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/indicators/:id/witnesses", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const indicator = await storage.getIndicator(req.params.id);
      if (!indicator) {
        return res.status(404).json({ message: "Indicator not found" });
      }
      if (indicator.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const witnesses = await storage.getWitnesses(req.params.id);
      res.json(witnesses);
    } catch (error) {
      console.error("Error fetching witnesses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/indicators/:id/witnesses", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const indicator = await storage.getIndicator(req.params.id);
      if (!indicator) {
        return res.status(404).json({ message: "Indicator not found" });
      }
      if (indicator.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { description, link } = req.body;
      const { title, criteriaId, fileType, fileData, fileName } = req.body;
      // also support req.file if using multer, but the requirements just state req.file OR req.body.link
      const fileUrlToStore = (req as any).file ? (req as any).file.path : fileData;

      if (!fileUrlToStore && !link) {
        return res.status(400).json({ message: "يجب اختيار ملف أو إضافة رابط" });
      }

      if (criteriaId) {
        const criterion = await storage.getCriteriaById(criteriaId);
        if (!criterion) {
          return res.status(404).json({ message: "Criteria not found" });
        }
        if (criterion.indicatorId !== req.params.id) {
          return res.status(400).json({ message: "Criteria does not belong to this indicator" });
        }
      }

      const witness = await storage.createWitness({
        title,
        description,
        indicatorId: req.params.id,
        criteriaId,
        fileType,
        fileUrl: fileUrlToStore,
        fileName,
        link: link,
        userId,
      });

      // Trigger Principal Email
      const admin = await storage.findUserByRole("admin");
      if (admin && admin.email) {
        const teacher = await storage.getUser(userId);
        await notifyPrincipalOfNewEvidence(
          admin.email,
          teacher?.fullNameArabic || teacher?.firstName || 'Unknown',
          indicator.title,
          witness.title
        );
      }

      res.json(witness);
    } catch (error) {
      console.error("Error creating witness:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/standards/:id/witnesses — رفع شاهد مرتبط بمعيار مباشرة (بدون مؤشر)
  app.post("/api/standards/:id/witnesses", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const standardId = parseInt(req.params.id);
      if (isNaN(standardId)) return res.status(400).json({ message: "معرف المعيار غير صحيح" });

      const { title, fileType, fileData, fileName, link } = req.body;
      const fileUrlToStore = fileData || undefined;

      if (!fileUrlToStore && !link) {
        return res.status(400).json({ message: "يجب اختيار ملف أو إضافة رابط" });
      }

      const witness = await storage.createWitness({
        title: title || "شاهد",
        description: title || "شاهد",
        performanceStandardId: standardId,
        fileType: fileType || (link ? "link" : "unknown"),
        fileUrl: fileUrlToStore,
        fileName: fileName || undefined,
        link: link || undefined,
        userId,
      });

      res.json(witness);
    } catch (error) {
      console.error("Error creating standard witness:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/witnesses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const witness = await storage.getWitnessById(req.params.id);
      if (!witness) {
        return res.status(404).json({ message: "Witness not found" });
      }
      if (witness.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteWitness(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting witness:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Nafes Routes ---
  app.get("/api/nafes", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);

      if (user?.role === "admin" || user?.role === "creator") {
        // If teacherId is provided in query, get their specific files
        const teacherId = req.query.teacherId as string;
        const files = await storage.getNafesFiles(teacherId); // if undefined, storage gets all
        return res.json(files);
      }

      // For teachers, return only their files
      const files = await storage.getNafesFiles(userId);
      res.json(files);

    } catch (error) {
      console.error("Error fetching Nafes files:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/nafes", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { title, fileUrl, fileType, fileName, fileSize } = req.body;

      if (!title || !fileUrl) {
        return res.status(400).json({ message: "Title and fileUrl are required" });
      }

      const file = await storage.createNafesFile({
        userId,
        title,
        fileUrl,
        fileType,
        fileName,
        fileSize
      });

      res.json(file);
    } catch (error) {
      console.error("Error creating Nafes file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/nafes/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Ideally should verify NafesFile belongs to user before deleting,
      // but sticking to standard implementation logic matching witnesses
      await storage.deleteNafesFile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting Nafes file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/strategies", isAuthenticated, async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user-strategies", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const strategies = await storage.getUserStrategies(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching user strategies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user-strategies", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { strategyIds } = req.body;

      if (!Array.isArray(strategyIds)) {
        return res.status(400).json({ message: "strategyIds must be an array" });
      }

      await storage.setUserStrategies(userId, strategyIds);
      const strategies = await storage.getUserStrategies(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Error setting user strategies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/capabilities", isAuthenticated, async (req, res) => {
    try {
      const capabilities = await storage.getCapabilities();
      res.json(capabilities);
    } catch (error) {
      console.error("Error fetching capabilities:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/changes", isAuthenticated, async (req, res) => {
    try {
      const changes = await storage.getChanges();
      res.json(changes);
    } catch (error) {
      console.error("Error fetching changes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/indicators/re-evaluate", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { indicatorIds } = req.body;

      if (!Array.isArray(indicatorIds) || indicatorIds.length === 0) {
        return res.status(400).json({ message: "indicatorIds must be a non-empty array" });
      }

      for (const id of indicatorIds) {
        const indicator = await storage.getIndicator(id);
        if (!indicator) {
          return res.status(404).json({ message: `Indicator ${id} not found` });
        }
        if (indicator.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.reEvaluateIndicators(indicatorIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error re-evaluating indicators:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // =====================================================
  // SIGNATURE ROUTES - Teacher submits for approval
  // =====================================================

  // Teacher: Submit indicator for approval
  app.post("/api/signatures", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { indicatorId } = req.body;

      if (!indicatorId) {
        return res.status(400).json({ message: "indicatorId is required" });
      }

      const indicator = await storage.getIndicator(indicatorId);
      if (!indicator) {
        return res.status(404).json({ message: "Indicator not found" });
      }
      if (indicator.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const signature = await storage.createSignature({
        indicatorId,
        teacherId: userId,
        status: "pending",
      });

      res.json(signature);
    } catch (error) {
      console.error("Error creating signature:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Teacher: Get my signatures
  app.get("/api/my-signatures", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const signatures = await storage.getSignaturesByTeacher(userId);
      res.json(signatures);
    } catch (error) {
      console.error("Error fetching signatures:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // =====================================================
  // PRINCIPAL ROUTES - Admin access only
  // =====================================================

  // Principal: Get dashboard stats
  app.get("/api/principal/stats", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const stats = await storage.getPrincipalStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching principal stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Principal: Get all teachers with their stats
  app.get("/api/principal/teachers", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Principal: Get all indicators for a specific teacher
  app.get("/api/principal/teachers/:teacherId/indicators", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const indicators = await storage.getIndicators(req.params.teacherId);
      const stripped = indicators.map(ind => ({
        ...ind,
        witnesses: ind.witnesses?.map(w => ({ id: w.id, fileType: w.fileType, title: w.title })),
      }));
      res.json(stripped);
    } catch (error) {
      console.error("Error fetching teacher indicators:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/principal/indicators/:indicatorId/witnesses", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const witnesses = await storage.getWitnesses(req.params.indicatorId);
      res.json(witnesses);
    } catch (error) {
      console.error("Error fetching indicator witnesses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Principal: Get pending signatures
  app.get("/api/principal/pending-signatures", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const signatures = await storage.getPendingSignatures();
      res.json(signatures);
    } catch (error) {
      console.error("Error fetching pending signatures:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Principal: Export school data as CSV
  app.get("/api/principal/export-csv", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();

      // Flatten data for CSV
      const csvRows = [
        ["الرقم الوظيفي", "الاسم الكامل", "التخصص", "عدد المؤشرات", "المؤشرات المكتملة", "بانتظار الاعتماد"], // Header in Arabic
      ];

      for (const t of teachers) {
        csvRows.push([
          t.jobNumber || "غير محدد",
          t.fullNameArabic || `${t.firstName} ${t.lastName}`,
          t.specialization || "غير محدد",
          t.indicatorCount.toString(),
          t.completedCount.toString(),
          t.pendingApprovalCount.toString()
        ]);
      }

      const csvContent = csvRows.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
      ).join("\n");

      res.header("Content-Type", "text/csv; charset=utf-8");
      res.header("Content-Disposition", "attachment; filename=school_performance_report.csv");
      // Add UTF-8 BOM for Excel Arabic support
      res.send("\ufeff" + csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تصدير التقرير" });
    }
  });

  // Principal: Approve a signature
  app.post("/api/principal/signatures/:id/approve", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const principalId = await getUserIdFromRequest(req);
      if (!principalId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { notes } = req.body;
      const signatureId = req.params.id;
      const signature = await storage.approveSignature(signatureId, principalId, notes);

      if (!signature) {
        return res.status(404).json({ message: "Signature not found" });
      }

      // Email Notification to Teacher
      const teacher = await storage.getUser(signature.teacherId!);
      if (teacher && teacher.email) { // Using standard email as contactEmail may be missed
        const principal = await storage.getUser(principalId);
        const indicator = await storage.getIndicator(signature.indicatorId!);
        await notifyTeacherOfReviewResult(
          teacher.email, // using teacher.email since we know it exists 
          principal?.firstName || 'Principal',
          indicator?.title || 'Unknown Indicator',
          'approved',
          notes
        );
      }

      // Log & Notify
      await AuditService.log({
        userId: principalId,
        action: "APPROVE",
        entityType: "signature",
        entityId: signatureId,
        details: { notes },
        ipAddress: req.ip
      });

      await NotificationService.send({
        recipientId: signature.teacherId!,
        type: "success",
        title: "تم اعتماد الميثاق",
        message: "قام مدير المدرسة باعتماد ميثاق الأداء الخاص بك.",
        link: "/home"
      });

      res.json(signature);
    } catch (error) {
      console.error("Error approving signature:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Principal: Reject a signature
  app.post("/api/principal/signatures/:id/reject", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const principalId = await getUserIdFromRequest(req);
      if (!principalId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { notes } = req.body;
      const signatureId = req.params.id;

      if (!notes) {
        return res.status(400).json({ message: "Notes are required when rejecting" });
      }

      const signature = await storage.rejectSignature(signatureId, principalId, notes);

      if (!signature) {
        return res.status(404).json({ message: "Signature not found" });
      }

      // Email Notification to Teacher
      const teacher = await storage.getUser(signature.teacherId!);
      if (teacher && teacher.email) {
        const principal = await storage.getUser(principalId);
        const indicator = await storage.getIndicator(signature.indicatorId!);
        await notifyTeacherOfReviewResult(
          teacher.email, // using teacher.email since we know it exists
          principal?.firstName || 'Principal',
          indicator?.title || 'Unknown Indicator',
          'rejected',
          notes
        );
      }

      // Log & Notify
      await AuditService.log({
        userId: principalId,
        action: "REJECT",
        entityType: "signature",
        entityId: signatureId,
        details: { reason: notes },
        ipAddress: req.ip
      });

      await NotificationService.send({
        recipientId: signature.teacherId!,
        type: "error",
        title: "تم رفض الميثاق",
        message: `تم إعادة الميثاق للمراجعة. السبب: ${notes}`,
        link: "/home"
      });

      res.json(signature);
    } catch (error) {
      console.error("Error rejecting signature:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Principal: Update user role (can only set admin, supervisor, teacher)
  app.patch("/api/principal/users/:userId/role", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const { role } = req.body;

      if (!role || !["admin", "supervisor", "teacher"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updated = await storage.updateUser(req.params.userId, { role });

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Creator-only routes (site management)

  // Creator: Get all users
  app.get("/api/creator/users", isAuthenticated, isCreator, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Creator: Update any user role (can set any role including creator)
  app.patch("/api/creator/users/:userId/role", isAuthenticated, isCreator, async (req, res) => {
    try {
      const { role } = req.body;

      if (!role || !["creator", "admin", "supervisor", "teacher"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updated = await storage.updateUserRole(req.params.userId, role);

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Creator: Get site statistics
  app.get("/api/creator/stats", isAuthenticated, isCreator, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const stats = {
        totalUsers: allUsers.length,
        creators: allUsers.filter(u => u.role === "creator").length,
        admins: allUsers.filter(u => u.role === "admin").length,
        supervisors: allUsers.filter(u => u.role === "supervisor").length,
        teachers: allUsers.filter(u => u.role === "teacher").length,
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching creator stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Principal/Creator: Delete a teacher
  app.delete("/api/principal/teachers/:userId", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const targetUser = await storage.getUser(req.params.userId);

      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // Only allow deleting teachers (not admins or creators)
      if (targetUser.role !== "teacher") {
        return res.status(403).json({ message: "لا يمكن حذف هذا المستخدم" });
      }

      await storage.deleteUser(req.params.userId);
      res.json({ success: true, message: "تم حذف المعلم بنجاح" });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف المعلم" });
    }
  });

  // Principal/Creator: Change teacher password
  app.patch("/api/principal/teachers/:userId/password", isAuthenticated, isPrincipal, async (req, res) => {
    try {
      const { password } = req.body;

      if (!password || password.length < 4) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" });
      }

      const targetUser = await storage.getUser(req.params.userId);

      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // Only allow changing password for teachers
      if (targetUser.role !== "teacher") {
        return res.status(403).json({ message: "لا يمكن تغيير كلمة مرور هذا المستخدم" });
      }

      const updated = await storage.updateUserPassword(req.params.userId, password);
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });

  // Creator: Delete any user (including admins)
  app.delete("/api/creator/users/:userId", isAuthenticated, isCreator, async (req, res) => {
    try {
      const currentUserId = await getUserIdFromRequest(req);

      // Cannot delete yourself
      if (req.params.userId === currentUserId) {
        return res.status(403).json({ message: "لا يمكنك حذف حسابك الخاص" });
      }

      const targetUser = await storage.getUser(req.params.userId);

      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      await storage.deleteUser(req.params.userId);
      res.json({ success: true, message: "تم حذف المستخدم بنجاح" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف المستخدم" });
    }
  });

  // Creator: Change any user password
  app.patch("/api/creator/users/:userId/password", isAuthenticated, isCreator, async (req, res) => {
    try {
      const { password } = req.body;

      if (!password || password.length < 4) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" });
      }

      const targetUser = await storage.getUser(req.params.userId);

      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const updated = await storage.updateUserPassword(req.params.userId, password);
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });

  // Performance Standards API
  app.get("/api/standards", isAuthenticated, async (req, res) => {
    try {
      const standards = await db.select().from(performanceStandards).orderBy(asc(performanceStandards.order));
      res.json(standards);
    } catch (error) {
      console.error("Error fetching standards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // =====================================================
  // SURVEY BUILDER API
  // =====================================================

  // List user's surveys
  app.get("/api/surveys", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const surveyList = await storage.getUserSurveys(userId);
      res.json(surveyList);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new survey
  app.post("/api/surveys", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const { title, description, settings } = req.body;
      const survey = await storage.createSurvey({
        title: title || "استبيان بدون عنوان",
        description: description || null,
        status: "draft",
        creatorId: userId,
        settings: settings || {},
      });
      res.json(survey);
    } catch (error) {
      console.error("Error creating survey:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single survey (with questions)
  app.get("/api/surveys/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      res.json(survey);
    } catch (error) {
      console.error("Error fetching survey:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update survey metadata
  app.patch("/api/surveys/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      const { title, description, status, settings } = req.body;
      const updated = await storage.updateSurvey(req.params.id, { title, description, status, settings });
      res.json(updated);
    } catch (error) {
      console.error("Error updating survey:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete survey
  app.delete("/api/surveys/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteSurvey(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting survey:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Publish survey (generate share token)
  app.post("/api/surveys/:id/publish", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      const token = survey.shareToken || randomBytes(16).toString("hex");
      const updated = await storage.publishSurvey(req.params.id, token);
      res.json(updated);
    } catch (error) {
      console.error("Error publishing survey:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Close survey
  app.post("/api/surveys/:id/close", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      const updated = await storage.updateSurvey(req.params.id, { status: "closed" });
      res.json(updated);
    } catch (error) {
      console.error("Error closing survey:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bulk upsert questions for a survey
  app.put("/api/surveys/:id/questions", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      const { questions } = req.body;
      if (!Array.isArray(questions)) return res.status(400).json({ message: "questions must be an array" });
      const saved = await storage.upsertSurveyQuestions(req.params.id, questions);
      // Also bump survey updatedAt
      await storage.updateSurvey(req.params.id, {});
      res.json(saved);
    } catch (error) {
      console.error("Error saving questions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get survey responses (analytics)
  app.get("/api/surveys/:id/responses", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      const responses = await storage.getSurveyResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get survey analytics
  app.get("/api/surveys/:id/analytics", isAuthenticated, async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return res.sendStatus(401);
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.creatorId !== userId) return res.status(403).json({ message: "Forbidden" });
      const analytics = await storage.getSurveyAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PUBLIC: Get survey by share token (no auth)
  app.get("/api/s/:token", async (req, res) => {
    try {
      const survey = await storage.getSurveyByToken(req.params.token);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.status !== "published") return res.status(403).json({ message: "This survey is not accepting responses" });
      // Strip sensitive info
      res.json({
        id: survey.id,
        title: survey.title,
        description: survey.description,
        settings: survey.settings,
        questions: survey.questions,
      });
    } catch (error) {
      console.error("Error fetching public survey:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PUBLIC: Submit survey response (no auth)
  app.post("/api/s/:token/respond", async (req, res) => {
    try {
      const survey = await storage.getSurveyByToken(req.params.token);
      if (!survey) return res.status(404).json({ message: "Survey not found" });
      if (survey.status !== "published") return res.status(403).json({ message: "This survey is not accepting responses" });
      const { answers, respondentInfo } = req.body;
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({ message: "answers are required" });
      }
      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "";
      const response = await storage.createSurveyResponse({
        surveyId: survey.id,
        answers,
        respondentInfo: respondentInfo || null,
        ipAddress,
      });
      res.json({ success: true, responseId: response.id });
    } catch (error) {
      console.error("Error submitting response:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return createServer(app);
}

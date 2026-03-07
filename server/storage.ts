import {
  users,
  indicators,
  criteria,
  witnesses,
  strategies,
  userStrategies,
  capabilities,
  changes,
  signatures,
  performanceStandards,
  surveys,
  surveyQuestions,
  surveyResponses,
  nafesFiles,
  type User,
  type UpsertUser,
  type Indicator,
  type InsertIndicator,
  type Criteria,
  type InsertCriteria,
  type Witness,
  type InsertWitness,
  type NafesFile,
  type InsertNafesFile,
  type Strategy,
  type InsertStrategy,
  type Capability,
  type Change,
  type Signature,
  type InsertSignature,
  type IndicatorWithCriteria,
  type DashboardStats,
  type SignatureWithDetails,
  type PrincipalDashboardStats,
  type TeacherWithStats,
  type Survey,
  type InsertSurvey,
  type SurveyQuestion,
  type InsertSurveyQuestion,
  type SurveyResponse,
  type InsertSurveyResponse,
  type SurveyWithQuestions,
  type SurveyAnalytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { CycleService } from "./services/cycles";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  getAllTeachers(): Promise<TeacherWithStats[]>;

  getIndicators(userId?: string): Promise<IndicatorWithCriteria[]>;
  getIndicator(id: string): Promise<IndicatorWithCriteria | undefined>;
  createIndicator(data: InsertIndicator): Promise<Indicator>;
  updateIndicator(id: string, data: Partial<InsertIndicator>): Promise<Indicator | undefined>;
  deleteIndicator(id: string): Promise<boolean>;

  getCriteria(indicatorId: string): Promise<Criteria[]>;
  getCriteriaById(id: string): Promise<Criteria | undefined>;
  createCriteria(data: InsertCriteria): Promise<Criteria>;
  updateCriteria(id: string, data: Partial<InsertCriteria>): Promise<Criteria | undefined>;
  deleteCriteria(id: string): Promise<boolean>;

  getWitnesses(indicatorId?: string): Promise<Witness[]>;
  getWitnessById(id: string): Promise<Witness | undefined>;
  createWitness(data: InsertWitness): Promise<Witness>;
  deleteWitness(id: string): Promise<boolean>;

  getStrategies(): Promise<Strategy[]>;
  createStrategy(data: InsertStrategy): Promise<Strategy>;

  getUserStrategies(userId: string): Promise<Strategy[]>;
  setUserStrategies(userId: string, strategyIds: string[]): Promise<void>;

  getCapabilities(): Promise<Capability[]>;
  getChanges(): Promise<Change[]>;

  getStats(userId?: string): Promise<DashboardStats>;
  getPrincipalStats(): Promise<PrincipalDashboardStats>;
  reEvaluateIndicators(indicatorIds: string[]): Promise<void>;

  // Signature methods
  createSignature(data: InsertSignature): Promise<Signature>;
  getSignature(id: string): Promise<SignatureWithDetails | undefined>;
  getSignaturesByTeacher(teacherId: string): Promise<SignatureWithDetails[]>;
  getPendingSignatures(): Promise<SignatureWithDetails[]>;
  updateSignature(id: string, data: Partial<InsertSignature>): Promise<Signature | undefined>;
  approveSignature(id: string, principalId: string, notes?: string): Promise<Signature | undefined>;
  rejectSignature(id: string, principalId: string, notes?: string): Promise<Signature | undefined>;

  // Creator methods (site management)
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  updateUserPassword(userId: string, password: string): Promise<User | undefined>;

  // Custom auth methods
  findTeacherByName(firstName: string, lastName: string): Promise<User | undefined>;
  findUserByRole(role: string): Promise<User | undefined>;
  findUserByMobile(mobileNumber: string): Promise<User | undefined>;

  // Default indicators
  seedDefaultIndicators(userId: string): Promise<void>;
  hasIndicators(userId: string): Promise<boolean>;

  // Survey methods
  createSurvey(data: InsertSurvey): Promise<Survey>;
  getSurvey(id: string): Promise<SurveyWithQuestions | undefined>;
  getSurveyByToken(token: string): Promise<SurveyWithQuestions | undefined>;
  getUserSurveys(userId: string): Promise<SurveyWithQuestions[]>;
  updateSurvey(id: string, data: Partial<InsertSurvey>): Promise<Survey | undefined>;
  deleteSurvey(id: string): Promise<boolean>;
  publishSurvey(id: string, token: string): Promise<Survey | undefined>;
  upsertSurveyQuestions(surveyId: string, questions: Omit<InsertSurveyQuestion, 'surveyId'>[]): Promise<SurveyQuestion[]>;
  createSurveyResponse(data: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponses(surveyId: string): Promise<SurveyResponse[]>;
  getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics>;

  // Nafes Files methods
  createNafesFile(data: InsertNafesFile): Promise<NafesFile>;
  getNafesFiles(userId?: string): Promise<NafesFile[]>;
  deleteNafesFile(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getIndicators(userId?: string): Promise<IndicatorWithCriteria[]> {
    const activeCycle = await CycleService.getActiveCycle();

    let baseQuery = db.select().from(indicators);

    if (userId) {
      baseQuery = baseQuery.where(
        and(
          eq(indicators.userId, userId),
          eq(indicators.academicCycleId, activeCycle.id)
        )
      ) as any;
    } else {
      baseQuery = baseQuery.where(eq(indicators.academicCycleId, activeCycle.id)) as any;
    }

    const indicatorsList = await baseQuery.orderBy(indicators.order);

    const result: IndicatorWithCriteria[] = [];

    for (const indicator of indicatorsList) {
      const criteriaList = await db.select().from(criteria).where(eq(criteria.indicatorId, indicator.id)).orderBy(criteria.order);

      const exactWitnesses = await db.select().from(witnesses).where(eq(witnesses.indicatorId, indicator.id));
      let standardWitnesses: any[] = [];
      if (indicator.performanceStandardId && indicator.userId) {
        standardWitnesses = await db.select().from(witnesses).where(
          and(
            eq(witnesses.performanceStandardId, indicator.performanceStandardId),
            eq(witnesses.userId, indicator.userId)
          )
        );
      }

      const allWitnesses = [...exactWitnesses];
      for (const sw of standardWitnesses) {
        if (!allWitnesses.find(w => w.id === sw.id)) {
          allWitnesses.push(sw);
        }
      }

      const performanceStandardInfo = indicator.performanceStandardId
        ? await db.select().from(performanceStandards).where(eq(performanceStandards.id, indicator.performanceStandardId)).limit(1).then(res => res[0])
        : undefined;

      result.push({
        ...indicator,
        criteria: criteriaList,
        witnesses: allWitnesses,
        performanceStandard: performanceStandardInfo,
      });
    }

    return result;
  }

  async getIndicator(id: string): Promise<IndicatorWithCriteria | undefined> {
    const [indicator] = await db.select().from(indicators).where(eq(indicators.id, id));
    if (!indicator) return undefined;

    const criteriaList = await db.select().from(criteria).where(eq(criteria.indicatorId, id)).orderBy(criteria.order);
    const performanceStandardInfo = indicator.performanceStandardId
      ? await db.select().from(performanceStandards).where(eq(performanceStandards.id, indicator.performanceStandardId)).limit(1).then(res => res[0])
      : undefined;

    return {
      ...indicator,
      criteria: criteriaList,
      performanceStandard: performanceStandardInfo
    };
  }

  async createIndicator(data: InsertIndicator): Promise<Indicator> {
    const activeCycle = await CycleService.getActiveCycle();
    const [indicator] = await db.insert(indicators).values({
      ...data,
      academicCycleId: activeCycle.id
    }).returning();
    return indicator;
  }

  async updateIndicator(id: string, data: Partial<InsertIndicator>): Promise<Indicator | undefined> {
    const [updated] = await db
      .update(indicators)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(indicators.id, id))
      .returning();
    return updated;
  }

  async deleteIndicator(id: string): Promise<boolean> {
    const result = await db.delete(indicators).where(eq(indicators.id, id));
    return true;
  }

  async getCriteria(indicatorId: string): Promise<Criteria[]> {
    return db.select().from(criteria).where(eq(criteria.indicatorId, indicatorId)).orderBy(criteria.order);
  }

  async getCriteriaById(id: string): Promise<Criteria | undefined> {
    const [criterion] = await db.select().from(criteria).where(eq(criteria.id, id));
    return criterion;
  }

  async createCriteria(data: InsertCriteria): Promise<Criteria> {
    const [criterion] = await db.insert(criteria).values(data).returning();
    return criterion;
  }

  async updateCriteria(id: string, data: Partial<InsertCriteria>): Promise<Criteria | undefined> {
    const [updated] = await db
      .update(criteria)
      .set(data)
      .where(eq(criteria.id, id))
      .returning();
    return updated;
  }

  async deleteCriteria(id: string): Promise<boolean> {
    await db.delete(criteria).where(eq(criteria.id, id));
    return true;
  }

  async getWitnesses(indicatorId?: string): Promise<Witness[]> {
    if (indicatorId) {
      const indicator = await this.getIndicator(indicatorId);
      const exactWitnesses = await db.select().from(witnesses).where(eq(witnesses.indicatorId, indicatorId));
      let standardWitnesses: Witness[] = [];
      if (indicator && indicator.performanceStandardId && indicator.userId) {
        standardWitnesses = await db.select().from(witnesses).where(
          and(
            eq(witnesses.performanceStandardId, indicator.performanceStandardId),
            eq(witnesses.userId, indicator.userId)
          )
        );
      }

      const allWitnesses = [...exactWitnesses];
      for (const sw of standardWitnesses) {
        if (!allWitnesses.find(w => w.id === sw.id)) {
          allWitnesses.push(sw);
        }
      }
      return allWitnesses;
    }
    return db.select().from(witnesses);
  }

  async getWitnessById(id: string): Promise<Witness | undefined> {
    const [witness] = await db.select().from(witnesses).where(eq(witnesses.id, id));
    return witness;
  }

  async createWitness(data: InsertWitness): Promise<Witness> {
    const [witness] = await db.insert(witnesses).values(data).returning();

    if (data.indicatorId) {
      const witnessCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(witnesses)
        .where(eq(witnesses.indicatorId, data.indicatorId));

      await db
        .update(indicators)
        .set({ witnessCount: Number(witnessCount[0]?.count || 0), updatedAt: new Date() })
        .where(eq(indicators.id, data.indicatorId));
    }

    return witness;
  }

  async deleteWitness(id: string): Promise<boolean> {
    const [witness] = await db.select().from(witnesses).where(eq(witnesses.id, id));

    await db.delete(witnesses).where(eq(witnesses.id, id));

    if (witness?.indicatorId) {
      const witnessCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(witnesses)
        .where(eq(witnesses.indicatorId, witness.indicatorId));

      await db
        .update(indicators)
        .set({ witnessCount: Number(witnessCount[0]?.count || 0), updatedAt: new Date() })
        .where(eq(indicators.id, witness.indicatorId));
    }

    return true;
  }

  async getStrategies(): Promise<Strategy[]> {
    return db.select().from(strategies).where(eq(strategies.isActive, true));
  }

  async createStrategy(data: InsertStrategy): Promise<Strategy> {
    const [strategy] = await db.insert(strategies).values(data).returning();
    return strategy;
  }

  async getUserStrategies(userId: string): Promise<Strategy[]> {
    const userStrategyList = await db
      .select()
      .from(userStrategies)
      .where(eq(userStrategies.userId, userId));

    if (userStrategyList.length === 0) return [];

    const strategyIds = userStrategyList.map(us => us.strategyId).filter((id): id is string => id !== null);

    if (strategyIds.length === 0) return [];

    const result: Strategy[] = [];
    for (const id of strategyIds) {
      const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
      if (strategy) result.push(strategy);
    }

    return result;
  }

  async setUserStrategies(userId: string, strategyIds: string[]): Promise<void> {
    await db.delete(userStrategies).where(eq(userStrategies.userId, userId));

    if (strategyIds.length > 0) {
      await db.insert(userStrategies).values(
        strategyIds.map(strategyId => ({
          userId,
          strategyId,
        }))
      );
    }
  }

  async getCapabilities(): Promise<Capability[]> {
    return db.select().from(capabilities).orderBy(capabilities.order);
  }

  async getChanges(): Promise<Change[]> {
    return db.select().from(changes).orderBy(changes.order);
  }

  async getStats(userId?: string): Promise<DashboardStats> {
    const indicatorsList = userId
      ? await db.select().from(indicators).where(eq(indicators.userId, userId))
      : await db.select().from(indicators);

    const capabilitiesList = await db.select().from(capabilities);
    const changesList = await db.select().from(changes);
    const witnessesList = userId
      ? await db.select().from(witnesses).where(eq(witnesses.userId, userId))
      : await db.select().from(witnesses);

    const totalIndicators = indicatorsList.length;
    const completedIndicators = indicatorsList.filter(i => i.status === "completed").length;
    const pendingIndicators = indicatorsList.filter(i => i.status === "pending").length;
    const inProgressIndicators = indicatorsList.filter(i => i.status === "in_progress").length;
    const totalWitnesses = witnessesList.length;

    return {
      totalCapabilities: capabilitiesList.length || 12,
      totalChanges: changesList.length || 12,
      totalIndicators,
      completedIndicators,
      pendingIndicators,
      inProgressIndicators,
      totalWitnesses,
    };
  }

  async reEvaluateIndicators(indicatorIds: string[]): Promise<void> {
    for (const id of indicatorIds) {
      await db
        .update(indicators)
        .set({ status: "pending", witnessCount: 0, updatedAt: new Date() })
        .where(eq(indicators.id, id));

      await db
        .update(criteria)
        .set({ isCompleted: false })
        .where(eq(criteria.indicatorId, id));

      await db.delete(witnesses).where(eq(witnesses.indicatorId, id));
    }
  }

  // Get all teachers with their stats
  async getAllTeachers(): Promise<TeacherWithStats[]> {
    const teachersList = await db.select().from(users).where(eq(users.role, "teacher"));

    const result: TeacherWithStats[] = [];
    for (const teacher of teachersList) {
      const teacherIndicators = await db.select().from(indicators).where(eq(indicators.userId, teacher.id));
      const pendingSignatures = await db.select().from(signatures).where(
        and(eq(signatures.teacherId, teacher.id), eq(signatures.status, "pending"))
      );

      result.push({
        ...teacher,
        indicatorCount: teacherIndicators.length,
        completedCount: teacherIndicators.filter(i => i.status === "completed").length,
        pendingApprovalCount: pendingSignatures.length,
      });
    }

    return result;
  }

  // Principal dashboard stats
  async getPrincipalStats(): Promise<PrincipalDashboardStats> {
    const baseStats = await this.getStats();

    const allTeachers = await db.select().from(users).where(eq(users.role, "teacher"));
    const allSignatures = await db.select().from(signatures);

    return {
      ...baseStats,
      totalTeachers: allTeachers.length,
      pendingApprovals: allSignatures.filter(s => s.status === "pending").length,
      approvedIndicators: allSignatures.filter(s => s.status === "approved").length,
      rejectedIndicators: allSignatures.filter(s => s.status === "rejected").length,
    };
  }

  // Signature methods
  async createSignature(data: InsertSignature): Promise<Signature> {
    const activeCycle = await CycleService.getActiveCycle();
    const [signature] = await db.insert(signatures).values({
      ...data,
      academicCycleId: activeCycle.id
    }).returning();
    return signature;
  }

  async getSignature(id: string): Promise<SignatureWithDetails | undefined> {
    const [signature] = await db.select().from(signatures).where(eq(signatures.id, id));
    if (!signature) return undefined;

    const teacher = signature.teacherId ? await this.getUser(signature.teacherId) : undefined;
    const principal = signature.principalId ? await this.getUser(signature.principalId) : undefined;
    const indicator = signature.indicatorId ? await this.getIndicator(signature.indicatorId) : undefined;

    return {
      ...signature,
      teacher,
      principal,
      indicator,
    };
  }

  async getSignaturesByTeacher(teacherId: string): Promise<SignatureWithDetails[]> {
    const signaturesList = await db.select().from(signatures).where(eq(signatures.teacherId, teacherId));

    const result: SignatureWithDetails[] = [];
    for (const signature of signaturesList) {
      const teacher = signature.teacherId ? await this.getUser(signature.teacherId) : undefined;
      const principal = signature.principalId ? await this.getUser(signature.principalId) : undefined;
      const indicator = signature.indicatorId ? await this.getIndicator(signature.indicatorId) : undefined;

      result.push({
        ...signature,
        teacher,
        principal,
        indicator,
      });
    }

    return result;
  }

  async getPendingSignatures(): Promise<SignatureWithDetails[]> {
    const signaturesList = await db.select().from(signatures).where(eq(signatures.status, "pending"));

    const result: SignatureWithDetails[] = [];
    for (const signature of signaturesList) {
      const teacher = signature.teacherId ? await this.getUser(signature.teacherId) : undefined;
      const principal = signature.principalId ? await this.getUser(signature.principalId) : undefined;
      const indicator = signature.indicatorId ? await this.getIndicator(signature.indicatorId) : undefined;

      result.push({
        ...signature,
        teacher,
        principal,
        indicator,
      });
    }

    return result;
  }

  async updateSignature(id: string, data: Partial<InsertSignature>): Promise<Signature | undefined> {
    const [updated] = await db
      .update(signatures)
      .set(data)
      .where(eq(signatures.id, id))
      .returning();
    return updated;
  }

  async approveSignature(id: string, principalId: string, notes?: string): Promise<Signature | undefined> {
    const [updated] = await db
      .update(signatures)
      .set({
        status: "approved",
        principalId,
        notes,
        signedAt: new Date(),
      })
      .where(eq(signatures.id, id))
      .returning();
    return updated;
  }

  async rejectSignature(id: string, principalId: string, notes?: string): Promise<Signature | undefined> {
    const [updated] = await db
      .update(signatures)
      .set({
        status: "rejected",
        principalId,
        notes,
        signedAt: new Date(),
      })
      .where(eq(signatures.id, id))
      .returning();
    return updated;
  }

  // Creator methods (site management)
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Delete all related data first (cascade)
    // Delete signatures
    await db.delete(signatures).where(eq(signatures.teacherId, userId));
    // Delete user strategies
    await db.delete(userStrategies).where(eq(userStrategies.userId, userId));
    // Get all indicators for user
    const userIndicators = await db.select().from(indicators).where(eq(indicators.userId, userId));
    for (const indicator of userIndicators) {
      // Delete witnesses for each indicator
      await db.delete(witnesses).where(eq(witnesses.indicatorId, indicator.id));
      // Delete criteria for each indicator
      await db.delete(criteria).where(eq(criteria.indicatorId, indicator.id));
    }
    // Delete all indicators for user
    await db.delete(indicators).where(eq(indicators.userId, userId));
    // Finally delete the user
    const result = await db.delete(users).where(eq(users.id, userId));
    return true;
  }

  async updateUserPassword(userId: string, password: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ password, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Custom auth methods
  async findTeacherByName(firstName: string, lastName: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.firstName, firstName),
          eq(users.lastName, lastName),
          eq(users.role, "teacher")
        )
      );
    return user;
  }

  async findUserByMobile(mobileNumber: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.mobileNumber, mobileNumber))
      .limit(1);
    return user;
  }

  async findUserByRole(role: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.role, role))
      .limit(1);
    return user;
  }

  // Seed default indicators for a new user
  async seedDefaultIndicators(userId: string): Promise<void> {
    // Check if user already has indicators
    const existingIndicators = await db.select().from(indicators).where(eq(indicators.userId, userId));
    if (existingIndicators.length > 0) {
      return; // User already has indicators, don't seed
    }

    const defaultIndicators = [
      {
        title: "أداء الواجبات الوظيفية",
        description: "الالتزام بالدوام الرسمي، الحصص، المناوبة، والإشراف.",
        criteria: [
          "سجل الدوام الرسمي (حضور وانصراف)",
          "سجل المناوبة والإشراف اليومي",
          "سجل حصص الانتظار",
          "خطة توزيع المنهج المعتمدة"
        ],
        weight: 10
      },
      {
        title: "التفاعل مع المجتمع المهني",
        description: "المشاركة في مجتمعات التعلم، الدورات، والزيارات المتبادلة.",
        criteria: [
          "سجل لقاءات مجتمعات التعلم المهنية",
          "استمارة تبادل زيارات صفية",
          "شهادات حضور دورات تدريبية",
          "تقرير تنفيذ درس تطبيقي"
        ],
        weight: 10
      },
      {
        title: "التفاعل مع أولياء الأمور",
        description: "التواصل الفعال مع الأسرة وإشراكهم في تعلم الطالب.",
        criteria: [
          "سجل التواصل مع أولياء الأمور",
          "محاضر اجتماعات الجمعية العمومية",
          "نماذج إشعارات مستوى الطلاب المرسلة",
          "صورة من تفعيل الخطة الأسبوعية"
        ],
        weight: 10
      },
      {
        title: "التنويع في استراتيجيات التدريس",
        description: "استخدام طرق تدريس متنوعة تراعي الفروق الفردية.",
        criteria: [
          "تقرير عن استراتيجيات التدريس المطبقة",
          "صور من تنفيذ الدروس (التعلم النشط)",
          "ملف معالجة الفروق الفردية",
          "نماذج من تخطيط الدروس المتمايزة"
        ],
        weight: 10
      },
      {
        title: "تحسين نتائج المتعلمين",
        description: "رفع مستوى التحصيل الدراسي ومعالجة الفاقد التعليمي.",
        criteria: [
          "نتائج الاختبارات القبلية والبعدية",
          "سجل الخطط العلاجية للطلاب المتعثرين",
          "سجل الخطط الإثرائية للموهوبين",
          "شواهد تكريم الطلاب المتميزين"
        ],
        weight: 10
      },
      {
        title: "إعداد وتنفيذ خطة التعلم",
        description: "التخطيط المتقن للدروس والواجبات والاختبارات.",
        criteria: [
          "سجل إعداد الدروس (تحضير)",
          "نماذج من الواجبات المنزلية المصححة",
          "نماذج من الاختبارات القصيرة",
          "تقرير تنفيذ المنهج الدراسي"
        ],
        weight: 10
      },
      {
        title: "توظيف تقنيات التعلم",
        description: "دمج التقنية والوسائل التعليمية في العملية التربوية.",
        criteria: [
          "صور استخدام الوسائل التعليمية بالفصل",
          "روابط دروس تفاعلية أو إثرائية",
          "تقرير استخدام المنصات التعليمية",
          "نماذج من إنتاج محتوى رقمي"
        ],
        weight: 10
      },
      {
        title: "تهيئة البيئة التعليمية",
        description: "توفير بيئة صفية محفزة وآمنة نفسياً ومادياً.",
        criteria: [
          "صور من تنظيم البيئة الصفية",
          "تقرير عن الحوافز والتعزيز المقدم للطلاب",
          "قوائم تصنيف الطلاب حسب أنماط التعلم"
        ],
        weight: 5
      },
      {
        title: "الإدارة الصفية",
        description: "ضبط السلوك الصفي واستثمار وقت التعلم بفاعلية.",
        criteria: [
          "سجل متابعة حضور وغياب الطلاب",
          "قواعد السلوك والمواظبة الصفية",
          "كشف رصد المخالفات السلوكية والإجراءات"
        ],
        weight: 5
      },
      {
        title: "تحليل نتائج المتعلمين",
        description: "تشخيص واقع التحصيل الدراسي وتحديد نقاط القوة والضعف.",
        criteria: [
          "تقرير التحليل الإحصائي لنتائج الاختبارات",
          "بيان تصنيف الطلاب حسب المستويات",
          "تقرير دراسة الفاقد التعليمي"
        ],
        weight: 10
      },
      {
        title: "تنوع أساليب التقويم",
        description: "استخدام أدوات قياس متنوعة وشاملة.",
        criteria: [
          "نماذج اختبارات (ورقية/إلكترونية)",
          "سلالم تقدير للمشاريع والمهام الأدائية",
          "ملفات إنجاز الطلاب (عينات)",
          "بنك أسئلة متنوع المستويات"
        ],
        weight: 10
      }
    ];

    // Create indicators and their criteria
    for (let i = 0; i < defaultIndicators.length; i++) {
      const indicatorData = defaultIndicators[i];

      const standardId = i + 1;
      const [indicator] = await db.insert(indicators).values({
        title: indicatorData.title,
        description: indicatorData.description,
        status: "pending",
        witnessCount: 0,
        userId: userId,
        order: i + 1,
        weight: indicatorData.weight,
        performanceStandardId: standardId
      }).returning();

      // Create criteria for this indicator
      for (let j = 0; j < indicatorData.criteria.length; j++) {
        await db.insert(criteria).values({
          indicatorId: indicator.id,
          title: indicatorData.criteria[j],
          isCompleted: false,
          order: j + 1
        });
      }
    }
  }

  // Check if user has indicators
  async hasIndicators(userId: string): Promise<boolean> {
    const existingIndicators = await db.select().from(indicators).where(eq(indicators.userId, userId));
    return existingIndicators.length > 0;
  }

  // ============================================================
  // SURVEY METHODS
  // ============================================================
  async createSurvey(data: InsertSurvey): Promise<Survey> {
    const [survey] = await db.insert(surveys).values(data as any).returning();
    return survey;
  }

  private async _attachQuestionsAndCount(survey: Survey): Promise<SurveyWithQuestions> {
    const questions = await db
      .select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, survey.id))
      .orderBy(surveyQuestions.order);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, survey.id));
    return { ...survey, questions, responseCount: Number(count) };
  }

  async getSurvey(id: string): Promise<SurveyWithQuestions | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    if (!survey) return undefined;
    return this._attachQuestionsAndCount(survey);
  }

  async getSurveyByToken(token: string): Promise<SurveyWithQuestions | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.shareToken, token));
    if (!survey) return undefined;
    return this._attachQuestionsAndCount(survey);
  }

  async getUserSurveys(userId: string): Promise<SurveyWithQuestions[]> {
    const surveyList = await db
      .select()
      .from(surveys)
      .where(eq(surveys.creatorId, userId))
      .orderBy(desc(surveys.updatedAt));
    return Promise.all(surveyList.map(s => this._attachQuestionsAndCount(s)));
  }

  async updateSurvey(id: string, data: Partial<InsertSurvey>): Promise<Survey | undefined> {
    const [updated] = await db
      .update(surveys)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return updated;
  }

  async deleteSurvey(id: string): Promise<boolean> {
    await db.delete(surveys).where(eq(surveys.id, id));
    return true;
  }

  async publishSurvey(id: string, token: string): Promise<Survey | undefined> {
    const [updated] = await db
      .update(surveys)
      .set({ status: "published", shareToken: token, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return updated;
  }

  async upsertSurveyQuestions(
    surveyId: string,
    questions: Omit<InsertSurveyQuestion, 'surveyId'>[]
  ): Promise<SurveyQuestion[]> {
    // Delete existing questions then re-insert (simpler than diff updating)
    await db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId));
    if (questions.length === 0) return [];
    const rows = await db
      .insert(surveyQuestions)
      .values(questions.map((q, i) => ({ ...q, surveyId, order: i })) as any)
      .returning();
    return rows;
  }

  async createSurveyResponse(data: InsertSurveyResponse): Promise<SurveyResponse> {
    const [response] = await db.insert(surveyResponses).values(data).returning();
    return response;
  }

  async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    return db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId))
      .orderBy(desc(surveyResponses.completedAt));
  }

  async getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const survey = await this.getSurvey(surveyId);
    const responses = await this.getSurveyResponses(surveyId);

    const questionBreakdown: SurveyAnalytics['questionBreakdown'] = {};

    if (survey) {
      for (const q of survey.questions) {
        const answers = responses
          .map(r => (r.answers as Record<string, unknown>)[q.id])
          .filter(a => a !== undefined && a !== null && a !== '');

        const counts: Record<string, number> = {};
        if (['multiple_choice', 'dropdown', 'checkbox', 'rating', 'scale'].includes(q.type)) {
          for (const a of answers) {
            const keys = Array.isArray(a) ? a as string[] : [String(a)];
            for (const k of keys) {
              counts[k] = (counts[k] || 0) + 1;
            }
          }
        }

        questionBreakdown[q.id] = {
          type: q.type,
          title: q.title,
          answers,
          counts: Object.keys(counts).length > 0 ? counts : undefined,
        };
      }
    }

    return {
      totalResponses: responses.length,
      completionRate: responses.length > 0 ? 100 : 0,
      questionBreakdown,
    };
  }

  // Nafes Files implementation
  async createNafesFile(data: InsertNafesFile): Promise<NafesFile> {
    const [file] = await db.insert(nafesFiles).values(data).returning();
    return file;
  }

  async getNafesFiles(userId?: string): Promise<NafesFile[]> {
    if (userId) {
      return db.select().from(nafesFiles).where(eq(nafesFiles.userId, userId)).orderBy(desc(nafesFiles.createdAt));
    }
    return db.select().from(nafesFiles).orderBy(desc(nafesFiles.createdAt));
  }

  async deleteNafesFile(id: string): Promise<boolean> {
    await db.delete(nafesFiles).where(eq(nafesFiles.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();

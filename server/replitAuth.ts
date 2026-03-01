import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Only set up Replit OIDC when running on Replit (REPL_ID is set)
  if (process.env.REPL_ID) {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    const registeredStrategies = new Set<string>();

    const ensureStrategy = (domain: string) => {
      const strategyName = `replitauth:${domain}`;
      if (!registeredStrategies.has(strategyName)) {
        const strategy = new Strategy(
          {
            name: strategyName,
            config,
            scope: "openid email profile offline_access",
            callbackURL: `https://${domain}/api/callback`,
          },
          verify,
        );
        passport.use(strategy);
        registeredStrategies.add(strategyName);
      }
    };

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      ensureStrategy(req.hostname);
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      ensureStrategy(req.hostname);
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  } else {
    // Local development: simple session serialization only
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    console.log("ℹ️  Running locally: Replit OIDC skipped. Using custom session auth.");
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check session-based auth first (custom login)
  const sessionUserId = (req.session as any)?.userId;
  if (sessionUserId) {
    return next();
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // Local users won't have expires_at
  if (!user.expires_at) {
    return next();
  }

  // Replit OAuth token check
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Helper function to get userId from session or OAuth
async function getUserIdFromRequest(req: any): Promise<string | null> {
  // Check session-based auth first (custom login)
  const sessionUserId = (req.session as any)?.userId;
  if (sessionUserId) {
    return sessionUserId;
  }

  const user = req.user as any;
  if (!user) return null;

  // Local user has an ID
  if (user.id) return user.id;

  // Fall back to Replit OAuth
  return user?.claims?.sub || null;
}

// Middleware to check if user is the site creator (highest permission level)
export const isCreator: RequestHandler = async (req, res, next) => {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || dbUser.role !== "creator") {
      return res.status(403).json({ message: "Forbidden - Creator access required" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user is a principal (admin role) or creator
export const isPrincipal: RequestHandler = async (req, res, next) => {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "creator")) {
      return res.status(403).json({ message: "Forbidden - Principal access required" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user is a supervisor (or higher)
export const isSupervisor: RequestHandler = async (req, res, next) => {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "supervisor" && dbUser.role !== "creator")) {
      return res.status(403).json({ message: "Forbidden - Supervisor access required" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Export helper function for use in routes
export { getUserIdFromRequest };

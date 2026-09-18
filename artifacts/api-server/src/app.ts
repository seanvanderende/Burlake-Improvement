import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is required but was not provided.",
  );
}

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Default body-parser limit is 100kb, which is too small for bulk CSV product
// imports (each chunk of parsed rows is sent as a JSON array) and multi-item
// admin bulk edits. Raise it well above any realistic catalog import size.
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
const PgSession = connectPgSimple(session);

app.use(
  session({
    // Persist sessions in Postgres (already provisioned) instead of the
    // in-memory default, which loses every session on restart and isn't
    // shared across autoscale instances — staff/customers would get
    // randomly logged out depending on which instance handled a request.
    // `createTableIfMissing` sets up the `session` table on first boot.
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/api", router);

export default app;

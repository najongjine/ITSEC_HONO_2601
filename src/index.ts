import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HonoEnv, ResultType } from "./types/types.js";
import * as dotenv from "dotenv";
import { dbMiddleware } from "./db/neonvercel_db.js";

const envFile =
  process.env.NODE_ENV == "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const app = new Hono<HonoEnv>();
app.use("*", cors()); // cors 허용
app.use("*", dbMiddleware);

//http://localhost:3000
app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.get("/test", (c) => {
  let result: ResultType = { success: true };
  try {
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});

import testRouter from "./router/test_router.js";
app.route("/api/test", testRouter);

import userRouter from "./router/user_router.js";
app.route("/api/user", userRouter);

import boardRouter from "./router/board_router.js";
app.route("/api/board", boardRouter);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

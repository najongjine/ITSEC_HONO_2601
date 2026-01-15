import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { ResultType } from "./types/types.js";
import * as dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV == "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const app = new Hono();

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

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

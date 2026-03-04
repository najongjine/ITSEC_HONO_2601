import { Hono } from "hono";
import type { HonoEnv, ResultType } from "../types/types.js";

const router = new Hono<HonoEnv>();

router.post("/insert_embedding", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    const body = await c.req.json();
    let title = body?.title ?? "";
    let content = body?.content ?? "";
    if (!title || !content) {
      result.success = false;
      result.msg = "!error. title or content is required";
      return c.json(result);
    }

    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});
export default router;

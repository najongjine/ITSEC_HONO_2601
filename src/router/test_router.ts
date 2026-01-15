import { Hono } from "hono";
import type { HonoEnv, ResultType } from "../types/types.js";

const router = new Hono<HonoEnv>();

router.get("/db_select_test", async (c) => {
  let result: ResultType = { success: true };
  try {
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});

export default router;

import { Hono } from "hono";
import type { HonoEnv, ResultType } from "../types/types.js";

const router = new Hono<HonoEnv>();

router.get("/db_select_test", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    let _data = await db.query(
      `
        SELECT NOW();
        `,
      [],
    );
    result.data = _data;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});

router.get("/query_string", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    let mydata = c.req.query("mydata");
    let mydata2 = c.req.query("mydata2");
    result.data = { mydata, mydata2 };
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});
router.post("/register", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    const body = await c.req.parseBody({ all: true });
    let username = String(body["username"]);
    username = username?.trim() || "";
    let password = String(body["password"]);
    password = password?.trim() || "";

    if (!username || !password) {
      result.success = false;
      result.msg = "!error. username or password is required";
      return c.json(result);
    }

    let _data = await db.query(
      `
        SELECT * FROM users WHERE username = $1;
        `,
      [username],
    );

    if (_data.rows.length > 0) {
      result.success = false;
      result.msg = "!error. username already exists";
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

import { Hono } from "hono";
import type { HonoEnv, ResultType } from "../types/types.js";
import {
  hashPassword,
  generateToken,
  comparePassword,
  verifyToken,
} from "../utils/utils.js";

const router = new Hono<HonoEnv>();

router.get("/get_memo_by_id", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    let id = Number(c.req.query("id") || 0);
    let _data: any = await db.query(
      `
        SELECT
        b.id
        ,b.user_id as userId
        ,b.title
        ,b.content
        ,b.created_dt as createdDt
        ,b.updated_dt as updatedDt
        ,b.html as htmlContent
        ,b.json as jsonContent
        FROM t_board as b
        LEFT JOIN t_user as u ON u.id=b.user_id
        WHERE b.id = $1
        ORDER BY b.id DESC
        
        `,
      [id],
    );
    _data = _data.rows[0] || {};
    result.data = _data;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});

/** username, password 가 맞으면 token 만들어서
 * register 의 응답 형식과 똑같이 해주면 되요
 */
router.post("/upsert", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      result.success = false;
      result.msg = "!error. 토큰이 유효하지 않습니다(Header).";
      return c.json(result);
    }

    const token = authHeader.split(" ")[1];
    let userData: any = verifyToken(token);
    console.log(`userData: `, userData?.id);
    if (!userData) {
      result.success = false;
      result.msg = "!error. 토큰이 유효하지 않습니다(verify).";
      return c.json(result);
    }

    const body = await c.req.parseBody({ all: true });
    let title = String(body["title"] || "");
    title = title?.trim() || "";
    let content = String(body["content"] || "");
    content = content?.trim() || "";

    if (!title || !content) {
      result.success = false;
      result.msg = "!error. 제목과 내용은 필수로 입력 해야되요";
      return c.json(result);
    }

    let _data: any = await db.query(
      `
        INSERT INTO t_board (title, content, user_id) 
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
      [title, content, userData?.id],
    );

    if (!_data?.rows?.length) {
      result.success = false;
      result.msg = "!error. 게시글 작성 실패";
      return c.json(result);
    }
    _data = _data?.rows[0] || {};
    result.data = _data;

    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});

export default router;

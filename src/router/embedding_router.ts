import { Hono } from "hono";
import type { HonoEnv, ResultType } from "../types/types.js";

const router = new Hono<HonoEnv>();

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(
      "https://wildojisan-rag-hf-wildojisan.hf.space/embedding/text_to_embedding",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      },
    );
    if (!response.ok) return null;
    const json: any = await response.json();
    if (json?.success && json?.data?.embedding) {
      return json.data.embedding;
    }
    return null;
  } catch (error) {
    console.error("Embedding API error:", error);
    return null;
  }
}

router.post("/insert_embedding", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    const body = await c.req.parseBody();
    let title = (body?.title as string) ?? "";
    let content = (body?.content as string) ?? "";
    if (!title || !content) {
      result.success = false;
      result.msg = "!error. title or content is required";
      return c.json(result);
    }

    const titleEmbedding = await getEmbedding(title);
    const contentEmbedding = await getEmbedding(content);

    let _data: any = await db.query(
      `
        INSERT INTO t_test_textembedding (title, title_embedding, content, content_embedding) 
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `,
      [
        title,
        titleEmbedding ? JSON.stringify(titleEmbedding) : null,
        content,
        contentEmbedding ? JSON.stringify(contentEmbedding) : null,
      ],
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

router.get("/search_embedding", async (c) => {
  let result: ResultType = { success: true };
  const db = c.var.db;
  try {
    let query = String(c?.req?.query("query")) ?? "";
    if (!query) {
      result.success = false;
      result.msg = "!error. query is required";
      return c.json(result);
    }
    /* 사용자의 query(검색어) 를 ai 서버에 보내서 임베딩화 하기  */
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding) {
      result.success = false;
      result.msg = "!error. embedding failed";
      return c.json(result);
    }

    /* 임베딩화된 검색어를 사용하여 t_test_textembedding 테이블에서 벡터 검색하기 */
    const _data = await db.query(
      `
SELECT 
    id, title,
    -- ts_rank를 사용하여 키워드 연관도 점수 산출
    ts_rank_cd(to_tsvector('simple', title || ' ' || content), plainto_tsquery('simple', $2)) AS word_rank,
    (1 - (title_embedding <=> $1)) AS s_rank,
    -- 두 점수를 적절히 배합 (예: 키워드 7 : 벡터 3)
    (ts_rank_cd(to_tsvector('simple', title || ' ' || content), plainto_tsquery('simple', $2)) * 0.7 +
     (1 - (title_embedding <=> $1)) * 0.3) as hybrid_score
FROM t_test_textembedding
ORDER BY hybrid_score DESC
LIMIT 10;
      `,
      [JSON.stringify(queryEmbedding), query],
    );

    result.data = _data.rows || [];
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.msg = `!error. ${error?.message}`;
    return c.json(result);
  }
});

export default router;

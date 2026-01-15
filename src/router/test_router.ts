import { Hono } from "hono";
import type { HonoEnv } from "../types/types.js";

const router = new Hono<HonoEnv>();

export default router;

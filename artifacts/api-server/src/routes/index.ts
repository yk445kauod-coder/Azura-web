import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import ttsRouter from "./tts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ai", geminiRouter);
router.use("/ai", ttsRouter);

export default router;

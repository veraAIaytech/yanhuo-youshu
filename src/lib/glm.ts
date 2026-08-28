// GLM 客户端 —— 晨报润色 / 语音记账解析
// 原则：所有 AI 调用必须有确定性兜底，演示永不掉线
// 需要环境变量：ZAI_API_KEY（可选；缺失或出错时走兜底）

const ZAI_BASE = process.env.ZAI_API_BASE ?? "https://api.z.ai/api/paas/v4";
const ZAI_MODEL = process.env.ZAI_MODEL ?? "glm-4.5-flash";

async function chat(system: string, user: string, timeoutMs = 12000): Promise<string | null> {
  const key = process.env.ZAI_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: ZAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        thinking: { type: "disabled" }, // 记账/润色是短任务，关掉推理更快更稳
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 晨报理由 → 阿姨能听懂的人话（失败时返回原文） */
export async function warmUpReasons(reasons: string[]): Promise<string[]> {
  const out = await chat(
    "你是一位煎饼摊 AI 助手，把数据理由改写成不超过 3 条、每条 20 字以内、亲切口语的备货建议。不要 emoji，直接输出每行一条，不要序号。",
    reasons.join("；")
  );
  if (!out) return reasons;
  return out.split("\n").map((l) => l.replace(/^[-•\d.、\s]+/, "")).filter(Boolean).slice(0, 3);
}

export interface LedgerResult {
  sold: number | null; // 卖出份数
  leftover: number | null; // 剩余份数
  soyMilkLeft: string | null;
  raw: string;
  source: "glm" | "fallback";
}

/** 语音记账解析："今天卖了八十个，豆浆还剩半桶" → 结构化。失败走正则兜底 */
export async function parseLedger(text: string): Promise<LedgerResult> {
  const out = await chat(
    '你是煎饼摊记账解析器。从摊主的口述里提取 JSON：{"sold": 卖出煎饼份数或null, "leftover": 剩余煎饼份数或null, "soyMilkLeft": 豆浆剩余描述或null}。只输出 JSON。',
    text
  );
  if (out) {
    try {
      const m = out.match(/\{[\s\S]*\}/);
      if (m) {
        const j = JSON.parse(m[0]) as Partial<LedgerResult>;
        return {
          sold: j.sold ?? null,
          leftover: j.leftover ?? null,
          soyMilkLeft: j.soyMilkLeft ?? null,
          raw: text,
          source: "glm",
        };
      }
    } catch {
      // 落入兜底
    }
  }
  return { ...fallbackParse(text), raw: text, source: "fallback" };
}

/** 确定性兜底：中文数字 + 阿拉伯数字正则 */
function fallbackParse(text: string): Omit<LedgerResult, "raw" | "source"> {
  const grab = (re: RegExp): number | null => {
    const m = text.match(re);
    return m ? cnNum(m[1]) : null;
  };
  const sold = grab(/(?:卖[了出]|售出)([0-9一二两三四五六七八九十]+)\s*(?:个|份)/);
  const leftover = grab(/(?:剩|还剩|剩下)([0-9一二两三四五六七八九十]+)\s*(?:个|份)/);
  const soy = text.match(/豆浆[^，。]*剩[^，。]*/);
  return { sold, leftover, soyMilkLeft: soy ? soy[0] : null };
}

/** 中文数字 → 数值（支持到 99："八十"=80、"二十三"=23） */
function cnNum(s: string): number | null {
  if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
  const digit: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (s === "十") return 10;
  const m = s.match(/^([一二两三四五六七八九]?)十([一二三四五六七八九]?)$/);
  if (m) {
    const tens = m[1] ? digit[m[1]] : 1;
    const ones = m[2] ? digit[m[2]] : 0;
    return tens * 10 + (ones || 0);
  }
  return digit[s] ?? null;
}

# WP1-1 情报采集后端适配层

WP1-1 页面通过 `/api/intel/*` 调用 [LLM-Intel-Auto](https://github.com/404NWF3/LLM-Intel-Auto)（`ruanzhu` 分支）。
该仓库原本只有 Gradio 控制台，`rest_api.py` 是基于其 `JsonIntelRunStore` / `IntelAgentController` 的 JSON 接口，需放到 LLM-Intel-Auto 的 `backend/console/rest_api.py`：

```bash
cd LLM-Intel-Auto && uv sync
cp <SAADS>/web/intel-backend/rest_api.py backend/console/
uv run uvicorn console.rest_api:app --app-dir backend --host 127.0.0.1 --port 8010
cd <SAADS>/web && npm ci && npx vite build && npx vite preview --port 4173   # /api/intel 代理到 INTEL_API_TARGET (默认 http://127.0.0.1:8010)
```

接口：`GET /api/intel/health|items?limit&source&topic|stats|runs|collect`，`POST /api/intel/collect {mode,focus,window_days,max_rounds,max_api_calls}`。
无密钥时规则采集；可选 `.env`：`INTEL_SDK_PROVIDER`(deepseek|glm)、`DEEPSEEK_API_KEY`、`GLM_API_KEY`、`NVD_API_KEY`、`ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN`。

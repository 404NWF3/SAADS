"""JSON REST API over the intel_agent store, consumed by the SAADS dashboard (WP1-1).

Run: uv run uvicorn console.rest_api:app --app-dir backend --port 8010
"""

from __future__ import annotations

import threading
import traceback
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from intel_agent.persistence import JsonIntelRunStore

app = FastAPI(title="LLM-Intel-Auto REST API")
_store = JsonIntelRunStore()
_job: dict[str, Any] = {"status": "idle"}
_lock = threading.Lock()


def _item_json(item: Any) -> dict[str, Any]:
    meta = item.metadata or {}
    return {
        "item_id": item.item_id,
        "source_name": item.source_name,
        "source_uri": item.source_uri,
        "title": item.title,
        "summary": item.summary,
        "published_at": item.published_at.isoformat() if item.published_at else None,
        "fetched_at": item.fetched_at.isoformat() if item.fetched_at else None,
        "relevance_score": float(item.relevance_score or 0),
        "topics": list(meta.get("topics") or []),
        "severity": meta.get("severity") or meta.get("cvss_severity"),
    }


def _items() -> list[dict[str, Any]]:
    items = [_item_json(i) for i in _store.load_corpus_items()]
    items.sort(key=lambda i: i["published_at"] or i["fetched_at"] or "", reverse=True)
    return items


@app.get("/api/intel/health")
def health() -> dict[str, Any]:
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/intel/items")
def items(limit: int = Query(500, le=5000), source: str | None = None, topic: str | None = None) -> list[dict[str, Any]]:
    out = _items()
    if source:
        out = [i for i in out if i["source_name"] == source]
    if topic:
        out = [i for i in out if topic in i["topics"]]
    return out[:limit]


@app.get("/api/intel/stats")
def stats() -> dict[str, Any]:
    data = _items()
    by_topic: Counter[str] = Counter()
    trend: Counter[str] = Counter()
    for i in data:
        by_topic.update(i["topics"] or ["unclassified"])
        day = (i["fetched_at"] or "")[:10]
        if day:
            trend[day] += 1
    return {
        "total": len(data),
        "by_source": dict(Counter(i["source_name"] for i in data)),
        "by_topic": dict(by_topic),
        "fetch_trend": [{"date": d, "count": c} for d, c in sorted(trend.items())],
        "latest_run": _store.latest_index_path().exists() and __import__("json").loads(_store.latest_index_path().read_text()) or None,
    }


@app.get("/api/intel/runs")
def runs(limit: int = 20) -> list[dict[str, Any]]:
    import json

    out = []
    for p in _store.list_run_paths(limit=limit):
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        bb = d.get("blackboard") or {}
        out.append({"run_id": d.get("run_id"), "status": d.get("status"), "saved_at": d.get("saved_at"),
                    "run_mode": bb.get("run_mode"), "raw_items": len(bb.get("raw_items") or [])})
    return out


class CollectRequest(BaseModel):
    mode: str = "incremental"
    focus: str | None = None
    window_days: int = 7
    max_rounds: int = 1
    max_api_calls: int = 4


@app.get("/api/intel/collect")
def collect_status() -> dict[str, Any]:
    return dict(_job)


@app.post("/api/intel/collect")
def collect(req: CollectRequest) -> dict[str, Any]:
    with _lock:
        if _job.get("status") == "running":
            raise HTTPException(409, "collection already running")
        _job.clear()
        _job.update(status="running", started_at=datetime.now(timezone.utc).isoformat(), request=req.model_dump())

    def worker() -> None:
        try:
            from intel_agent.engine.controller import IntelAgentController
            from intel_agent.engine.modes import FullCollectionMode, IncrementalCollectionMode
            from intel_agent.observability import TraceSink
            from intel_agent.schemas import RunBudget

            mode = (IncrementalCollectionMode(focus=req.focus, window_days=req.window_days)
                    if req.mode == "incremental" else FullCollectionMode())
            bb = IntelAgentController().run(mode=mode, budget=RunBudget(max_rounds=req.max_rounds, max_api_calls=req.max_api_calls),
                                            trace=TraceSink(console=False))
            _job.update(status="succeeded", run_id=bb.run_id, items=len(bb.raw_items))
        except Exception as exc:  # noqa: BLE001
            _job.update(status="failed", error=f"{exc.__class__.__name__}: {exc}", trace=traceback.format_exc()[-2000:])
        _job["finished_at"] = datetime.now(timezone.utc).isoformat()

    threading.Thread(target=worker, daemon=True).start()
    return dict(_job)

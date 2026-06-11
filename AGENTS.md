## graphify

This project has a completed knowledge graph in `graphify-out/` with god nodes, community structure, and cross-file relationships. It was built for the repo root on 2026-06-11: 391 files, 2,955 nodes, 4,865 edges, 183 communities. Core outputs:

- `graphify-out/graph.json` - query/path/explain source of truth.
- `graphify-out/graph.html` - interactive browser view.
- `graphify-out/GRAPH_REPORT.md` - high-level audit report.
- `graphify-out/manifest.json` and `graphify-out/cost.json` - update/cost bookkeeping.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After meaningful code or docs changes, refresh the graph when it would help future agents or prevent stale answers. Use `graphify update .` for normal code changes (AST-only, no API cost). Use `/graphify . --update` or a full `/graphify .` rebuild only when semantic/doc relationships need re-extraction.

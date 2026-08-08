# import-worker（Go）

情侣语料导入的高性能 Worker 平面（练功 / 扩展路径）。

- Embedder 接口：`OpenAI` + `Mock`（batch=32，失败不写伪向量）
- 队列：Redis Streams（默认）/ Postgres SKIP LOCKED（可插拔）
- 部署：见仓库根目录 Docker Compose（后续任务）

```bash
cd services/import-worker
go test ./...
```

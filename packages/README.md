# IDA Packages — Enterprise Semantic Layer (ESL)

Monorepo-style packages for Sprint 1 Representation Layer.

## Vertical slice

```
Gmail → Representation → Observation → ESL (Canonical) → Identity → Graph → Query
```

| Package | Responsibility |
|---------|----------------|
| `@ida/representation` | Source-agnostic representation model + Gmail factory |
| `@ida/observation` | Observation engine + rule-based extractor v2 |
| `@ida/esl` | Canonical entities, mapper, memory store, pipeline |
| `@ida/identity` | Email → Person, company → Organization resolution |
| `@ida/graph` | Knowledge graph builder (nodes + edges) |
| `@ida/query` | Query engine for org activity, attention, overview |

## Demo

```bash
npm run test:esl
curl -X POST http://localhost:3000/api/esl/demo
curl "http://localhost:3000/api/esl/query?q=PLN"
curl http://localhost:3000/api/esl/graph
```
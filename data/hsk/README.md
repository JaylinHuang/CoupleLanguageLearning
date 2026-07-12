# HSK Data Sources

Vocabulary and grammar data are downloaded on first import (not committed to git).

| File | Source | License |
|------|--------|---------|
| `wordlists/exclusive/old/{1-6}.json` | [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) | MIT |
| `hsk30-grammar.csv` | [ivankra/hsk30](https://github.com/ivankra/hsk30) | MIT |

Run:

```bash
npm run hsk:download   # fetch data files
npm run hsk:import     # import words + grammar into DB
npm run ai:index       # rebuild knowledge embeddings
npm run pgvector:setup # enable pgvector + migrate embeddings
```

---
tags: [research, real-usage]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Write, Glob, Grep, Skill, Agent, WebSearch, WebFetch]
---

GraphQL cursor pagination에서 opaque cursor 설계 업계 베스트 프랙티스를 조사해줘. Kotlin + Netflix DGS + OpenSearch search_after 기반 검색 서비스야. 관점: (1) 커서에 정렬키·정렬 식별자를 넣을지 (2) 정렬/필터가 바뀐 잘못된 커서를 받으면 첫 페이지로 폴백할지 에러를 낼지. Relay spec, GitHub/Shopify GraphQL 공식 문서, OpenSearch search_after 문서 기준으로. 결과는 `notes/research.md`에 저장해줘.

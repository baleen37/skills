---
type: regex
pattern: '(?=[\s\S]*(relay\.dev|graphql\.org))(?=[\s\S]*(docs\.github\.com|shopify\.dev))(?=[\s\S]*(opensearch\.org|docs\.aws\.amazon\.com))'
target:
  source: file
  path: notes/research.md
---

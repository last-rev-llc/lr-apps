#!/bin/bash

# Execute schema using Supabase SQL via curl
# This uses the Management API to execute SQL

SQL=$(cat schema.sql)

curl -X POST \
  'https://fzmhqcgzvgtvkswpwruc.supabase.co/rest/v1/rpc/query' \
  -H "apikey: ${TRINITY_SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${TRINITY_SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}"

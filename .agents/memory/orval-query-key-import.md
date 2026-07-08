---
name: Orval generated query key usage
description: Always import getX QueryKey from the API client package; never hardcode the query key array.
---

## Rule
All `getXxxQueryKey()` functions are exported by `@workspace/api-client-react`. Import and use them for `queryClient.invalidateQueries()` calls. Never hardcode the key array (e.g. `['listCollections']`).

**Why:** Orval generates keys of the form `['/api/collections', params]`. A hardcoded `['listCollections']` will not match, so cache invalidation silently fails and the UI shows stale data after mutations.

**How to apply:**
- In any admin page that calls `queryClient.invalidateQueries(...)`, import the corresponding `getXxxQueryKey` from `@workspace/api-client-react` and pass it directly.
- Also applies to `queryKey:` fields on `useQuery` options — use the generated `getXxxQueryOptions()` or pass the generated key, not a hand-crafted array.

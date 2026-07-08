---
name: Presigned PUT upload has no response body to read metadata from
description: Server-issued metadata (like the storage objectPath) minted when requesting a presigned upload URL cannot be recovered from the presigned PUT's own response — capture it client-side at request time instead.
---

## Rule
When a client (e.g. Uppy + `@uppy/aws-s3`) requests a presigned upload URL from your backend and then PUTs the file directly to object storage, the PUT response is just the storage provider's bare response — it does NOT echo back any metadata your backend generated (like `objectPath`). Reading `result.successful[0].response?.body?.objectPath` after upload completion will be `undefined`.

**Why:** This is easy to get wrong because the *request-url* endpoint response DOES include `objectPath`, so it's tempting to assume it survives through to the *upload-complete* callback too — it doesn't, since that's a completely separate HTTP exchange with the storage backend, not your API.

**How to apply:** Capture the `objectPath` (or any other server-minted metadata) at the point you request the upload URL, keyed by the file's stable id (e.g. Uppy's `file.id`), in a ref/map outside the uploader. Look it up by that same id in the `onComplete` callback rather than trying to read it from the upload response.

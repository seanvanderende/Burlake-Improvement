---
name: Object storage private-object ACL for public-facing content
description: Objects uploaded via the standard object-storage template's presigned-upload flow land in the private object namespace by default and are not publicly readable — anything meant to be shown to end users (e.g. product photos on a public catalog) must be explicitly marked public.
---

## Rule
When a feature lets an admin/staff user upload a file (via `getObjectEntityUploadURL` + the private `/objects/*` GET route) that must then be visible to unauthenticated end users, do not leave the GET route serving unconditionally on `req.session`/auth alone. Instead:
1. Serve the object publicly only when its ACL policy (`getObjectAclPolicy`) has `visibility: 'public'`; otherwise require the same auth used for admin actions.
2. When the uploaded object is actually attached to a public-facing record (e.g. saved onto a product), call `objectStorageService.trySetObjectEntityAclPolicy(path, { owner, visibility: 'public' })` at that save point — not at upload time (the object may never end up attached to anything, or the upload could be abandoned).

**Why:** The object-storage skill's private-object template ships with the ACL check commented out as an "example," so left as-is, the route is either universally open (never good for anything not meant to be public) or (if you naively wrap it in `requireAdmin`) breaks public-facing display of the very images it's meant to serve.

**How to apply:** Any time you scaffold an admin-upload-then-public-display flow (product photos, avatars visible on public profiles, etc.), wire the "mark public" ACL call into the create/update handler of the entity the image attaches to, and gate the serving route on that ACL policy rather than blanket admin-only or blanket-public.

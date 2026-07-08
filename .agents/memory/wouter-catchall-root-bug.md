---
name: Wouter catch-all root route bug
description: A wildcard wrapper Route (e.g. `<Route path="/:rest*">`) used to wrap a Switch (to apply a shared layout to all but a few excluded paths) can fail to match the bare `/` path in some wouter setups, silently rendering nothing for the homepage.
---

## Symptom
Homepage (`/`) renders completely blank — no nav, no content, just the page background color. No JS console errors appear (no thrown exception; the Switch just has no matching Route, so it renders `null`). Every other route (`/catalog`, `/admin/login`, etc.) renders fine, since they aren't the root path.

## Root cause
A pattern like:
```tsx
<Switch>
  <Route path="/admin/login">...</Route>
  <Route path="/:rest*">
    {() => <Shell><Switch>...</Switch></Shell>}
  </Route>
</Switch>
```
was used to apply a public `Shell` layout to everything except a few explicitly-excluded paths (e.g. `/admin/*`). The `/:rest*` wildcard route did not match the bare `/` path, so nothing rendered for the homepage specifically.

## Fix
Use a path-less `<Route>` (no `path` prop) as the final "everything else" branch instead of a wildcard path pattern — a `<Route>` with no `path` always matches:
```tsx
<Route>
  {() => <Shell><Switch>...</Switch></Shell>}
</Route>
```

## How to apply
When building a layout-wrapping fallback route in wouter (or diagnosing "blank page, no errors" reports), check first whether the fallback/wrapper route actually matches `/` — test the bare root path explicitly, not just nested paths.

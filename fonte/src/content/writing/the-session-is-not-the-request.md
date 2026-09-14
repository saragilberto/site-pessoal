---
title: 'The session is not the request: a tenant identifier that stopped updating mid-impersonation'
description: 'A support console resolved the active tenant''s identifier from a session value set once at login. Impersonating a second tenant in the same browser session left every downstream call pinned to the first one — a bug invisible to any test that only impersonates one tenant per test run. The fix was reading it from a request-scoped context instead, one property lookup instead of a session read.'
pubDate: 2026-09-14
tags: ['multi-tenant', 'architecture', 'testing', 'PHP']
draft: false
---

A support agent working inside a multi-tenant platform needs to see the
world the way a specific customer sees it — their data, their permissions,
their configuration — without actually being that customer. The standard
answer is impersonation: the agent picks a tenant, the app remembers which
one, and every request from then on behaves as if the agent were logged in
as that tenant. The bug that matters here isn't in the picking. It's in the
remembering.

## Where the identifier lived

The code that needed to know "which tenant is this for" read it from the
session:

```php
class TenantResolver
{
    public function activeTenantCode(): string
    {
        return session('impersonated_tenant_code')
            ?? auth()->user()->tenant_code;
    }
}
```

This is correct for the common case: an agent impersonates a tenant, does
some work, and impersonation ends before the session does. It's also
correct for the case with no impersonation at all — the fallback to the
authenticated user's own tenant just works. Neither case is where the bug
lives.

## The case the common path doesn't cover

The bug shows up when an agent impersonates tenant A, does something,
switches to impersonating tenant B *without logging out in between* — a
normal thing to do when a queue of support tickets spans several customers
in one sitting — and a piece of code somewhere had already read
`activeTenantCode()` once and kept the value instead of asking again.
Anything built that way stays pinned to tenant A for the rest of the
session, silently, because nothing about switching to tenant B raises an
error. It just produces output — a report, a cached permission check, an
audit log entry — attributed to the wrong tenant.

Session storage doesn't cause this by itself. What causes it is treating a
session value as if it had the lifetime of a request when it actually has
the lifetime of a login. Reading `session('impersonated_tenant_code')`
fresh every single time is technically correct and would have avoided the
bug — but "always remember to read it fresh, never cache it in a
constructor or a service property" isn't a rule that survives contact with
a codebase that has more than one place that needs the value. Someone
eventually assigns it to `$this->tenantCode` in a constructor for
convenience, and now that one class is wrong for the rest of the object's
lifetime, which in a long-lived service or a job dispatched mid-session can
outlast the impersonation switch that was supposed to invalidate it.

## Why the fix isn't "read the session more carefully"

The actual fix moves tenant resolution out of session storage entirely and
into a context object that's rebuilt once per request, by middleware, before
any application code runs:

```php
class TenantContext
{
    private static ?string $tenantCode = null;

    public static function bind(string $tenantCode): void
    {
        self::$tenantCode = $tenantCode;
    }

    public static function current(): string
    {
        return self::$tenantCode
            ?? throw new RuntimeException('TenantContext not bound for this request.');
    }
}
```

```php
class ResolveTenantContext
{
    public function handle(Request $request, Closure $next)
    {
        TenantContext::bind(
            $request->session()->get('impersonated_tenant_code')
                ?? $request->user()->tenant_code
        );

        return $next($request);
    }
}
```

The session is still where impersonation state is *stored* — that part was
never wrong, and there's no better place to persist "which tenant is this
agent currently impersonating" across requests. What changed is that
nothing downstream reads the session directly anymore. Every request gets
exactly one write to `TenantContext`, at the top of the middleware stack,
and every consumer — services, policies, jobs dispatched synchronously
within that request — reads the same bound value instead of each deciding
independently whether to trust a cached copy or re-read the session. The
bug wasn't the storage mechanism; it was that resolution had no single
place it was guaranteed to happen exactly once per request, so different
call sites disagreed about how fresh their answer needed to be.

The `throw` on an unbound context is deliberate, not defensive
over-engineering. A tenant-scoped query running with no tenant bound at all
is a worse failure than a slow one — it's the shape of bug that returns
someone else's data instead of an error. Failing loudly the moment
something reaches `TenantContext::current()` outside the middleware's
control is what makes "not bound" impossible to ship silently, the same way
a queued job that skips the HTTP middleware stack entirely now has to bind
the context explicitly before doing tenant-scoped work, instead of
inheriting a stale value from whatever session happened to exist when the
job was serialized.

## The test that would have caught it

A test suite that impersonates one tenant per test run never exercises this
bug, because the fallback path and the impersonation path both return a
value, and both values are correct in isolation. The test that actually
proves the fix is one that switches tenants mid-session and asserts on the
*second* one:

```php
public function test_switching_impersonation_mid_session_updates_the_active_tenant(): void
{
    $agent = User::factory()->supportAgent()->create();

    $this->actingAs($agent)
        ->post('/impersonate', ['tenant_code' => 'northwind'])
        ->assertOk();

    $this->assertSame('northwind', TenantContext::current());

    $this->actingAs($agent)
        ->post('/impersonate', ['tenant_code' => 'vantage'])
        ->assertOk();

    $this->assertSame('vantage', TenantContext::current());
}
```

Before the fix, this test would have passed too, for the wrong reason — the
resolver's session read is genuinely fresh on every call. What it wouldn't
catch is a service resolved once per request lifecycle and reused across an
internal call chain that spans the switch. The regression test that
actually matters isn't at the resolver level at all; it's asserting that a
downstream consumer built earlier in a request — a report generator, an
audit logger — reflects the tenant active at the moment it *runs*, not the
moment it was constructed. Testing the resolver in isolation proves the
resolver is correct. It doesn't prove anything about the callers that
decided to cache its answer.

## What transfers

The specific classes here — `TenantResolver`, `TenantContext`, the
middleware — are invented for this post. What isn't invented is the shape
of the mistake: a value with request-scoped correctness requirements,
stored somewhere with a longer lifetime, read by more than one call site
that each independently decide how fresh they need it to be. Session
storage, a static cache, a memoized property on a long-lived service —
none of them are wrong by themselves. They become wrong the moment
something inside that longer-lived container is allowed to change during a
lifetime the code implicitly assumed was constant. The fix is never "read
it more carefully." It's making the value impossible to hold onto past the
scope where holding onto it stops being safe.

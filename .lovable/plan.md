# Secure supplier admin panel

## Goal
Build a private Weettah operations area where the two approved administrators can update live package pricing, map plans to supplier packages, manage eSIM Access and Pesapal settings, and monitor or retry pending orders.

Approved administrators:
- admin@takeflyt.com
- admin@weettah.com

No personal profile table will be created.

## Access and security
- Add passwordless email-code sign-in and sign-out pages.
- Create a separate `user_roles` table with a `supplier_admin` role and a server-safe `has_role` function.
- Grant the role only after one of the two exact approved email addresses has been verified; do not grant by domain and do not place roles on a profile/user record.
- Put the admin pages behind the managed signed-in route guard, then repeat the role check inside every admin server action so page access alone never authorizes data access.
- Keep customer order and credential data inaccessible to anonymous and ordinary signed-in users.
- Add a root auth listener so sign-in/sign-out state and protected data stay synchronized.

## Database-backed packages
- Add a `plans` table with destination, region, allowance, validity, sale price, currency, visibility/popularity, display order, and private supplier package code.
- Seed the current eight plans so the existing homepage does not lose content.
- Add explicit grants, RLS, timestamps, public read access only to active customer-safe plan fields, and admin-only management policies.
- Replace hardcoded checkout pricing with the current active database price on the server; retain the existing payment amount verification.
- Load the homepage plan list from the database so admin price and availability edits appear to customers without a code release.

## Encrypted supplier and payment settings
- Add a locked `integration_settings` table for eSIM Access and Pesapal configuration, including supplier name/API address, test/live mode, notification ID, and encrypted credentials.
- Generate an app-owned encryption key in secure backend storage and use authenticated encryption before credentials reach the database.
- Never return saved credential values to the browser. The panel will show only configured/not configured plus a safe masked hint; leaving a secret field blank preserves its existing value.
- Refactor provisioning and payment helpers to read the encrypted settings, with environment-variable fallback during transition.
- Move supplier package mapping from the current environment JSON into each plan’s private package-code field.

## Admin experience
- Create a focused Weettah operations layout with navigation for Overview, Orders, Packages, and Integrations.
- Overview: pending-payment, awaiting-activation, provisioning, failed, and ready counts plus recent activity.
- Orders: paginated search and filters, customer/order details, payment and fulfillment state, error details, and a guarded “Retry activation” action for paid orders.
- Packages: edit sale price, visibility, popularity, ordering, and supplier package code while preserving stable plan IDs.
- Integrations: edit eSIM Access supplier details and credentials, plus Pesapal consumer credentials, notification ID, and test/live mode; clearly show configuration health without exposing secrets.
- Use the existing Weettah sand/melanin visual language, with dense readable tables on desktop and stacked order rows on mobile.

## Technical implementation
- Add database migrations for roles, plans, encrypted integration settings, policies, grants, indexes, timestamps, verified-email role assignment, and initial plan rows.
- Add authenticated server functions for admin identity, dashboard metrics, orders, retries, plans, and integration settings. Privileged database access will only occur after the role check.
- Add public server functions for active customer plan reads; public responses will exclude supplier package codes and credentials.
- Add `/auth` and protected `/admin`, `/admin/orders`, `/admin/packages`, and `/admin/integrations` routes, each with unique page metadata.
- Reuse the existing fulfillment and payment helpers rather than duplicating supplier logic.

## Validation
- Apply and lint the database migration.
- Verify email-code sign-in, unauthorized denial, both admin allowlist paths, sign-out cleanup, plan-price propagation to checkout, credential redaction, order filtering, and activation retry behavior.
- Check desktop and mobile layouts, empty/error/loading states, keyboard navigation, no horizontal overflow, runtime logs, and the final build status.

## External setup note
The panel can be built and secured now. Live payments and eSIM issuance will still require valid eSIM Access and Pesapal credentials to be entered through the new Integrations page after an approved administrator signs in.

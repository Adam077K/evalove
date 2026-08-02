# Strategic Decisions Log

_A permanent record of every non-trivial decision made about the product, architecture, or business._

<!-- Agent: ceo + any lead | When: any time a non-trivial decision is made — technology choices, product direction, pricing, hiring, architecture, process | Instructions: Add entries newest-first (newest at the top, below this comment). Include WHY, not just WHAT. A future team member should be able to read this and understand the full reasoning, what alternatives were considered, and who was accountable. Status values: Active (in effect), Superseded (replaced by a newer decision — link to it), Reversed (undone — explain why). -->

---

## How to Use

Each entry answers three questions: **What** was decided, **why** this over alternatives, and **who** is accountable. Entries are permanent — never delete them. Mark old decisions as Superseded or Reversed with a reference to the newer entry.

---

### [YYYY-MM-DD] — Example: Chose Supabase over PlanetScale for database

**Decision:** Use Supabase (PostgreSQL) as the primary database for all structured data storage.

**Context:** We needed a hosted database solution before the first sprint. The team evaluated PlanetScale (MySQL-compatible, branching model), Neon (serverless Postgres), and Supabase (Postgres + realtime + storage + auth).

**Rationale:** Supabase bundles Postgres, row-level security, storage, and realtime in one platform — reducing the number of vendor integrations at early stage. The team has existing Postgres expertise. RLS handles multi-tenant data isolation at the DB layer, which simplifies backend code. PlanetScale's branching is valuable at scale but adds workflow complexity we don't need yet.

**Made by:** _build-lead_

**Status:** Active

---

_Last updated: — | Updated by: —_

# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Strict Ownership**: Every document in `users`, `categories`, `transactions`, and `monthlyReports` is strictly owned by a single verified Firebase user (`uid == request.auth.uid` / `userId == request.auth.uid`). No cross-user read, list, update, or delete is permitted.
2. **Email Verification Gate**: All authenticated writes require `request.auth.token.email_verified == true`.
3. **Referential Integrity**: A `transaction` cannot be created or reassigned to a `categoryId` that does not exist in `/categories/{categoryId}` or belongs to a different user.
4. **Immutable Ownership & Creation Timestamps**: `userId` (or `uid`) and `createdAt` can never be modified after document creation. `createdAt` and `updatedAt` must equal `request.time`.
5. **Bounded Payload & Strict Keys**: Every collection enforces exact required/allowed keys (`hasAll` & `hasOnly`), bounded string lengths, regex validation on document IDs (`^[a-zA-Z0-9_\-]+$`), dates (`^\d{4}-\d{2}-\d{2}$`), month keys (`^\d{4}-\d{2}$`), hex colors (`^#[0-9A-Fa-f]{6}$`), and numeric bounds.
6. **Zero PII Enumeration**: `users` collection denies `list` unconditionally and `get` is strictly restricted to `isOwner(userId)`.

## 2. The "Dirty Dozen" Adversarial Payloads (All MUST Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Reading `/transactions` or writing `/categories/c1` with `request.auth == null`.
2. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempting to create a transaction.
3. **Cross-User Identity Spoofing**: User A creating a transaction with `userId: "user_B"`.
4. **Cross-User Category Hijack**: User A creating a transaction referencing `categoryId` owned by User B.
5. **Orphaned Transaction**: User A creating a transaction with a non-existent `categoryId: "missing_cat"`.
6. **Shadow Field Injection**: Creating a category with an extra ghost key `{ ..., isAdmin: true }`.
7. **ID Poisoning Attack**: Writing to `/transactions/invalid$id_with_spaces_or_1kb_junk` failing `isValidId()`.
8. **Negative / Zero Monetary Amount**: Creating a transaction with `amount: -50` or `amount: 0`.
9. **Oversized String Exhaustion**: Creating a transaction with a 5,000-character `description` or `notes`.
10. **Client-Forged Timestamp**: Creating or updating a transaction with a backdated `createdAt` or `updatedAt != request.time`.
11. **Immutable Field Mutation**: Updating an existing transaction to change `userId` or `createdAt`.
12. **Blanket List Query Scraping**: User A executing a list query on `/transactions` without filtering by `userId == userA.uid` (or querying `/users`).

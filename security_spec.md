# Security Specification: Dimsum Mentai 77 UNPAM ERP & POS

## 1. Data Invariants
- **Materials**: Must possess a valid unique ID, positive or zero stock value, unit string, and non-negative unit cost.
- **Transactions**: Invoices must be immutable once created. Total must equal subtotal minus discount. Cash received must be greater than or equal to total for cash transactions.
- **Purchases**: Must have valid PO number, material ID reference, positive quantity, and non-negative unit price.
- **Users**: Admin/Owner access is restricted to authorized roles. Passwords and identity fields are protected from unauthorized public scraping.
- **Global Invariant**: Default deny catch-all `match /{document=**} { allow read, write: if false; }`.

## 2. The "Dirty Dozen" Payloads (Rejection Matrix)
1. **Ghost Field Injection**: Adding unmodeled properties like `isAdmin: true` to a standard staff record. Rejection: Blocked by schema integrity.
2. **Negative Stock Override**: Setting raw material stock to `-500 kg`. Rejection: Must be non-negative.
3. **Price Tampering**: Altering transaction total after generation. Rejection: Immutable transaction records.
4. **ID Poisoning Attack**: Submitting 2MB random binary strings as document IDs. Rejection: `isValidId(id)` length limit <= 128.
5. **Unauthorized Role Escalation**: Staff user promoting self to `OWNER`. Rejection: Role validation.
6. **Orphaned PO Write**: Creating purchase order referencing non-existent material. Rejection: Document integrity check.
7. **Bypass Query Filter**: Attempting unbounded collection scrape without authorization. Rejection: Evaluated against `resource.data`.
8. **Negative Amount Expense**: Claiming negative expenses to artificially inflate net cash. Rejection: Non-negative amount constraint.
9. **Timestamp Spoofing**: Providing futuristic client timestamp. Rejection: Server-time validation.
10. **Shadow Transaction Deletion**: Cashier deleting past completed transactions to conceal cash theft. Rejection: Deletion restricted to signed-in store owner.
11. **Denial of Wallet Attack**: Sending massive 100k item arrays in a single document. Rejection: Bounded item size.
12. **Unauthenticated Public Write**: Anonymous internet actor attempting to write to store configuration. Rejection: Strict auth gate.

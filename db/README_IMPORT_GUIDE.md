# Meera Dataverse CSV Seed Pack

Recommended import approach:
1. Use these CSVs to create Dataverse tables quickly and seed mock data.
2. Import in this order:
   1. aic_office.csv
   2. aic_issue_category.csv
   3. aic_student.csv
   4. aic_support_ticket.csv
   5. aic_ticket_activity.csv
   6. aic_conversation_session.csv
   7. aic_knowledge_article.csv
   8. aic_ticket_evidence.csv

Important:
- The CSVs use text key columns such as OfficeCode, CategoryCode, StudentID, and TicketNumber.
- Dataverse may import these as text columns first. After import, you can manually convert important fields to Choice columns and add Lookup relationships.
- Recommended lookup relationships after import:
  - IssueCategory.OfficeCode -> Office.OfficeCode
  - SupportTicket.StudentID -> Student.StudentID
  - SupportTicket.ResponsibleOfficeCode -> Office.OfficeCode
  - SupportTicket.CategoryCode -> IssueCategory.CategoryCode
  - TicketActivity.TicketNumber -> SupportTicket.TicketNumber
  - ConversationSession.TicketNumber -> SupportTicket.TicketNumber
  - KnowledgeArticle.OfficeCode -> Office.OfficeCode
  - KnowledgeArticle.CategoryCode -> IssueCategory.CategoryCode
  - TicketEvidence.TicketNumber -> SupportTicket.TicketNumber

Recommended choices:
- Priority: Low, Normal, High, Critical
- Ticket Status: New, Awaiting Student Info, Escalated, In Progress, Resolved, Closed, Cancelled
- Channel: Chat, Voice, Screen Share
- Outcome: Resolved by Agent, Escalated to Staff, Information Provided, Abandoned
- Activity Type: Student Message, Bot Guidance, Troubleshooting Step, Staff Note, Status Update
- Activity Result: Success, Failed, Pending, Not Applicable

## Cloudflare D1 Admin Demo

The `/demo` admin CMS is connected to a shared remote Cloudflare D1 database through a public demo API:

- Remote API: `https://meera-admin-demo-api.cj-uy.workers.dev`
- D1 database: `meera-admin-demo`
- D1 database id: `0f5fb5e5-861f-4e54-a879-96c47e8af7f5`
- Worker config: `wrangler.admin-demo.jsonc`

Local devs do not need Cloudflare accounts for the demo UI. They only need this public env value:

```powershell
NEXT_PUBLIC_ADMIN_DEMO_API_BASE=https://meera-admin-demo-api.cj-uy.workers.dev
```

To reset or reseed the remote D1 database, run:

```powershell
pnpm wrangler d1 execute meera-admin-demo --remote --file db/d1_admin_demo_schema.sql
pnpm wrangler d1 execute meera-admin-demo --remote --file db/d1_admin_demo_seed.sql
```

To redeploy only the shared admin demo API:

```powershell
pnpm wrangler deploy -c wrangler.admin-demo.jsonc
```

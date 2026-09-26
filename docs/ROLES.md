# Roles & Access Control — Deskwise Customer Support System

> A comprehensive reference document describing the four roles implemented in the Deskwise AI-Based Customer Support Ticket System — their responsibilities, permissions, hierarchies, and how they interact with each other throughout the ticket lifecycle.

---

## Table of Contents

- [Role Architecture](#role-architecture)
- [1. Customer](#1-customer)
- [2. Regular Agent](#2-regular-agent)
- [3. Department Manager](#3-department-manager)
- [4. Administrator (Admin)](#4-administrator-admin)
- [Relationships Between Roles](#relationships-between-roles)
- [Ticket Lifecycle & Role Involvement](#ticket-lifecycle--role-involvement)
- [Escalation & Auto-Routing System](#escalation--auto-routing-system)
- [Permission Summary](#permission-summary)

---

## Role Architecture

The system recognizes three primary roles: **Admin**, **Agent**, and **Customer**. The Agent role is further subdivided into two tiers — **Regular Agent** (Tier 1) and **Department Manager** (Tier 2). The Manager is not a standalone role; it is a promoted Agent with elevated privileges within their department.

Every user in the system is assigned exactly one role. For agents, an additional tier designation determines whether they operate as a regular support agent or a department manager. Non-agent roles (Admin, Customer) have no tier designation.

A special **Super Admin** account exists as a seed user. This account is protected from modification, archival, or deletion by any other admin, ensuring there is always at least one administrative account available.

---

## 1. Customer

### Who They Are

Customers are the end-users of the support system. They are external users who interact with the system solely to seek help for their issues. A customer can register themselves via email/password signup or through OAuth (e.g., Google sign-in). Upon first OAuth login, a customer profile is automatically created.

### What They Can Do

- **Create support tickets**: Customers submit tickets with a subject and body. The system's AI engine automatically classifies the ticket into a department, determines its priority (low / medium / high), and analyzes the sentiment (positive / neutral / negative). The customer does not control these classifications.

- **View their own tickets**: Customers see only the tickets they have created. They cannot view tickets belonging to other customers or see the overall ticket queue.

- **Reply to their tickets**: Customers can send follow-up messages on their own tickets to provide additional information or respond to agent replies.

- **Track ticket history**: A dedicated history view allows customers to browse their past (resolved/closed) tickets.

- **Rate resolved tickets**: Once a ticket is marked as resolved or closed, the customer can leave a 1–5 star rating along with optional written feedback. Each ticket can only be rated once.

- **Upload and download attachments**: Customers can attach files (images, PDFs, documents) to their tickets, subject to size and type restrictions. They can also download attachments on their own tickets.

### What They Cannot Do

- View, modify, or interact with any other customer's tickets.
- Change ticket status, priority, sentiment, or department assignment.
- See internal notes left by agents — these are completely hidden from the customer's view.
- Access analytics, user management, department management, or any administrative function.
- Delete tickets or replies.

### Account Provisioning

Customers can self-register. However, users with email addresses belonging to designated company domains are **blocked from self-registration** — they must be invited as agents by an admin. This prevents company employees from accidentally creating customer accounts.

---

## 2. Regular Agent

### Who They Are

Regular Agents (Tier 1) are the frontline support staff. Each agent belongs to exactly one department (e.g., Billing, Technical Support, Account Management). They are responsible for handling tickets routed to their department.

Agents do not create their own accounts. They are **invited by an Admin**, who provisions their account with a temporary password and assigns them to a department. On first login, the agent is required to change this temporary password before accessing any other functionality.

### What They Can Do

- **View tickets within their department**: Agents see all tickets that belong to their department, including unassigned tickets in the department queue and tickets assigned to other agents in the same department. They also see any tickets directly assigned to them, even if the ticket belongs to a different department.

- **Claim unassigned tickets**: When a ticket arrives in the department queue without an assigned agent, a regular agent can claim it by assigning it to themselves. Claiming a ticket automatically advances its status from "open" to "in_progress."

- **Work on tickets**: Once a ticket is assigned to them, agents can update the ticket's status through the lifecycle: open → in_progress → pending → resolved → closed. They can reply to the customer, add internal notes visible only to staff, and upload attachments.

- **Write internal notes**: Agents can create private notes on a ticket that are visible to other agents and admins but hidden from the customer. This is used for internal coordination and documentation.

- **View personal analytics**: Agents have a personal performance dashboard showing their ticket counts, resolution rate, CSAT (Customer Satisfaction) score, and breakdowns by status, priority, and department.

- **View department-level analytics**: Agents can see aggregated metrics for their own department, including total tickets, status distribution, and category breakdowns. This view is automatically scoped to their department.

### What They Cannot Do

- **Delegate or reassign tickets** to other agents — only Managers and Admins can do this.
- **Unassign tickets** back to the department queue — once claimed, only a Manager or Admin can return it to the pool.
- **Steal tickets** already assigned to another agent — they can only claim unassigned tickets.
- **Claim high-risk tickets** (high priority or negative sentiment) when a Department Manager exists for that department — these are reserved for the Manager.
- **Transfer tickets** to a different department or back to the admin triage queue.
- **Manage users**, invite agents, toggle availability, or perform any administrative operations.
- **Delete tickets or replies**.
- **Create or modify departments or SLA policies**.
- **Access the admin triage panel** (the AI-confidence review queue).

### Lifecycle on Agent Deactivation

When a regular agent is deactivated (marked inactive), archived, or transferred to another department, all of their open/in-progress tickets are automatically reassigned. If a Department Manager exists, tickets go to the Manager. If no Manager is available, tickets are returned to the department's unassigned queue. An internal audit note is appended to each affected ticket documenting the reassignment reason.

---

## 3. Department Manager

### Who They Are

The Department Manager is a senior agent (Tier 2) who leads and oversees a department's ticket operations. Structurally, they hold the same "agent" role as a regular agent but with an elevated tier that grants additional operational privileges.

**There can be only one active Manager per department.** This invariant is strictly enforced — if an admin attempts to promote a second agent to manager in the same department, the existing manager is automatically demoted to a regular agent (Manager Succession), and their tickets are handed over to the new manager.

### Everything a Regular Agent Can Do, Plus:

- **Delegate and reassign tickets**: Managers can assign tickets to any agent within their department. When delegating, an internal audit note is automatically created documenting who reassigned the ticket and to whom, and an email notification is sent to the target agent.

- **Unassign tickets**: Managers can return a ticket from an agent back to the department's unassigned queue, making it available for other agents to claim.

- **Transfer tickets between departments**: Managers can move tickets to a different department if they determine the ticket was misrouted, or send tickets back to the admin triage queue for re-classification.

- **Claim high-risk tickets**: Unlike regular agents, Managers are allowed to claim tickets flagged as high priority or having negative customer sentiment. In fact, these tickets are auto-routed to the Manager when they are first created.

- **Manage team availability**: Managers can toggle the active/inactive status of regular agents within their own department. When an agent is set to inactive, their open tickets are automatically rerouted to the Manager. However, Managers cannot deactivate themselves, other managers, or admins through this mechanism.

- **View department team**: Managers have access to a team overview showing all agents in their department along with each agent's current active ticket count (workload).

### Auto-Escalation: The Manager as the Escalation Point

The Manager serves as the **automatic escalation target** for their department. The system routes tickets directly to the Manager in these scenarios:

1. **At creation**: When a newly created ticket is classified with high priority or negative sentiment, it is immediately assigned to the department's Manager (instead of entering the unassigned queue). The ticket status is set to "in_progress" and an internal audit note records the escalation reason.

2. **Mid-lifecycle escalation**: If a ticket's priority is elevated to "high" or its sentiment changes to "negative" during its lifecycle (e.g., an admin changes the classification during triage), the ticket is automatically reassigned to the department Manager.

3. **Agent absence**: When a regular agent in the department is deactivated, archived, or transferred, all of their open tickets are reassigned to the department Manager. If no Manager exists, tickets return to the unassigned queue.

In all escalation cases, the Manager receives an email notification with the ticket details and escalation reason.

### Manager Succession

When an admin promotes a new agent to Manager in a department that already has one:

1. The existing Manager is automatically demoted to a Regular Agent.
2. All open tickets from the former Manager are transferred to the new Manager.
3. Internal audit notes are created on every transferred ticket.
4. Both the demoted and newly promoted managers receive email notifications explaining the change and how many tickets were handed over.

When a Manager is directly demoted (without a successor), their tickets are either handed to the new Manager (if one is subsequently assigned) or returned to the department's unassigned queue.

### Manager-Specific Restrictions

- Cannot deactivate themselves through the team management panel.
- Cannot modify other Managers or Admins — only regular agents within their department.
- Team management scope is limited strictly to their own department.
- Cannot invite new agents, manage departments/SLA policies, or perform system-wide administrative tasks.

---

## 4. Administrator (Admin)

### Who They Are

Admins are the system-wide administrators with unrestricted access to all resources across all departments. They do not belong to a specific department — they operate globally.

### What They Can Do

#### User Management

- **Invite new agents**: Admins provision new agent accounts by providing an email, name, department assignment, and tier (Regular or Manager). The system creates the authentication credentials, stores the profile, and sends an invitation email with a temporary password.

- **Manage all users**: Admins can list, view, update, archive, unarchive, and delete any user (except the protected Super Admin). They can change a user's role, department, tier, active status, and personal information.

- **Promote and demote agents**: Admins control the Agent Tier, promoting regular agents to Manager or demoting managers back to regular. The single-manager-per-department constraint and automatic succession are enforced when doing so.

- **Toggle agent availability**: Admins can set any agent's active/inactive status, regardless of department. When deactivating an agent, the automatic ticket rerouting logic is triggered.

- **View department teams**: Admins can see the team composition of any department with live workload counts.

#### Ticket Management

- **View all tickets globally**: Admins see tickets across all departments. By default, resolved and closed tickets are hidden from the admin view unless a specific status filter is applied.

- **Update any ticket**: Admins can change the status, priority, sentiment, department assignment, and agent assignment of any ticket without restrictions.

- **Delegate and reassign freely**: Admins can assign any ticket to any agent (within the ticket's department), unassign tickets, and transfer tickets between departments — all without the restrictions that apply to regular agents.

- **Delete tickets**: Only admins can permanently delete tickets from the system.

- **Triage AI-classified tickets**: The admin has exclusive access to a triage panel that surfaces tickets where the AI classification confidence is low or the ticket lacks a department assignment. Admins review these tickets, correct the department assignment, adjust priority/sentiment, and route them to the appropriate department. When a high-risk ticket is triaged into a department with a Manager, it is automatically escalated to that Manager.

#### System Configuration

- **Manage departments**: Admins create, rename, and delete departments. Departments organize the ticket routing and agent assignment structure.

- **Manage SLA policies**: Admins define Service Level Agreement policies that specify response and resolution time targets for each priority level. When a ticket is created, the corresponding SLA timer is automatically attached based on the ticket's priority.

#### Content Moderation

- **Delete replies**: Only admins can delete individual replies (messages) from tickets.

### Global Analytics

Admins access a comprehensive analytics dashboard that can be viewed globally or filtered by specific department. The dashboard includes:

- Total ticket counts with trend indicators (comparison to previous period).
- Status breakdown (open, in_progress, pending, resolved, closed).
- Department/category distribution.
- Customer satisfaction (CSAT) scores from ticket ratings.
- Agent performance rankings showing each agent's unresolved count, closed count, and average rating.

### Admin-Specific Behaviors

- The "Change Password" option is hidden from the admin profile card in the UI, as admin authentication may be managed differently.
- The Super Admin email is excluded from user listing queries, making the seed account invisible in the management interface.
- Admin accounts can optionally be associated with a department, but this does not restrict their access in any way.

---

## Relationships Between Roles

### Admin ↔ Agent (Regular)

The Admin is the sole authority for agent lifecycle management. Admins invite agents, assign them to departments, and can modify any aspect of their account. When an admin deactivates or archives an agent, the system automatically handles the reassignment of that agent's open tickets. Agents have no reciprocal authority over admins.

### Admin ↔ Manager

The Admin controls Manager promotions and demotions. When promoting a new Manager in a department, the admin triggers the succession mechanism that automatically steps down the previous manager. Managers have more operational autonomy within their department than regular agents, but they remain subject to admin oversight. Admins can override any action a Manager takes.

### Admin ↔ Customer

There is no direct management relationship. Customers self-register and do not require admin intervention. However, admins interact with customers indirectly through the triage panel — reviewing and routing customer-submitted tickets to the correct departments. Admins can also see customer ticket data in analytics.

### Manager ↔ Regular Agent

The Manager serves as the team lead within a department. Managers can delegate tickets to agents, reassign tickets between agents, and toggle agent availability. When an agent becomes unavailable, the Manager becomes the fallback recipient for that agent's workload. The Manager sees a team panel with each agent's active ticket count, enabling workload-aware delegation.

Regular agents cannot influence the Manager in any way through the system. They cannot delegate tickets to the Manager, modify the Manager's status, or view the Manager's team panel.

### Manager ↔ Customer

There is no direct relationship. Customers interact with whoever is assigned to their ticket. If a ticket is auto-escalated to a Manager, the Manager responds through the same reply interface as any agent. The customer sees replies from the Manager just as they would from a regular agent — the customer's view does not distinguish between agent tiers.

### Agent ↔ Customer

Agents and customers interact exclusively through ticket replies. Customers cannot contact specific agents, and agents cannot see customer information beyond what is in the ticket (email, ticket content, attachments). Agents communicate via public replies (visible to the customer) and internal notes (hidden from the customer).

### Manager ↔ Manager

Within the system, two managers in different departments have no interaction mechanism. The single-manager-per-department constraint means there is never more than one manager within a department, so intra-department manager conflicts cannot occur.

---

## Ticket Lifecycle & Role Involvement

The following describes how each role participates at each stage of a ticket's lifecycle.

### 1. Ticket Creation (Customer)

The customer submits a ticket with a subject and body. The AI engine processes the submission and produces:
- A **department classification** (which department should handle this).
- A **priority assessment** (low, medium, or high).
- A **sentiment analysis** (positive, neutral, or negative).
- A **PII-redacted body** (sensitive information is masked).
- A **confidence score** indicating how certain the AI is about the classification.

If the AI classifies the ticket as high priority or negative sentiment, and the target department has an active Manager, the ticket is **immediately assigned to the Manager** and its status is set to "in_progress." Otherwise, the ticket enters the department's unassigned queue with status "open."

An SLA timer is attached based on the ticket's priority level.

### 2. Triage (Admin)

If the AI's classification confidence is low, or the ticket was not matched to a department, it appears in the admin's triage panel. The admin reviews the ticket, corrects the department assignment, and adjusts priority/sentiment if needed. When the admin assigns a department, the ticket may be auto-escalated to that department's Manager if it is flagged as high-risk.

### 3. Claiming (Agent or Manager)

For tickets in the unassigned queue, a regular agent can claim the ticket by assigning it to themselves. Claiming auto-advances the status from "open" to "in_progress." High-risk tickets cannot be claimed by regular agents if a Manager exists — they are reserved for the Manager.

Managers can claim any ticket and can also delegate tickets directly to specific agents.

### 4. Working (Agent / Manager / Admin)

The assigned agent (or manager) works the ticket: replying to the customer, adding internal notes, uploading/downloading attachments, and updating the status through the workflow states (in_progress → pending → resolved → closed).

Admins can intervene at any point to reassign, change priority/department, or update the status.

### 5. Mid-Lifecycle Escalation (System → Manager)

If a ticket's priority or sentiment is changed to high/negative during its lifecycle (by an admin or the system), and the department has a Manager, the ticket is automatically reassigned to the Manager with an audit trail and email notification.

### 6. Resolution (Agent / Manager)

The agent or manager resolves the ticket by setting its status to "resolved" or "closed."

### 7. Rating (Customer)

After a ticket is resolved or closed, the customer can rate the experience (1–5 stars with optional feedback). This rating feeds into the CSAT analytics visible to agents and admins.

---

## Escalation & Auto-Routing System

The system implements an intelligent escalation and routing mechanism centered around the Department Manager role.

### Automatic Escalation Triggers

| Trigger | What Happens |
|---|---|
| New ticket with high priority or negative sentiment | Auto-assigned to department Manager; status set to "in_progress"; internal note and email sent |
| Priority/sentiment elevated mid-lifecycle | Ticket reassigned from current agent to department Manager; audit note and email sent |
| Agent deactivated / archived / transferred | All open tickets from that agent reassigned to department Manager (or unassigned queue if no Manager) |
| Manager demoted (succession) | Open tickets transferred to new Manager or returned to unassigned queue |
| Ticket triaged to department with Manager (high-risk) | Auto-escalated to Manager during admin triage |

### Fallback Behavior

If no active Manager exists for a department at the time of an escalation trigger, the ticket is **not assigned to anyone**. Instead, it is placed in the department's unassigned queue, where any agent can claim it (including high-risk tickets, since no manager exists to reserve them for).

---

## Permission Summary

| Capability | Customer | Regular Agent | Manager | Admin |
|---|:---:|:---:|:---:|:---:|
| Create tickets | ✅ | ✅ | ✅ | ✅ |
| View own tickets | ✅ | — | — | — |
| View department tickets | ❌ | ✅ | ✅ | ✅ |
| View all tickets globally | ❌ | ❌ | ❌ | ✅ |
| Update ticket status/priority | ❌ | ✅ | ✅ | ✅ |
| Claim unassigned ticket | ❌ | ✅ | ✅ | ✅ |
| Claim high-risk ticket | ❌ | ❌ | ✅ | ✅ |
| Delegate ticket to another agent | ❌ | ❌ | ✅ | ✅ |
| Unassign ticket back to queue | ❌ | ❌ | ✅ | ✅ |
| Transfer ticket to another dept | ❌ | ❌ | ✅ | ✅ |
| Delete ticket | ❌ | ❌ | ❌ | ✅ |
| Triage AI-classified tickets | ❌ | ❌ | ❌ | ✅ |
| Reply to ticket | ✅ | ✅ | ✅ | ✅ |
| Write internal notes | ❌ | ✅ | ✅ | ✅ |
| See internal notes | ❌ | ✅ | ✅ | ✅ |
| Delete replies | ❌ | ❌ | ❌ | ✅ |
| Rate resolved ticket | ✅ | ❌ | ❌ | ❌ |
| Upload/download attachments | ✅ | ✅ | ✅ | ✅ |
| Invite agents | ❌ | ❌ | ❌ | ✅ |
| Manage users (CRUD) | ❌ | ❌ | ❌ | ✅ |
| Toggle agent availability | ❌ | ❌ | ✅ | ✅ |
| View department team | ❌ | ❌ | ✅ | ✅ |
| Create/edit/delete departments | ❌ | ❌ | ❌ | ✅ |
| Create/edit/delete SLA policies | ❌ | ❌ | ❌ | ✅ |
| View analytics (personal) | ❌ | ✅ | ✅ | ✅ |
| View analytics (department) | ❌ | ✅ | ✅ | ✅ |
| View analytics (global) | ❌ | ❌ | ❌ | ✅ |


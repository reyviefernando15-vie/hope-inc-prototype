# Hope SMS — Sprint 3 Presentation Deck

---

# Slide 1 — Title

### Hope SMS  
Sales Management System

> Sprint 3 Final Presentation  
> Hope, Inc.

---

### Team Members

- M1 — Project Lead / Full-Stack Developer
- M2 — Database & Backend Engineer
- M3 — Security & RLS Specialist
- M4 — Rights & Authentication Specialist
- M5 — QA / Documentation Specialist

## Slide 2 — Project Overview

### Project Description

HopeSMS is a modern Sales Management System designed to:

- Manage sales transactions
- Monitor business activity
- Handle lookup references
- Provide analytics and reporting
- Enforce secure role-based access control

---

## Slide 3 — Objectives

### System Objectives

- Streamline transaction management
- Improve reporting visibility
- Secure administrative operations
- Implement role-based access restrictions
- Support scalable sales workflows

---

## Slide 4 — Technology Stack

### Technologies Used

| Layer | Technology |
|------|-------------|
| Frontend | HTML5 |
| Styling | CSS |
| Build Tool | Vite |
| Database | Supabase |
| Authentication | Google OAuth |
| Version Control | GitHub |
| Deployment | GitHub Pages |

---

## Slide 5 — System Features

### Core Features

- Google Authentication
- Dashboard Analytics
- Transaction Management
- Lookup Tables
- Deleted Item Recovery
- User Management
- Protected Access Controls

---

## Slide 6 — Database Architecture

### ERD Overview

Main Tables:

- customer
- employee
- sales
- salesdetail
- product
- pricelist
- category
- payment

### Relationships

- Customers create sales
- Employees process sales
- Sales contain multiple line items
- Products maintain pricing history

---

## Slide 7 — Rights Matrix

### Role-Based Access Control

| Module | Sales Agent | Manager | Owner |
|--------|--------------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Transactions | ✅ | ✅ | ✅ |
| Delete Transactions | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Lookup Tables | ✅ | ✅ | ✅ |

---

## Slide 8 — QA Testing

### Sprint QA Validation

Completed Tests:

- Authentication validation
- Lookup-only enforcement
- RLS protection validation
- Cascade visibility testing
- Production testing
- Deployment validation

---

## Slide 9 — Production Deployment

### Deployment Environment

Production URL:

```text
https://reyviefernando15-vie.github.io/hope-inc-prototype/
```

### Deployment Features

- GitHub Pages hosting
- Automated deployment workflow
- Public production environment

---

## Slide 10 — Challenges Encountered

### Issues Resolved

- Vitest package configuration
- GitHub Actions deployment failures
- Authentication loading delays
- Pull request workflow setup
- QA testing structure alignment

---

## Slide 11 — Lessons Learned

### Key Learnings

- Agile sprint workflow
- GitHub pull request management
- QA validation process
- Production deployment handling
- Role-based security validation
- Documentation standards

---

## Slide 12 — Conclusion

# Thank You

### HopeSMS successfully demonstrated:

- Secure authentication
- Sales workflow management
- Lookup enforcement
- Production deployment
- QA validation workflow
- Sprint documentation process
  
# Hope, Inc.

## Sales Management System

### Sprint 3 Final Presentation

---

New Era University  
Bachelor of Science in Information Technology

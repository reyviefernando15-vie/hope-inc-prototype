# Sprint 2 Log — HopeSMS

**Project:** Hope, Inc. Sales Management System  
**Team:** New Era University — BS Information Technology  
**Prepared by:** M5 — Bryan (QA / Documentation Specialist)  
**Sprint Duration:** Week 3 & Week 4

---

# 👥 Team Members & Roles

| Member | Role |
|--------|------|
| M1 | Project Lead / Full-Stack Developer |
| M2 | Frontend Developer |
| M3 | Backend / Database Engineer |
| M4 | Rights & Authentication Specialist |
| M5 | QA / Documentation Specialist |

---

# ✅ Sprint Goal

Validate role-based permissions, lookup-only restrictions, cascade visibility behavior, and transaction-related QA flows.

---

# 🛠 Tasks Completed

## M5 — QA / Documentation Specialist

---

# PR-01 — Full Rights Matrix Validation

### Branch
`test/sprint2-rights-39-cases`

### Validation Scope

Performed role-access validation for:

- SUPERADMIN / OWNER
- ADMIN / MANAGER
- USER / SALES AGENT

### Rights Tested

| Feature | Sales Agent | Manager | Owner |
|---------|-------------|---------|-------|
| Dashboard Access | ✅ | ✅ | ✅ |
| Transactions View | ✅ | ✅ | ✅ |
| Transaction Create | ❌ | ✅ | ✅ |
| Transaction Edit | ❌ | ✅ | ✅ |
| Transaction Delete | ❌ | ❌ | ✅ |
| Analytics Access | ✅ | ✅ | ✅ |
| Deleted Items Access | ❌ | ✅ | ✅ |
| Customers Lookup | ✅ | ✅ | ✅ |
| Employees Lookup | ✅ | ✅ | ✅ |
| Products Lookup | ✅ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |

### Status

✅ Rights matrix validation completed successfully.

---

# PR-02 — Cascade Visibility + RLS Validation

### Branch
`test/sprint2-cascade-visibility`

### Tests Performed

- Verified restricted visibility behavior
- Inspected protected pages and modules
- Observed role-based access restrictions
- Monitored protected requests using browser DevTools
- Validated restricted UI actions

### RLS Validation

Confirmed that unauthorized operations remained restricted during authenticated sessions.

### Status

✅ Cascade visibility and RLS validation completed successfully.

---

# PR-03 — Lookup-only Enforcement + Price Auto-fill Tests

### Branch
`test/sprint2-lookup-price-autofill`

### Lookup Validation

Tested the following lookup tables:

- Customers
- Employees
- Products

### Validation Performed

- Verified read-only behavior
- Confirmed absence of add/edit/delete controls
- Confirmed lookup-only restrictions were enforced successfully

### Price Auto-fill Validation

Observed transaction entry workflow and verified associated product information behavior during selection process.

### Status

✅ Lookup enforcement and auto-fill validation completed successfully.

---

# 📸 QA Evidence Gathered

- Dashboard validation screenshots
- Lookup-only table screenshots
- Network request inspection
- Authentication validation screenshots
- Rights restriction observations

---

# ⚠ Blockers Encountered

- Initial npm test configuration issues
- GitHub Actions deployment validation failure caused by invalid package version formatting
- Minor authentication loading delay during Google login validation

---

# 💡 Resolutions

- Corrected package configuration and Vitest dependency versions
- Validated deployment pipeline after package corrections
- Re-tested authentication and protected access flows successfully

---

## 🎯 Next Sprint Goals

- Perform end-to-end production validation testing
- Document full production workflow 
- Finalize HopeSMS User Manual documentation
- Validate deployment accessibility and protected access behavior
- Prepare Sprint 3 final presentation deck
- Conduct final QA regression and deployment verification

---

# 🚀 Sprint 2 Status

✅ Sprint 2 completed successfully

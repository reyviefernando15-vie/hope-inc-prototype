# Sprint 1 Log — HopeSMS

**Project:** Hope, Inc. Sales Management System  
**Team:** New Era University — BS Information Technology  
**Prepared by:** M5 — Bryan (QA / Documentation Specialist)  
**Sprint Duration:** Week 1 & Week 2  

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

Project setup, Sales Management System initialization, Email + Google OAuth authentication, and login guard validation.

---

# 🛠 Tasks Completed

## M5 — QA / Documentation Specialist

### Testing Setup

- Installed and configured **Vitest** for automated testing
- Configured testing environment for Vanilla JavaScript + Vite
- Verified local testing execution using `npm test`
- Validated successful test execution workflow

---

# 🔐 Authentication Test Cases

### PR-01 — `test/sprint1-auth-flows`

Completed and verified the following authentication-related test cases:

| Test Case | Status |
|-----------|--------|
| ACTIVE User Login Validation | ✅ Passed |
| INACTIVE User Access Restriction | ✅ Passed |
| Admin Email Validation | ✅ Passed |

---

# 📄 Documentation Tasks

### PR-02 — `docs/sprint1-log-readme`

Completed the following documentation tasks:

- Updated `README.md`
- Added repository setup instructions
- Added `npm install` guide
- Added local development setup instructions
- Added deployment reference using GitHub Pages
- Documented Sprint 1 testing workflow

---

# ⚠ Blockers Encountered

- Initial configuration issues with Vitest setup
- Local test files were not detected during initial execution
- Package configuration required debugging and correction

---

# 💡 Resolutions

- Updated `package.json` testing configuration
- Created proper `tests/auth.test.js` structure
- Verified successful automated test execution locally
- Coordinated with team members to validate authentication functionality

---

# 🎯 Next Sprint Goals

- Validate role-based rights matrix and access permissions
- Test lookup-only table restrictions and protected CRUD behavior
- Verify cascade visibility and soft-delete recovery behavior
- Perform RLS protection and restricted access validation
- Expand transaction workflow QA coverage
- Improve Sprint QA documentation and pull request workflow

---

# 🚀 Sprint 1 Status

✅ **Sprint 1 completed successfully**  
✅ **All authentication tests passed**  
✅ **Testing environment configured successfully**

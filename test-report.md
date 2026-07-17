# Backend Test Report

## Overview
This report summarizes backend test coverage for the Profile_App Node/Express API. The focus is on backend-only testing, covering both functional API behavior and non-functional security/status checks.

## Test Objectives

### Functional Testing
- Verify user registration and input validation.
- Verify login authentication and JWT issuance.
- Verify protected profile retrieval for authenticated users.
- Verify profile update behavior and field validation.
- Verify audit log creation and retrieval.

### Non-Functional Testing
- Verify protected routes reject missing or invalid JWT tokens.
- Verify basic API status endpoint behavior.
- Verify security headers from Helmet are present on API responses.

## Test Implementation
- Added Jest as the test runner.
- Added Supertest for HTTP integration testing.
- Used mongodb-memory-server for in-memory MongoDB during tests.
- Refactored `server.js` so tests can import `app` without starting the real server.

## Test Files
- `tests/setupDB.js` — in-memory MongoDB lifecycle management.
- `tests/jest.setup.js` — Jest setup placeholder.
- `tests/auth.test.js` — registration and login tests.
- `tests/profile.test.js` — profile retrieval and update tests.
- `tests/auditlogs.test.js` — audit log verification.
- `tests/security.test.js` — JWT protection and API status/security checks.

## Results
- `npm test` passed successfully.
- 4 test suites executed.
- 15 tests passed.

## Notes
- The backend test suite runs without a real MongoDB instance by using in-memory databases.
- Current coverage is backend-only; frontend testing is not included in this implementation.
- The app still starts normally with `npm start`.

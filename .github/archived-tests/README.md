# Archived Tests

This directory contains test files that were removed when actions were migrated to external repositories. These tests are preserved here for reference and potential future transfer.

## Auto-Assign-Copilot Tests

**File**: `auto-assign-copilot-helpers.test.js`

**Original Location**: `actions/auto-assign-copilot/src/helpers.test.js`

**Status**: Archived when the action was migrated to https://github.com/mudman1986/auto-assign-copilot

**Test Coverage**: 
- 20 unit tests covering helper functions
- Tests for issue filtering, label parsing, and assignment logic
- All tests were passing at the time of migration

**Purpose**: 
These tests validate the core helper functions used in the auto-assign-copilot action. They are preserved here in case:
1. The external repository needs the tests transferred
2. Future modifications to the workflow require test validation
3. Historical reference for how the action logic was tested

**Transfer Instructions**:
If you need to transfer these tests to the external repository:
1. Copy `auto-assign-copilot-helpers.test.js` to the external repo's test directory
2. Update the `require()` path to match the external repo structure
3. Ensure Jest (or equivalent test framework) is configured
4. Run `npm test` to verify all tests pass

**Note**: The require path in the test file (`const helpers = require("../src/helpers.js");`) will need to be updated based on the directory structure in the external repository.

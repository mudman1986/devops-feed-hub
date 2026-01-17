#!/usr/bin/env node

/**
 * Wrapper to run integration test with data from GitHub MCP
 * This file will be called with actual GitHub data passed as argument
 */

const { runTest } = require('./integration-test-mcp.js');
const fs = require('fs');

// Read the data file passed as argument
const dataFile = process.argv[2];
if (!dataFile) {
  console.error('Usage: node run-integration-test.js <data-file.json>');
  process.exit(1);
}

const liveIssues = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
runTest(liveIssues);

import '@testing-library/jest-dom/vitest';
import { expect, beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createTestDb } from './helpers/createTestDb';
import { clearTestDb } from './helpers/clearTestDb';

// Extend Vitest's expect method with testing-library matchers
expect.extend(matchers);

// Run cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock API handlers
const handlers = [
  http.get('/api/songs', () => {
    return HttpResponse.json([]);
  }),
  http.post('/api/songs/upload', () => {
    return HttpResponse.json({ success: true });
  }),
];

const server = setupServer(...handlers);

// Global test setup
beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' });
  await createTestDb();
});

afterAll(async () => {
  server.close();
  await clearTestDb();
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

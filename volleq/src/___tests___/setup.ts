import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel('error'); // suppress Firestore noise

  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test',
    firestore: { host: 'localhost', port: 8080 },
  });

  // Make testEnv available globally
  (globalThis as any).testEnv = testEnv;
});

afterEach(async () => {
  await testEnv.clearFirestore(); // reset between tests
  cleanup();
});

afterAll(async () => {
  await testEnv.cleanup();
});
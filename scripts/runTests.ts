import { runCleanSpotTestSuite } from '../src/tests/unitTests';

console.log('========================================================');
console.log('   CLEANSPOT CORE LOGIC TEST RUNNER                     ');
console.log('   “See it. Report it. Clean it.”                       ');
console.log('========================================================\n');

const suite = runCleanSpotTestSuite();

suite.results.forEach((r, idx) => {
  const symbol = r.passed ? '✓' : '✗';
  console.log(`${symbol} [TEST ${idx + 1}] ${r.testName}`);
  if (!r.passed && r.details) {
    console.log(`   Error: ${r.details}`);
  }
});

console.log('\n--------------------------------------------------------');
console.log(`Summary: ${suite.passed}/${suite.total} tests passed (${suite.failed} failures).`);
console.log('--------------------------------------------------------');

if (suite.failed > 0) {
  process.exit(1);
} else {
  console.log('All CleanSpot core algorithms verified successfully!\n');
  process.exit(0);
}

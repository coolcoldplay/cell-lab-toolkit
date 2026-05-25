const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const match = html.match(new RegExp(`function ${name}[\\s\\S]*?\\n}\\n`));
  assert.ok(match, `${name} should be defined`);
  return match[0];
}

const sandbox = {};
vm.runInNewContext(
  extractFunction('calculateDmsoLimit') +
    extractFunction('calculateDilutionDmsoPercent') +
    '\nthis.calculateDmsoLimit = calculateDmsoLimit;' +
    '\nthis.calculateDilutionDmsoPercent = calculateDilutionDmsoPercent;',
  sandbox
);

const pureDmsoStock = sandbox.calculateDmsoLimit(0.01, 0.1, 100);
assert.equal(pureDmsoStock.dilutionFold, 1000);
assert.equal(pureDmsoStock.maxFinalConcentrationBase, 0.00001);

const mixedDmsoStock = sandbox.calculateDmsoLimit(0.02, 0.5, 50);
assert.equal(mixedDmsoStock.dilutionFold, 100);
assert.equal(mixedDmsoStock.maxFinalConcentrationBase, 0.0002);

assert.throws(
  () => sandbox.calculateDmsoLimit(0.01, 0, 100),
  /greater than zero/
);

assert.throws(
  () => sandbox.calculateDmsoLimit(0.01, 101, 100),
  /cannot exceed 100/
);

assert.throws(
  () => sandbox.calculateDmsoLimit(0.01, 20, 10),
  /cannot exceed stock DMSO/
);

assert.equal(sandbox.calculateDilutionDmsoPercent(100, 1000), 0.1);
assert.equal(sandbox.calculateDilutionDmsoPercent(50, 100), 0.5);

assert.throws(
  () => sandbox.calculateDilutionDmsoPercent(100, 0),
  /dilution fold must be greater than zero/
);

console.log('DMSO limit tests passed');

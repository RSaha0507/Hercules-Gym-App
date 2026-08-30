const fs = require('fs');
const file = 'frontend/app/(tabs)/merchandise.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  `{t('Submit for Verification')}`,
  `{t('Submit Payment')}`
);
data = data.replace(
  `{t('After admin confirmation, collect items at gym')}`,
  `{t('Please upload screenshot before checkout')}`
);

fs.writeFileSync(file, data);

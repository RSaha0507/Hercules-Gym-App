const fs = require('fs');
const file = 'frontend/app/(tabs)/merchandise.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  `if (cart.length === 0) return;`,
  `if (cart.length === 0) return;\n    if (!paymentProofImage) {\n      Alert.alert(t('Upload screenshot'), t('Please upload payment screenshot to continue.'));\n      return;\n    }`
);

data = data.replace(
  `t('Total: Rs.{amount}\\n\\nSubmit order? You will pay at the gym counter.', {`,
  `t('Total: Rs.{amount}\\n\\nSubmit screenshot to admin for payment verification?', {`
);

data = data.replace(
  `              await api.createMerchandiseOrder(
                cart.map((item) => ({
                  merchandise_id: item.merchandise.id,
                  size: item.size,
                  quantity: item.quantity,
                })),
                notes,
                "" // no proof needed
              );`,
  `              await api.createMerchandiseOrder(
                cart.map((item) => ({
                  merchandise_id: item.merchandise.id,
                  size: item.size,
                  quantity: item.quantity,
                })),
                notes,
                paymentProofImage
              );`
);

// We need to check if the UI actually got removed.
// Since my previous patch_merch.cjs failed to remove it (due to using styles.uploadButton instead of styles.proofPickerButton), 
// it should still be in the file. Let's verify this by checking if proofPickerButton exists.

fs.writeFileSync(file, data);

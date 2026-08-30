const fs = require('fs');
const file = 'frontend/app/(tabs)/merchandise.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Remove screenshot check in handleProceed
data = data.replace(
  `if (false) {
      Alert.alert(t('Upload screenshot'), t('Please upload payment screenshot to continue.'));
      return;
    }`,
  ``
);

// 2. Change Alert to not mention screenshot
data = data.replace(
  `t('Total: Rs.{amount}\\n\\nSubmit screenshot to admin for payment verification?', {`,
  `t('Total: Rs.{amount}\\n\\nSubmit order? You will pay at the gym counter.', {`
);

// 3. Remove paymentProofImage from createMerchandiseOrder API call
data = data.replace(`paymentProofImage,`, `"" // no proof needed`);

// 4. Remove UI for paymentProofImage upload
const uploadUI = `                  <TouchableOpacity 
                    style={[styles.uploadButton, paymentProofImage ? styles.uploadButtonSuccess : {}]} 
                    onPress={pickPaymentImage}
                  >
                    <Ionicons 
                      name={paymentProofImage ? "checkmark-circle" : "cloud-upload-outline"} 
                      size={24} 
                      color={paymentProofImage ? theme.success : theme.primary} 
                    />
                    <Text style={[
                      styles.uploadButtonText, 
                      { color: paymentProofImage ? theme.success : theme.primary }
                    ]}>
                      {paymentProofImage ? t('Change screenshot') : t('Upload payment screenshot')}
                    </Text>
                  </TouchableOpacity>`;

data = data.replace(uploadUI, ``);
fs.writeFileSync(file, data);

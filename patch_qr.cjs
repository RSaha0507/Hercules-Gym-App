const fs = require('fs');
const file = 'frontend/app/profile/attendance-qr.tsx';
let data = fs.readFileSync(file, 'utf8');

const imports = `import * as Print from 'expo-print';\nimport * as Sharing from 'expo-sharing';\nimport QRCode from 'react-native-qrcode-svg';`;
data = data.replace("import QRCode from 'react-native-qrcode-svg';", imports);

const printMethod = `
  const printQR = async () => {
    if (!payload) return;
    try {
      const html = \`
        <html>
          <body style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column;">
            <h1>Hercules Gym Attendance QR</h1>
            <p>Scan this QR code at the counter.</p>
            <div style="margin-top:50px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=\${encodeURIComponent(payload)}" />
            </div>
          </body>
        </html>
      \`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.log('Error printing QR', e);
    }
  };
`;

data = data.replace('return (', printMethod + '\\n  return (');

const button = `
          <TouchableOpacity style={[styles.refreshButton, { backgroundColor: theme.primary, marginTop: 15 }]} onPress={printQR}>
            <Ionicons name="print-outline" size={20} color="#FFF" />
            <Text style={styles.refreshButtonText}>Print as PDF</Text>
          </TouchableOpacity>
`;

data = data.replace('</View>\\n        </View>', button + '\\n        </View>\\n        </View>');

fs.writeFileSync(file, data);

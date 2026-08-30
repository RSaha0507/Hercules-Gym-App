const fs = require('fs');
const file = 'frontend/src/services/api.ts';
let data = fs.readFileSync(file, 'utf8');

const newMethod = `
  async generateAiPlan(payload: { goal: string; level: string; weight: string }) {
    const response = await this.client.post('/generate-ai-plan', payload);
    return response.data;
  }`;

data = data.replace('export const api = new ApiService();', newMethod + '\\n}\\n\\nexport const api = new ApiService();');
fs.writeFileSync(file, data);

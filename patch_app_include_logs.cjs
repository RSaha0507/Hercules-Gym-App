const fs = require('fs');
const file = 'backend/server.py';
let data = fs.readFileSync(file, 'utf8');
data = data.replace('from ai_plan import router as ai_router', 'from ai_plan import router as ai_router\\nfrom workout_logger import router as workout_logs_router');
data = data.replace('app.include_router(ai_router)', 'app.include_router(ai_router)\\napp.include_router(workout_logs_router)');
fs.writeFileSync(file, data);

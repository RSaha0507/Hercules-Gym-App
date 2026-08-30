const fs = require('fs');
const file = 'backend/server.py';
let data = fs.readFileSync(file, 'utf8');
data = data.replace('import socketio', 'import socketio\nfrom ai_plan import router as ai_router');
data = data.replace('app.add_middleware(', 'app.include_router(ai_router)\napp.add_middleware(');
fs.writeFileSync(file, data);

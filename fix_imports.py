import re

with open('backend/server.py', 'r') as f:
    server_code = f.read()

with open('backend/ai_plan.py', 'r') as f:
    ai_code = f.read()

with open('backend/workout_logger.py', 'r') as f:
    wl_code = f.read()

# Remove the bad imports from server.py
server_code = server_code.replace("from ai_plan import router as ai_router\n", "")
server_code = server_code.replace("from workout_logger import router as workout_logs_router\n", "")

# We also need to strip out the imports from ai_code and wl_code, and rename 'router' to 'ai_router' / 'workout_logs_router'
def clean_code(code, router_name):
    # Remove all lines starting with 'from ' or 'import ' that refer to local modules
    lines = code.split('\n')
    out = []
    for line in lines:
        if line.startswith('from database') or line.startswith('from auth') or line.startswith('from models'):
            continue
        if line.startswith('from fastapi') or line.startswith('from typing'):
            continue
        out.append(line)
    
    clean = '\n'.join(out)
    clean = clean.replace('router = APIRouter', f'{router_name} = APIRouter')
    clean = clean.replace('@router.', f'@{router_name}.')
    return clean

ai_clean = clean_code(ai_code, 'ai_router')
wl_clean = clean_code(wl_code, 'workout_logs_router')

# Find where app.include_router(ai_router) is, and insert the clean code right above it
insert_idx = server_code.find('app.include_router(ai_router)')

new_server = server_code[:insert_idx] + '\n\n' + ai_clean + '\n\n' + wl_clean + '\n\n' + server_code[insert_idx:]

with open('backend/server.py', 'w') as f:
    f.write(new_server)

print("Done")

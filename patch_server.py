import re

with open('backend/server.py', 'r') as f:
    data = f.read()

old_func = """def normalize_payment_proof_image(value: Optional[str]) -> str:
    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Payment screenshot is required")
    if len(raw) > PAYMENT_PROOF_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Payment screenshot is too large")
    if not (raw.startswith("data:image/") or raw.startswith("http://") or raw.startswith("https://")):
        raise HTTPException(status_code=400, detail="Payment screenshot must be an image data URI or image URL")
    return raw"""

new_func = """import re
def normalize_payment_proof_image(value: Optional[str]) -> str:
    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Payment screenshot is required")
    if len(raw) > PAYMENT_PROOF_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Payment screenshot is too large")
        
    # Strict validation for image MIME types
    valid_data_uri_pattern = r'^data:image/(jpeg|png|webp|jpg);base64,[A-Za-z0-9+/=]+$'
    valid_url_pattern = r'^https?://[A-Za-z0-9\-\._~:/?#\[\]@!$&\'()*+,;=]+$'
    
    is_valid_uri = re.match(valid_data_uri_pattern, raw)
    is_valid_url = re.match(valid_url_pattern, raw)
    
    if not (is_valid_uri or is_valid_url):
        raise HTTPException(status_code=400, detail="Invalid image format. Only JPEG, PNG, and WebP images are allowed.")
    
    return raw"""

if old_func in data:
    data = data.replace(old_func, new_func)
    with open('backend/server.py', 'w') as f:
        f.write(data)
    print("Patched successfully")
else:
    print("Old function not found!")


import os
import httpx
from dotenv import load_dotenv
import json
import re
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Deterministic Encryption so we can still search by exact Aadhar/Mobile
# In production, use a secure secret from KMS. For hackathon, we use a robust static seed.
SECRET_SEED = os.environ.get("ENCRYPTION_SECRET", "JanSahayakHackathonSuperSecretKey2026")
AES_KEY = hashlib.sha256(SECRET_SEED.encode()).digest()

def get_headers():
    if not SUPABASE_KEY:
        return {}
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def encrypt_pii(plaintext: str) -> str:
    """Deterministically encrypt PII like Aadhaar or Phone to allow DB search."""
    if not plaintext: return plaintext
    clean_text = str(plaintext).strip()
    cipher = Cipher(algorithms.AES(AES_KEY), modes.ECB(), backend=default_backend())
    encryptor = cipher.encryptor()
    # Pad to 16 bytes block size
    padded = clean_text + (16 - len(clean_text) % 16) * " "
    ct = encryptor.update(padded.encode('utf-8')) + encryptor.finalize()
    return base64.b64encode(ct).decode('utf-8')

def decrypt_pii(ciphertext: str) -> str:
    if not ciphertext or len(ciphertext) < 10: return ciphertext
    try:
        cipher = Cipher(algorithms.AES(AES_KEY), modes.ECB(), backend=default_backend())
        decryptor = cipher.decryptor()
        ct = base64.b64decode(ciphertext)
        pt = decryptor.update(ct) + decryptor.finalize()
        return pt.decode('utf-8').strip()
    except Exception:
        # If decryption fails, return original (useful if old data is plaintext)
        return ciphertext

def validate_submission(data: dict):
    """Server-side validation for phone and aadhar formats."""
    if "mobile" in data and data["mobile"]:
        clean_mobile = str(data["mobile"]).replace(" ", "").replace("+91", "")
        if not re.match(r'^\d{10}$', clean_mobile):
            return False, "Invalid mobile number. Must be 10 digits."
    
    if "aadhar" in data and data["aadhar"]:
        clean_aadhar = str(data["aadhar"]).replace(" ", "")
        if not re.match(r'^\d{12}$', clean_aadhar):
            return False, "Invalid Aadhaar number. Must be 12 digits."
            
    return True, ""

def save_form_submission(data: dict):
    """
    Save form data to Supabase 'submissions' table via REST API.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: Supabase credentials missing")
        return {"error": "Database not configured"}
        
    is_valid, err_msg = validate_submission(data)
    if not is_valid:
        return {"error": err_msg}
    
    # Encrypt sensitive fields before saving
    secure_data = data.copy()
    if secure_data.get("mobile"):
        secure_data["mobile"] = encrypt_pii(secure_data["mobile"])
    if secure_data.get("aadhar"):
        secure_data["aadhar"] = encrypt_pii(secure_data["aadhar"])
        
    # Also encrypt inside json blob if present
    if "fields" in secure_data:
        fields_copy = secure_data["fields"].copy()
        if fields_copy.get("aadhar"):
            fields_copy["aadhar"] = encrypt_pii(fields_copy["aadhar"])
        if fields_copy.get("mobile"):
            fields_copy["mobile"] = encrypt_pii(fields_copy["mobile"])
        secure_data["fields"] = fields_copy
    
    try:
        url = f"{SUPABASE_URL}/rest/v1/submissions"
        headers = get_headers()
        
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=secure_data)
            
        if response.status_code in [200, 201]:
            saved_records = response.json()
            # Decrypt back for the frontend response so they see plaintext
            if saved_records and isinstance(saved_records, list):
                rec = saved_records[0]
                rec["mobile"] = decrypt_pii(rec.get("mobile"))
                rec["aadhar"] = decrypt_pii(rec.get("aadhar"))
            return saved_records
        else:
            print(f"Supabase Error: {response.text}")
            return {"error": f"Failed to save: {response.status_code}", "details": response.text}
            
    except Exception as e:
        print(f"Error saving to database: {e}")
        return {"error": str(e)}

def get_user_submissions(user_identifier: str, limit: int = 10, offset: int = 0):
    """
    Fetch submissions for a specific user via REST API with pagination.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    
    try:
        clean_id = str(user_identifier).replace(" ", "")
        encrypted_id = encrypt_pii(clean_id)
        
        # Searching by the ENCRYPTED identifier in Supabase
        query = f"or=(mobile.eq.{encrypted_id},aadhar.eq.{encrypted_id})&order=created_at.desc&limit={limit}&offset={offset}"
        url = f"{SUPABASE_URL}/rest/v1/submissions?{query}"
        headers = get_headers()
        
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            
        if response.status_code == 200:
            records = response.json()
            # Decrypt fields on the way out
            for r in records:
                r["mobile"] = decrypt_pii(r.get("mobile"))
                r["aadhar"] = decrypt_pii(r.get("aadhar"))
                if r.get("fields"):
                    if r["fields"].get("mobile"): r["fields"]["mobile"] = decrypt_pii(r["fields"]["mobile"])
                    if r["fields"].get("aadhar"): r["fields"]["aadhar"] = decrypt_pii(r["fields"]["aadhar"])
            return records
        return []
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        return []

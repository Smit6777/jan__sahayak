
import os
import httpx
from dotenv import load_dotenv
import json

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

def get_headers():
    if not SUPABASE_KEY:
        return {}
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def save_form_submission(data: dict):
    """
    Save form data to Supabase 'submissions' table via REST API.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: Supabase credentials missing")
        return {"error": "Database not configured"}
    
    try:
        url = f"{SUPABASE_URL}/rest/v1/submissions"
        headers = get_headers()
        
        # httpx is synchronous here since we aren't using async def (FastAPI runs it in threadpool)
        # But requests is safer if we want synchronous. httpx can do sync too.
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=data)
            
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"Supabase Error: {response.text}")
            return {"error": f"Failed to save: {response.status_code}", "details": response.text}
            
    except Exception as e:
        print(f"Error saving to database: {e}")
        return {"error": str(e)}

def get_user_submissions(user_identifier: str):
    """
    Fetch submissions for a specific user via REST API.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    
    try:
        # Filter by mobile or aadhar using Postgrest syntax
        # or=(mobile.eq.val,aadhar.eq.val)
        query = f"or=(mobile.eq.{user_identifier},aadhar.eq.{user_identifier})"
        url = f"{SUPABASE_URL}/rest/v1/submissions?{query}"
        headers = get_headers()
        
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        return []

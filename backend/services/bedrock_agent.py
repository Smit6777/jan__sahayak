"""
AWS Bedrock Agent Service
Extracts form fields from natural language using Claude AI

In Demo Mode: Returns simulated extraction results
In Real Mode: Uses AWS Bedrock with Claude model
"""

import os
import re
import json
from typing import Dict, Any

# Demo mode extraction patterns
EXTRACTION_PATTERNS = {
    "name": [
        r"(?:naam|name|नाम)\s*(?:hai|है|:)?\s*([a-zA-Z\u0900-\u097F\s]+)",
        r"(?:mera|meri|मेरा|मेरी)\s*(?:naam|name|नाम)\s*([a-zA-Z\u0900-\u097F\s]+)",
        r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$"
    ],
    "aadhar": [
        r"(\d{4}\s*\d{4}\s*\d{4})",
        r"(?:aadhar|aadhaar|आधार)\s*(?:number|नंबर|no)?\s*(?:hai|है|:)?\s*(\d{12})"
    ],
    "mobile": [
        r"(?:mobile|phone|मोबाइल|फोन)\s*(?:number|नंबर|no)?\s*(?:hai|है|:)?\s*(\d{10})",
        r"(?:call|contact)\s*(?:on|at)?\s*(\d{10})"
    ],
    "fatherName": [
        r"(?:father|pita|पिता|papa)\s*(?:ka|की|का)?\s*(?:naam|name|नाम)\s*(?:hai|है|:)?\s*([a-zA-Z\u0900-\u097F\s]+)"
    ],
    "bankAccount": [
        r"(?:bank|बैंक)\s*(?:account|खाता)\s*(?:number|नंबर|no)?\s*(?:hai|है|:)?\s*(\d{9,18})"
    ],
    "ifsc": [
        r"(?:ifsc|IFSC)\s*(?:code|कोड)?\s*(?:hai|है|:)?\s*([A-Z]{4}0[A-Z0-9]{6})"
    ],
    "address": [
        r"(?:address|pata|पता)\s*(?:hai|है|:)?\s*(.+?)(?:\.|$)",
        r"(?:rahta|rahte|रहता|रहते)\s*(?:hu|hun|हूं|हूँ)?\s*(.+?)(?:\.|$)"
    ],
    "landArea": [
        r"(\d+(?:\.\d+)?)\s*(?:hectare|हेक्टेयर|acre|एकड़|bigha|बीघा)"
    ]
}

# Demo mode sample responses
DEMO_RESPONSES = {
    "hi": {
        "success_message": "मैंने आपकी जानकारी समझ ली है। कृपया जांच लें।",
        "partial_message": "कुछ जानकारी मिली। कृपया बाकी भरें।",
        "fail_message": "माफ करें, मुझे समझ नहीं आया। कृपया फिर से बोलें।"
    },
    "en": {
        "success_message": "I understood your information. Please verify.",
        "partial_message": "Found some information. Please fill the rest.",
        "fail_message": "Sorry, I didn't understand. Please try again."
    }
}


async def extract_form_fields(
    transcript: str,
    scheme: str,
    language: str = "hi",
    demo_mode: bool = True
) -> Dict[str, Any]:
    """
    Extract form fields from voice transcript
    
    Args:
        transcript: The voice input text
        scheme: Government scheme ID
        language: Input language (hi/gu/en)
        demo_mode: Use simulated responses instead of AWS
    
    Returns:
        Extracted fields with confidence score
    """
    
    if demo_mode:
        return await _demo_extract(transcript, scheme, language)
    else:
        return await _bedrock_extract(transcript, scheme, language)


async def _demo_extract(
    transcript: str,
    scheme: str,
    language: str
) -> Dict[str, Any]:
    """Demo mode extraction using regex patterns"""
    
    extracted_fields = {}
    
    # Try to extract each field
    for field, patterns in EXTRACTION_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, transcript, re.IGNORECASE | re.UNICODE)
            if match:
                value = match.group(1).strip()
                # Clean up the value
                value = re.sub(r'\s+', ' ', value)
                extracted_fields[field] = value
                break
    
    # Calculate confidence based on fields extracted
    total_fields = len(EXTRACTION_PATTERNS)
    extracted_count = len(extracted_fields)
    confidence = (extracted_count / total_fields) * 100
    
    # Determine response message
    lang_key = "hi" if language in ["hi", "gu"] else "en"
    if extracted_count >= 3:
        message = DEMO_RESPONSES[lang_key]["success_message"]
        success = True
    elif extracted_count > 0:
        message = DEMO_RESPONSES[lang_key]["partial_message"]
        success = True
    else:
        message = DEMO_RESPONSES[lang_key]["fail_message"]
        success = False
    
    return {
        "success": success,
        "fields": extracted_fields,
        "message": message,
        "confidence": round(confidence, 1),
        "mode": "demo"
    }


async def _bedrock_extract(
    transcript: str,
    scheme: str,
    language: str
) -> Dict[str, Any]:
    """Real AWS Bedrock extraction using Claude"""
    
    try:
        import boto3
        
        # Initialize Bedrock client
        bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'ap-south-1')
        )
        
        # Prepare prompt for Claude
        prompt = f"""You are an AI assistant helping fill government forms in India.
        
Extract the following information from this voice input transcript:
- name (Full Name)
- fatherName (Father's Name)
- aadhar (12-digit Aadhar Number)
- mobile (10-digit Mobile Number)
- bankAccount (Bank Account Number)
- ifsc (IFSC Code)
- address (Full Address)
- landArea (Land area in hectares)

Transcript: "{transcript}"

Return ONLY a valid JSON object with the fields you found. 
Example: {{"name": "Rajesh Kumar", "aadhar": "1234 5678 9012"}}
If a field is not found, don't include it.
"""
        
        # Call Claude via Bedrock (Upgraded to 3.5 Sonnet)
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-5-sonnet-20240620-v1:0",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        extracted_text = result['content'][0]['text']
        
        # Parse JSON from response
        json_match = re.search(r'\{[^{}]*\}', extracted_text)
        if json_match:
            extracted_fields = json.loads(json_match.group())
        else:
            extracted_fields = {}
        
        return {
            "success": len(extracted_fields) > 0,
            "fields": extracted_fields,
            "message": "Extracted using AWS Bedrock Claude",
            "confidence": 85.0 if extracted_fields else 0.0,
            "mode": "bedrock"
        }
        
    except Exception as e:
        print(f"Bedrock error: {e}")
        # Fallback to demo mode
        return await _demo_extract(transcript, scheme, language)


async def recommend_scheme(
    transcript: str,
    schemes: Dict[str, Any],
    demo_mode: bool = True
) -> Dict[str, Any]:
    """
    Recommend a scheme based on user problem
    """
    if demo_mode:
        # Simple keyword matching for demo
        transcript_lower = transcript.lower()
        
        # 1. PM Kisan
        if any(w in transcript_lower for w in ["kisan", "farmer", "farming", "agriculture", "crop", "loan", "khet", "money"]):
             found_scheme = "pm-kisan"
        # 2. Vidhva Sahay
        elif any(w in transcript_lower for w in ["widow", "vidhva", "husband died", "pension", "alone"]):
             found_scheme = "vidhva-sahay"
        # 3. Ration Card
        elif any(w in transcript_lower for w in ["ration", "food", "eat", "wheat", "rice", "grain", "shop"]):
             found_scheme = "ration-card"
        # 4. Ayushman Bharat
        elif any(w in transcript_lower for w in ["health", "medical", "hospital", "sick", "doctor", "treatment", "medicine"]):
             found_scheme = "ayushman-bharat"
        # 5. PM Awas
        elif any(w in transcript_lower for w in ["house", "home", "awas", "ghar", "roof", "living"]):
             found_scheme = "pm-awas"
        # 6. Ujjwala
        elif any(w in transcript_lower for w in ["gas", "cylinder", "stove", "fuel", "cooking", "kitchen"]):
             found_scheme = "ujjwala"
        # 7. Sukanya Samriddhi
        elif any(w in transcript_lower for w in ["girl", "daughter", "child", "education", "study", "saving", "marriage"]):
             found_scheme = "sukanya-samriddhi"
        # 8. Kisan Credit
        elif any(w in transcript_lower for w in ["credit", "card", "bank"]):
             found_scheme = "kisan-credit"
        else:
             found_scheme = None

        if found_scheme and found_scheme in schemes:
             scheme_data = schemes[found_scheme]
             return {
                 "success": True,
                 "scheme_id": found_scheme,
                 "scheme_name": scheme_data["name"],
                 "reason": f"Based on your request, {scheme_data['name']} is the best fit.",
                 "message": f"I recommend {scheme_data['name']}. It seems perfect for your needs. Shall we apply?"
             }
        else:
             return {
                 "success": False,
                 "message": "I didn't quite catch which scheme you need. Could you mention keywords like 'farmer', 'medical', 'ration', or 'gas connection'?"
             }
    else:
        # AWS Bedrock Implementation would go here
        return await recommend_scheme(transcript, schemes, demo_mode=True)


async def chat_with_ai(
    history: list,
    message: str,
    demo_mode: bool = True
) -> Dict[str, Any]:
    """
    Human-like AI assistant that greets, asks questions, and collects form data.
    Uses Gemini if API key is set, otherwise smart demo fallback.
    """
    SYSTEM_PROMPT = """You are Jan-Sahayak, a friendly and helpful Indian government assistant.
You speak naturally in Hindi and English (Hinglish is fine).
Your job is to:
1. Greet users warmly when they say hello/namaste.
2. Understand what they need - complaint, form filling, scheme information.
3. Ask questions ONE AT A TIME to collect their information (name, Aadhaar, mobile, bank details, address).
4. Be conversational, patient, and empathetic - like a real helpful government worker.
5. When you have collected enough information, return it as JSON in this format at the END of your response:
   FIELDS_COLLECTED: {"name": "...", "aadhar": "...", "mobile": "...", "address": "...", "bankAccount": "...", "ifsc": "...", "bankName": "..."}

Rules:
- Start with: "Namaste! Main Jan-Sahayak hoon. Aapki kya seva kar sakta hoon? 🙏"
- Ask only ONE question at a time
- Be warm, encouraging, like a real person
- If they want to complain, ask: what is the complaint about? then collect their name, mobile, and details
- If they want a form/scheme, identify which scheme and collect required fields
- Speak in Hindi/Hinglish by default but switch to English if user uses English
- Keep responses SHORT (2-3 sentences max)"""

    try:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("No Gemini API key")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=SYSTEM_PROMPT
        )

        # Build chat history
        gemini_history = []
        for h in history:
            role = "user" if h.get("role") == "user" else "model"
            gemini_history.append({
                "role": role,
                "parts": [h.get("content", "")]
            })

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(message)
        response_text = response.text

        # Check if fields were collected
        fields = {}
        action = "NONE"
        if "FIELDS_COLLECTED:" in response_text:
            try:
                json_part = response_text.split("FIELDS_COLLECTED:")[1].strip()
                json_match = re.search(r'\{.*\}', json_part, re.DOTALL)
                if json_match:
                    fields = json.loads(json_match.group())
                    action = "FILL_FORM"
                    # Clean response text - remove the JSON part
                    response_text = response_text.split("FIELDS_COLLECTED:")[0].strip()
                    if not response_text:
                        response_text = "Maine aapki saari jaankari le li hai! Ab main form fill kar deta hoon. ✅"
            except Exception:
                pass

        return {
            "text": response_text,
            "action": action,
            "fields": fields
        }

    except Exception as e:
        print(f"Gemini Error: {e}")
        # Smart human-like demo fallback
        msg_lower = message.lower().strip()
        response_text = ""
        action = "NONE"
        fields = {}

        # Greetings
        if any(w in msg_lower for w in ["hello", "hi", "hey", "namaste", "helo", "hii"]):
            response_text = "Namaste! 🙏 Main Jan-Sahayak hoon. Main aapki sarkari yojanaon mein madad kar sakta hoon. Aap kya chahte hain — koi form bharna hai ya koi shikayat karni hai?"

        # Complaint
        elif any(w in msg_lower for w in ["complaint", "shikayat", "complain", "problem", "issue"]):
            response_text = "Samjha main. Aapki shikayat ke liye mujhe kuch jaankari chahiye. Pehle aapka poora naam batayein?"
            action = "ASK_NAME"

        # Gas / LPG / Ujjwala
        elif any(w in msg_lower for w in ["gas", "cylinder", "lpg", "ujjwala", "cooking"]):
            response_text = "Ujjwala Yojana ke liye main aapka form bhar sakta hoon! 🔥 Pehle aapka poora naam batayein?"
            action = "START_FORM:ujjwala"

        # Farmer / PM Kisan
        elif any(w in msg_lower for w in ["kisan", "farmer", "farm", "crop", "kheti", "khet"]):
            response_text = "PM Kisan Samman Nidhi ke liye main madad karunga! 🌾 Aapka poora naam kya hai?"
            action = "START_FORM:pm-kisan"

        # Ration
        elif any(w in msg_lower for w in ["ration", "food", "rashan", "gehun", "wheat"]):
            response_text = "Ration Card ke liye main aapka form bhar sakta hoon! 🍚 Aapka naam batayein?"
            action = "START_FORM:ration-card"

        # House / Awas
        elif any(w in msg_lower for w in ["house", "ghar", "awas", "home", "makan"]):
            response_text = "PM Awas Yojana ke liye aavedan karte hain! 🏠 Aapka poora naam kya hai?"
            action = "START_FORM:pm-awas"

        # Health
        elif any(w in msg_lower for w in ["health", "hospital", "doctor", "bimar", "dawai", "ayushman"]):
            response_text = "Ayushman Bharat ke liye main madad karunga! 🏥 Pehle aapka naam batayein?"
            action = "START_FORM:ayushman-bharat"

        # Name provided (short response, likely answering a question)
        elif len(msg_lower.split()) <= 4 and not any(c.isdigit() for c in msg_lower):
            response_text = f"Shukriya! Ab aapka Aadhaar number batayein (12 digits)?"

        # Aadhaar number provided
        elif re.search(r'\d{12}|\d{4}\s\d{4}\s\d{4}', message):
            response_text = "Acha! Ab aapka 10-digit mobile number batayein?"

        # Mobile number
        elif re.search(r'\d{10}', message):
            response_text = "Bahut acha! Ab aapka bank account number batayein?"

        # Default
        else:
            response_text = "Main samjha. Kya aap mujhe bata sakte hain ki aap kaunsi sarkari yojana ke liye apply karna chahte hain? Jaise gas connection, kisan yojana, ration card?"

        return {
            "text": response_text,
            "action": action,
            "fields": fields
        }

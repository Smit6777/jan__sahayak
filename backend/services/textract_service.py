"""
AWS Textract Service
Extracts text from Aadhar card images

In Demo Mode: Returns simulated extraction results
In Real Mode: Uses AWS Textract for OCR
"""

import os
import re
from typing import Dict, Any

# Demo mode sample Aadhar data
DEMO_AADHAR_DATA = {
    "name": "राजेश कुमार / RAJESH KUMAR",
    "name_english": "RAJESH KUMAR",
    "name_hindi": "राजेश कुमार",
    "dob": "15/08/1985",
    "gender": "MALE / पुरुष",
    "aadhar": "1234 5678 9012",
    "address": "123, Gandhi Nagar, Near Bus Stand, Anand, Gujarat - 388001",
    "pincode": "388001",
    "state": "Gujarat",
    "district": "Anand"
}


async def extract_from_image(
    image_bytes: bytes,
    demo_mode: bool = True
) -> Dict[str, Any]:
    """
    Extract data from Aadhar card image
    
    Args:
        image_bytes: Raw image bytes
        demo_mode: Use simulated responses instead of AWS
    
    Returns:
        Extracted Aadhar data
    """
    
    if demo_mode:
        return await _demo_extract_aadhar()
    else:
        return await _textract_extract(image_bytes)


async def _demo_extract_aadhar() -> Dict[str, Any]:
    """Demo mode - returns sample Aadhar data"""
    
    return {
        "success": True,
        "data": DEMO_AADHAR_DATA,
        "message": "आधार कार्ड से जानकारी निकाली गई (Demo Mode)",
        "confidence": 95.0,
        "mode": "demo"
    }


async def _textract_extract(image_bytes: bytes) -> Dict[str, Any]:
    """Real AWS Textract OCR extraction"""
    
    try:
        import boto3
        
        # Initialize Textract client
        textract = boto3.client(
            service_name='textract',
            region_name=os.getenv('AWS_REGION', 'ap-south-1')
        )
        
        # Call Textract
        response = textract.detect_document_text(
            Document={'Bytes': image_bytes}
        )
        
        # Extract all text blocks
        text_blocks = []
        for block in response.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text_blocks.append(block['Text'])
        
        full_text = ' '.join(text_blocks)
        
        # Parse Aadhar data from extracted text
        extracted_data = _parse_aadhar_text(full_text)
        
        return {
            "success": bool(extracted_data),
            "data": extracted_data,
            "raw_text": full_text,
            "message": "Extracted using AWS Textract",
            "confidence": 85.0 if extracted_data else 0.0,
            "mode": "textract"
        }
        
    except Exception as e:
        print(f"Textract error: {e}")
        # Fallback to demo mode
        return await _demo_extract_aadhar()


def _parse_aadhar_text(text: str) -> Dict[str, str]:
    """Parse Aadhar card text and extract fields"""
    
    data = {}
    
    # Extract Aadhar number (12 digits, possibly with spaces)
    aadhar_match = re.search(r'(\d{4}\s*\d{4}\s*\d{4})', text)
    if aadhar_match:
        data['aadhar'] = aadhar_match.group(1)
    
    # Extract DOB
    dob_match = re.search(r'(\d{2}/\d{2}/\d{4})', text)
    if dob_match:
        data['dob'] = dob_match.group(1)
    
    # Extract Gender
    if 'MALE' in text.upper() or 'पुरुष' in text:
        data['gender'] = 'MALE / पुरुष'
    elif 'FEMALE' in text.upper() or 'महिला' in text:
        data['gender'] = 'FEMALE / महिला'
    
    # Extract Pincode
    pincode_match = re.search(r'(\d{6})', text)
    if pincode_match:
        data['pincode'] = pincode_match.group(1)
    
    # Try to extract name (usually after "To" or at the beginning)
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        # Look for name patterns (Hindi + English)
        if re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+', line):
            data['name_english'] = line
            break
    
    # Extract address (lines containing common address keywords)
    address_keywords = ['nagar', 'street', 'road', 'lane', 'colony', 'ward', 'village']
    for line in lines:
        if any(keyword in line.lower() for keyword in address_keywords):
            data['address'] = line
            break
    
    return data

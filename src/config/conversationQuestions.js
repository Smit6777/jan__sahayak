export const conversationConfig = {
    // Greeting Messages
    greetings: {
        'hi-IN': "नमस्ते! मैं आपकी जन-सहायक हूँ। आज हम कौन सा फॉर्म भरेंगे?",
        'gu-IN': "નમસ્તે! હું તમારી જન-સહાયક છું. આજે આપણે કયું ફોર્મ ભરીશું?",
        'mr-IN': "नमस्कार! मी तुमचा जन-सहायक आहे. आज आपण कोणता फॉर्म भरणार आहोत?",
        'en-IN': "Namaste! I am your Jan-Sahayak. Which form shall we fill today?"
    },

    // Field Questions (Simple, child-friendly tone)
    questions: {
        'hi-IN': {
            name: "सबसे पहले, आपका शुभ नाम क्या है?",
            fatherName: "आपके पिताजी का नाम क्या है?",
            motherName: "आपकी माताजी का नाम क्या है?",
            husbandName: "आपके पति का नाम क्या है?",
            aadhar: "अब कृपया अपना आधार कार्ड नंबर बताइये।",
            mobile: "आपका मोबाइल नंबर क्या है?",
            bankAccount: "आपके बैंक खाता नंबर (Account Number) क्या है?",
            ifsc: "बैंक का IFSC कोड क्या है?",
            address: "आपका पता (Address) क्या है?",
            currentAddress: "आप अभी कहाँ रहते हैं? वर्तमान पता बताइये।",
            landArea: "आपकी जमीन कितनी है? (हेक्टेयर में)",
            deathCertNo: "मृत्यु प्रमाण पत्र (Death Certificate) नंबर क्या है?",
            familyMembers: "आपके परिवार में कुल कितने सदस्य हैं?",
            income: "आपकी वार्षिक आय (Annual Income) कितनी है?",
            cardType: "आपका राशन कार्ड कौन सा है? APL या BPL?",
            // ... add others as needed
            confirm: "क्या यह जानकारी सही है?",
            next: "ठीक है, अगला सवाल...",
            done: "बहुत बढ़िया! फॉर्म पूरा हो गया है।"
        },
        'gu-IN': {
            name: "સૌથી પહેલા, તમારું શુભ નામ શું છે?",
            fatherName: "તમારા પિતાજીનું નામ શું છે?",
            motherName: "તમારા માતાજીનું નામ શું છે?",
            husbandName: "તમારા પતિનું નામ શું છે?",
            aadhar: "હવે મહેરબાની કરીને તમારો આધાર કાર્ડ નંબર જણાવો.",
            mobile: "તમારો મોબાઈલ નંબર શું છે?",
            bankAccount: "તમારો બેંક એકાઉન્ટ નંબર શું છે?",
            ifsc: "બેંકનો IFSC કોડ શું છે?",
            address: "તમારું સરનામું શું છે?",
            currentAddress: "તમે અત્યારે ક્યાં રહો છો? વર્તમાન સરનામું જણાવો.",
            landArea: "તમારી જમીન કેટલી છે? (હેક્ટરમાં)",
            deathCertNo: "મૃત્યુ પ્રમાણપત્ર (Death Certificate) નંબર શું છે?",
            familyMembers: "તમારા પરિવારમાં કુલ કેટલા સભ્યો છે?",
            income: "તમારી વાર્ષિક આવક કેટલી છે?",
            cardType: "તમારું રાશન કાર્ડ કયું છે? APL કે BPL?",
            confirm: "શું આ માહિતી સાચી છે?",
            next: "સારું, આગળનો પ્રશ્ન...",
            done: "ખૂબ સરસ! ફોર્મ પૂરું થઈ ગયું છે."
        },
        'en-IN': {
            name: "First, what is your full name?",
            fatherName: "What is your father's name?",
            motherName: "What is your mother's name?",
            husbandName: "What is your husband's name?",
            aadhar: "Please tell me your Aadhar Card number.",
            mobile: "What is your mobile number?",
            bankAccount: "What is your Bank Account number?",
            ifsc: "What is the bank IFSC code?",
            address: "What is your address?",
            currentAddress: "Where do you live currently?",
            landArea: "What is your land area (in Hectares)?",
            deathCertNo: "What is the Death Certificate number?",
            familyMembers: "How many members are there in your family?",
            income: "What is your annual income?",
            cardType: "Which Ration Card do you have? APL or BPL?",
            confirm: "Is this information correct?",
            next: "Okay, next question...",
            done: "Great! The form is complete."
        }
        // Marathi can be added similarly
    },

    // AI Responses for Verification
    verifications: {
        'hi-IN': {
            gotIt: "जी, मैंने लिख लिया: ",
            retry: "माफ़ कीजिये, मैंने ठीक से सुना नहीं। फिर से बताइये?",
        },
        'gu-IN': {
            gotIt: "જી, મેં લખી લીધું: ",
            retry: "માફ કરશો, મને બરાબર સંભળાયું નહીં. ફરીથી જણાવશો?",
        },
        'en-IN': {
            gotIt: "Okay, I got: ",
            retry: "Sorry, I didn't verify catch that. Could you say it again?",
        }
    }
};

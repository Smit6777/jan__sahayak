/**
 * conversationQuestions.js
 * ========================
 * Questions are written in the voice of a warm, friendly 10-year-old
 * helping their grandparent fill a government form.
 * Simple words. Patient tone. Reassuring.
 * Questions are asked ONE AT A TIME in the exact order of the real PDF form.
 */

// ── Per-scheme field order (matching real govt PDF form layout) ──────────────
export const SCHEME_FIELD_ORDER = {
    "pm-kisan": [
        "state", "district", "subDistrict", "village",
        "name", "fatherName", "gender",
        "aadhar", "mobile", "dob",
        "bankAccount", "ifsc", "bankName",
        "address", "landArea"
    ],
    "ujjwala": [
        "name", "gender", "aadhar",
        "mobile",
        "bankAccount", "ifsc",
        "bplNumber", "address"
    ],
    "sukanya-samriddhi": [
        "daughterName", "fatherName", "motherName",
        "daughterDOB",
        "name",
        "aadhar", "mobile",
        "address", "bankAccount"
    ],
    "kisan-credit": [
        "name", "fatherName",
        "aadhar", "mobile",
        "village", "district", "state",
        "landArea", "cropType",
        "bankAccount", "ifsc", "bankName",
        "address"
    ],
    "ration-card": [
        "name", "fatherName", "husbandName",
        "aadhar", "mobile",
        "address",
        "familyMembers", "income", "cardType"
    ],
    "vidhva-sahay": [
        "name", "aadhar", "mobile",
        "husbandName", "deathCertNo",
        "bankAccount", "ifsc", "address"
    ],
    "ayushman-bharat": [
        "name", "aadhar", "mobile",
        "dob", "gender",
        "familyMembers", "income",
        "existingDiseases", "address"
    ],
    "pm-awas": [
        "name", "fatherName",
        "aadhar", "mobile",
        "income", "category",
        "plotSize", "currentAddress"
    ]
};

// ── Field questions — child-friendly, simple, warm ───────────────────────────
export const FIELD_QUESTIONS = {
    name: {
        hi: "दादाजी, सबसे पहले बताइये — आपका नाम क्या है? जैसे 'राजेश कुमार'।",
        gu: "દાદા, સૌ પ્રથમ કહો — તમારું નામ શું છે? જેમ કે 'રાજેશ કુમાર'.",
        en: "First, tell me your full name please! Like 'Rajesh Kumar'."
    },
    fatherName: {
        hi: "अच्छा, अब बताइये — आपके पिताजी का नाम क्या है?",
        gu: "સારું, હવે કહો — તમારા પિતાજીનું નામ શું છે?",
        en: "Now tell me your father's name."
    },
    motherName: {
        hi: "और आपकी माताजी का नाम क्या है?",
        gu: "અને તમારા માતાજીનું નામ શું છે?",
        en: "What is your mother's name?"
    },
    husbandName: {
        hi: "आपके पति का नाम क्या था?",
        gu: "તમારા પતિનું નામ શું હતું?",
        en: "What was your husband's name?"
    },
    daughterName: {
        hi: "बेटी का नाम क्या है?",
        gu: "દીકરીનું નામ શું છે?",
        en: "What is your daughter's name?"
    },
    daughterDOB: {
        hi: "बेटी का जन्म कब हुआ था? दिन, महीना, साल बताइये।",
        gu: "દીકરી ક્યારે જન્મી? દિવસ, મહિનો, વર્ષ કહો.",
        en: "When was your daughter born? Tell me the date."
    },
    gender: {
        hi: "आप पुरुष हैं या महिला?",
        gu: "તમે પુરુષ છો કે મહિલા?",
        en: "Are you male or female?"
    },
    dob: {
        hi: "आपका जन्म कब हुआ था? दिन, महीना, साल बताइये।",
        gu: "તમારો જન્મ ક્યારે થયો? દિવસ, મહિનો, વર્ષ કહો.",
        en: "When were you born? Tell me your date of birth."
    },
    aadhar: {
        hi: "अब आधार नंबर बताइये — वो 12 अंकों वाला नंबर जो आधार कार्ड पर होता है।",
        gu: "હવે આધાર નંબર કહો — આધાર કાર્ડ પર 12 આંકડાનો નંબર હોય છે.",
        en: "Tell me your Aadhar number — the 12-digit number on your Aadhar card."
    },
    mobile: {
        hi: "आपका मोबाइल नंबर क्या है? 10 अंकों का।",
        gu: "તમારો મોબાઈલ નંબર શું છે? 10 આંકડાનો.",
        en: "What is your 10-digit mobile number?"
    },
    bankAccount: {
        hi: "बैंक का खाता नंबर बताइये। बैंक की पासबुक पर होता है।",
        gu: "બેંકનો ખાતા નંબર કહો. બેંકની પાસબુક પર હોય છે.",
        en: "Tell me your bank account number — it's on your passbook."
    },
    ifsc: {
        hi: "IFSC कोड बताइये। बैंक की पासबुक के पहले पन्ने पर होता है।",
        gu: "IFSC કોડ કહો. બેંકની પાસબુકના પ્રથમ પૃષ્ઠ પર હોય છે.",
        en: "What is the IFSC code? You'll find it on the first page of your passbook."
    },
    bankName: {
        hi: "बैंक का नाम और शाखा (Branch) बताइये। जैसे 'SBI, आनंद शाखा'।",
        gu: "બેંકનું નામ અને શાખા કહો. જેમ કે 'SBI, આણંદ શાખા'.",
        en: "What is your bank name and branch? Like 'SBI, Anand Branch'."
    },
    village: {
        hi: "आप किस गाँव में रहते हैं?",
        gu: "તમે કયા ગામ/વિસ્તારમાં રહો છો?",
        en: "Which village or area do you live in?"
    },
    subDistrict: {
        hi: "आपकी तहसील या तालुका का नाम क्या है?",
        gu: "તમારી તાલુકાનું નામ શું છે?",
        en: "What is your taluka or sub-district name?"
    },
    district: {
        hi: "आपका जिला कौन सा है?",
        gu: "તમારો જિલ્લો કયો છે?",
        en: "Which district do you live in?"
    },
    state: {
        hi: "आप किस राज्य में रहते हैं? जैसे 'गुजरात' या 'राजस्थान'।",
        gu: "તમે કયા રાજ્યમાં રહો છો? જેવા કે 'ગુજરાત'.",
        en: "Which state do you live in? Like 'Gujarat' or 'Rajasthan'."
    },
    address: {
        hi: "अब पूरा पता बताइये — घर नंबर, गाँव, जिला, और पिन कोड।",
        gu: "હવે પૂરું સરનામું કહો — ઘર નંબર, ગામ, જિલ્લો, અને પિન કોડ.",
        en: "Tell me your full address — house number, village, district, and PIN code."
    },
    currentAddress: {
        hi: "अभी आप कहाँ रह रहे हैं? वर्तमान पता बताइये।",
        gu: "હાલ તમે ક્યાં રહો છો? વર્તમાન સરનામું કહો.",
        en: "Where are you living currently? Tell me your current address."
    },
    landArea: {
        hi: "आपकी खेती की जमीन कितनी है? हेक्टेयर में बताइये। जैसे '2.5 हेक्टेयर'।",
        gu: "તમારી ખેતીની જમીન કેટલી છે? હેક્ટરમાં કહો. જેવા કે '2.5 હેક્ટર'.",
        en: "How many hectares of farmland do you have? Like '2.5 hectares'."
    },
    cropType: {
        hi: "आप कौन सी फसल उगाते हैं? जैसे 'गेहूं' या 'मक्का'।",
        gu: "તમે કઈ ફસલ ઉગાડો છો? જેવા કે 'ઘઉં' અથવા 'મકાઈ'.",
        en: "What crops do you grow? Like 'wheat' or 'corn'."
    },
    income: {
        hi: "साल भर में कितनी कमाई होती है? रुपयों में बताइये।",
        gu: "આખા વર્ષમાં કેટલી આવક થાય છે? રૂપિયામાં કહો.",
        en: "How much do you earn in a year? Tell me in rupees."
    },
    familyMembers: {
        hi: "आपके घर में कुल कितने लोग हैं?",
        gu: "તમારા ઘરમાં કુલ કેટલા લોકો છે?",
        en: "How many people live in your house?"
    },
    cardType: {
        hi: "आपका राशन कार्ड कौन सा है? APL है, BPL है, या अंत्योदय?",
        gu: "તમારું રેશન કાર્ડ કયું છે? APL, BPL, કે અંત્યોદય?",
        en: "What type is your ration card? APL, BPL, or Antyodaya?"
    },
    bplNumber: {
        hi: "BPL राशन कार्ड नंबर बताइये।",
        gu: "BPL રેશન કાર્ડ નંબર કહો.",
        en: "Tell me your BPL ration card number."
    },
    deathCertNo: {
        hi: "मृत्यु प्रमाण पत्र का नंबर बताइये। वो कागज़ जो अस्पताल या सरकार ने दिया था।",
        gu: "મૃત્યુ પ્રમાણ પત્રનો નંબર કહો.",
        en: "Tell me the death certificate number."
    },
    existingDiseases: {
        hi: "क्या आपको पहले से कोई बीमारी है? जैसे 'शुगर' या 'BP'? अगर नहीं तो कहें 'नहीं'।",
        gu: "શું તમને પહેલેથી કોઈ બીમારી છે? જેવા કે 'ડાયાબિટીઝ'? ન હોય તો 'ના' કહો.",
        en: "Do you have any existing illness like diabetes or BP? Say 'No' if none."
    },
    plotSize: {
        hi: "आपके प्लॉट का साइज़ कितना है? वर्ग फुट में।",
        gu: "તમારા પ્લૉટનું કદ કેટલું છે? ચોરસ ફૂટમાં.",
        en: "What is your plot size in square feet?"
    },
    category: {
        hi: "आप किस श्रेणी से हैं? सामान्य, OBC, SC, या ST?",
        gu: "તમે કઈ કેટેગરીના છો? General, OBC, SC, કે ST?",
        en: "What is your category? General, OBC, SC, or ST?"
    }
};

// ── Conversation phrases ─────────────────────────────────────────────────────
export const PHRASES = {
    greeting: {
        hi: (scheme) => `नमस्ते दादाजी! मैं जन-सहायक हूँ — आपका छोटा सा दोस्त। आज हम ${scheme || 'आपका फॉर्म'} भरेंगे। मैं एक-एक सवाल पूछूँगा, आप बस बोलते जाइये!`,
        gu: (scheme) => `નમસ્તે! હું જન-સહાયક, તમારો નાનો દોસ્ત. આપણે ${scheme || 'ફોર્મ'} ભરીશું. હું એક-એક સવાલ પૂછીશ, તમે બોલ્યા કરો!`,
        en: (scheme) => `Hello! I'm Jan-Sahayak, your little helper. We'll fill the ${scheme || 'form'} together. I'll ask one question at a time — just speak!`
    },
    gotIt: {
        hi: (val) => `बढ़िया! मैंने लिख लिया — "${val}"।`,
        gu: (val) => `સરસ! મેં લખી લીધું — "${val}".`,
        en: (val) => `Great! I got — "${val}".`
    },
    retry: {
        hi: "माफ़ करना, मुझे ठीक से सुनाई नहीं दिया। क्या थोड़ा ज़ोर से और फिर से बोलेंगे?",
        gu: "માફ કરો, મને સ્પષ્ટ સંભળ્યું નહીં. જરા મોટેથી ફરીથી કહો?",
        en: "Sorry, I didn't hear that clearly. Could you say it again a little louder?"
    },
    done: {
        hi: "शाबाश! सारी जानकारी मिल गई। बहुत अच्छा किया! अब आपका सरकारी फॉर्म तैयार है।",
        gu: "શાબાશ! બધી માહિતી મળી ગઈ. ઘણું સારું! હવે તમારું સરકારી ફોર્મ તૈયાર છે.",
        en: "Well done! All information collected. Your official government form is ready!"
    },
    saved: {
        hi: "आपकी जानकारी सुरक्षित रख ली है!",
        gu: "તમારી માહિતી સુરક્ષિત સ્ટોર કરી ગઈ!",
        en: "Your information has been saved safely!"
    },
    skip: {
        hi: "ठीक है, इसे छोड़ देते हैं।",
        gu: "ઠીક છે, આ છોડી દઈએ.",
        en: "Okay, skipping this one."
    }
};

// ── Backward compat for existing code ────────────────────────────────────────
export const conversationConfig = {
    greetings: {
        'hi-IN': PHRASES.greeting.hi(''),
        'gu-IN': PHRASES.greeting.gu(''),
        'en-IN': PHRASES.greeting.en(''),
    },
    questions: {
        'hi-IN': Object.fromEntries(Object.entries(FIELD_QUESTIONS).map(([k, v]) => [k, v.hi])),
        'gu-IN': Object.fromEntries(Object.entries(FIELD_QUESTIONS).map(([k, v]) => [k, v.gu])),
        'en-IN': Object.fromEntries(Object.entries(FIELD_QUESTIONS).map(([k, v]) => [k, v.en])),
    },
    verifications: {
        'hi-IN': { gotIt: "बढ़िया! मैंने लिख लिया: ", retry: "माफ़ करना, फिर से बोलेंगे?" },
        'gu-IN': { gotIt: "સરસ! મેં લખ્યું: ", retry: "માફ કરો, ફરીથી બોલો?" },
        'en-IN': { gotIt: "Got it: ", retry: "Sorry, please say that again." }
    }
};

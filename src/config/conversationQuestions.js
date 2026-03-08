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
        "name", "fatherName", "gender", "category",
        "aadhar", "mobile", "address", "pinCode",
        "ifsc", "bankName", "bankAccount"
    ],
    "ujjwala": [
        "name", "dob", "category", "aadhar", "mobile",
        "houseName", "street", "village", "district", "state", "pinCode",
        "bankName", "branchName", "ifsc", "bankAccount", "bplNumber"
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
    },
    houseName: {
        hi: "आपके मकान का नंबर या नाम क्या है?",
        gu: "તમારા મકાનનો નંબર અથવા નામ શું છે?",
        en: "What is your house number or building name?"
    },
    street: {
        hi: "आपकी सड़क या गली का क्या नाम है?",
        gu: "તમારી શેરી અથવા રસ્તાનું નામ શું છે?",
        en: "What is the name of your street or road?"
    },
    pinCode: {
        hi: "आपके इलाके का पिन कोड क्या है? 6 अंकों का।",
        gu: "તમારા વિસ્તારનો પિન કોડ શું છે? 6 આંકડાનો.",
        en: "What is your 6-digit area PIN code?"
    },
    branchName: {
        hi: "आपका बैंक किस जगह या शाखा में है?",
        gu: "તમારી બેંક કઈ શાખામાં આવેલી છે?",
        en: "What is the specific branch name of your bank?"
    },
    houseName: {
        hi: "आपके मकान का नंबर या नाम क्या है?",
        gu: "તમારા મકાનનો નંબર અથવા નામ શું છે?",
        en: "What is your house number or building name?"
    },
    street: {
        hi: "आपकी सड़क या गली का क्या नाम है?",
        gu: "તમારી શેરી અથવા રસ્તાનું નામ શું છે?",
        en: "What is the name of your street or road?"
    },
    pinCode: {
        hi: "आपके इलाके का पिन कोड क्या है? 6 अंकों का।",
        gu: "તમારા વિસ્તારનો પિન કોડ શું છે? 6 આંકડાનો.",
        en: "What is your 6-digit area PIN code?"
    },
    branchName: {
        hi: "आपका बैंक किस जगह या शाखा में है?",
        gu: "તમારી બેંક કઈ શાખામાં આવેલી છે?",
        en: "What is the specific branch name of your bank?"
    }
};

// ── Conversation phrases & Expert Knowledge ────────────────────────────────────
export const PHRASES = {
    greeting: {
        hi: (scheme) => `नमस्ते काका! आज मैं आपकी क्या सेवा कर सकती हूँ? क्या परेशानी है? पैसा नहीं मिला? घर बनवाना है? या अस्पताल जाना है? मुझे अपनी परेशानी साधारण शब्दों में बताएं।`,
        gu: (scheme) => `નમસ્તે કાકા! આજે હું તમારી શું સેવા કરી શકું? શું તકલીફ છે? પૈસા નથી મળ્યા? ઘર બનાવવું છે? મને તમારી તકલીફ સાદા શબ્દોમાં કહો.`,
        en: (scheme) => `Namaste Kaka! How can I help you today? What is the problem? Didn't get money? Need to build a house? Tell me in simple words.`
    },
    gotIt: {
        hi: (val) => `बढ़िया! मैंने लिख लिया — "${val}"।`,
        gu: (val) => `સરસ! મેં લખી લીધું — "${val}".`,
        en: (val) => `Great! I got — "${val}".`
    },
    retry: {
        hi: "माफ़ करना, मुझे ठीक से समझ नहीं आया। क्या आप थोड़ा साफ़ बोलेंगे?",
        gu: "માફ કરો, મને બરાબર સમજાયું નથી. જરા સાફ બોલશો?",
        en: "Sorry, I didn't quite catch that. Could you say it a bit more clearly?"
    },
    done: {
        hi: "शाबाश! सारी जानकारी मिल गई। अब मैं आपको पीडीएफ फॉर्म दूंगी। अगर पैसे नहीं आये हैं या फॉर्म रिजेक्ट हुआ है, तो आप CSC सेंटर जाकर चेक करा सकते हैं।",
        gu: "શાબાશ! બધી માહિતી મળી ગઈ. હવે હું તમને પીડીએફ ફોર્મ આપીશ. જો પૈસા ન આવ્યા હોય, તો તમે CSC સેન્ટર જઈને ચેક કરાવી શકો છો.",
        en: "Well done! All info collected. I will give you the PDF form now. If money hasn't arrived, you can visit a CSC center."
    },
    saved: {
        hi: "आपकी जानकारी सुरक्षित रख ली है!",
        gu: "તમારી માહિતી સુરક્ષિત છે!",
        en: "Your information is saved safely!"
    },
    skip: {
        hi: "ठीक है, इसे अभी के लिए छोड़ देते हैं।",
        gu: "ઠીક છે, આ અત્યારે છોડી દઈએ.",
        en: "Okay, leaving this blank for now."
    },
    confirmationPrompt: {
        hi: "सारी जानकारी मिल गई है। क्या मैं आपकी जानकारी सरकारी फॉर्म में भरकर आपको पीडीएफ दे दूँ? हाँ या ना बोलें।",
        gu: "મને બધી માહિતી મળી ગઈ છે. શું હું તમારું ફોર્મ ભરીને તમને પીડીએફ આપી દઉં? હા અથવા ના કહો.",
        en: "I have gathered all the details. Should I process this into an official government PDF? Please say Yes or No."
    },
    confirmNo: {
        hi: "ठीक है, मैंने फॉर्म रोक दिया है। आप चाहें तो स्क्रीन पर जानकारी खुद ठीक कर सकते हैं।",
        gu: "ઠીક છે, મેં ફોર્મ અટકાવ્યું છે. તમે ઇચ્છો તો સ્ક્રીન પર માહિતી જાતે સુધારી શકો છો.",
        en: "Okay, I've paused the generation. You can edit the form manually on the screen if you like."
    }
};

// SCHEME EXPERT KNOWLEDGE (For AI Context & Triage)
export const SCHEME_KNOWLEDGE = {
    "pm-kisan": {
        eligibility: "Small/marginal farmers (up to 2 hectares), citizen. NOT for tax payers or pensioners >10k.",
        benefits: "₹6000/year (3 installments of ₹2000). Direct to bank.",
        documents: "Aadhar, Land proof (Khasra/Khatauni), Bank passbook, mobile linked to Aadhar.",
        problems: {
            "paisa nahi aaya": "Check Beneficiary Status on pmkisan.gov.in. Complete eKYC at CSC.",
            "name mismatch": "Go to CSC and use 'Edit Aadhaar Failure Record'.",
        },
        helpline: "155261, 1800115526"
    },
    "ujjwala": {
        eligibility: "Women >18, BPL/SECC 2011 list, no existing LPG connection.",
        benefits: "Free LPG connection + 1st refill. Subsidy ₹300/cylinder.",
        documents: "Aadhar, BPL proof/SECC, Bank details, Ration card, Passport photo.",
        problems: {
            "paisa nahi aaya": "Check if bank is linked to LPG. Update KYC at distributor.",
        },
        helpline: "1800-266-6696"
    },
    "ayushman-bharat": {
        eligibility: "Rural SECC 2011 deprivation, urban poor. Income < ₹2.5L.",
        benefits: "₹5 lakh/family/year free hospital treatment.",
        documents: "Aadhar, Ration card, mobile linked to Aadhar.",
        problems: {
            "card nahi mila": "Recheck eligibility on pmjay.gov.in or call 14555.",
        },
        helpline: "14555"
    },
    "pm-awas": {
        eligibility: "Rural poor, no pucca house. EWS <1.5L.",
        benefits: "₹1.2 lakh for house building.",
        documents: "Aadhar, Income proof, land proof, Bank details.",
        helpline: "1800-11-6446"
    },
    "ration-card": {
        eligibility: "Annual family income < ₹4 lakh. BPL/APL.",
        benefits: "Subsidized grains: 5kg/person/month (rice/wheat ₹2-3/kg).",
        documents: "Aadhar of all family members, address proof, income cert.",
        helpline: "1967"
    },
    "vidhva-sahay": {
        eligibility: "Gujarat resident widow, 18-65 yrs, not remarried, income < ₹1.2L (rural).",
        benefits: "₹1250 per month directly to bank.",
        documents: "Aadhar, husband death cert, income cert.",
        helpline: "1800-233-1020"
    },
    "sukanya-samriddhi": {
        eligibility: "Girl child < 10 years.",
        benefits: "Deposit ₹250 to ₹1.5L/year. 8.2% interest. Maturity 21 years.",
        documents: "Girl's birth cert, Parent's Aadhar, PAN.",
        helpline: "Post Office Helpline: 1800-11-3388"
    },
    "kisan-credit": {
        eligibility: "Farmers with land (min 2 acres).",
        benefits: "Credit limit up to ₹3 lakh (no collateral), 4-7% interest.",
        documents: "Aadhar, land proof, crop details.",
        helpline: "RBI: 1800-22-0100"
    }
};

// ── Backward compat ────────────────────────────────────────
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

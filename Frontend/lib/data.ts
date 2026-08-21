export type Risk = "Safe" | "Moderate" | "High";
export type Village = { name:string; score:number; risk:Risk; water:string; vector:Risk; heat:Risk; vaccine:number; action:string; reason:string };
export const villages: Village[] = [
  {name:"Rampur",score:41,risk:"High",water:"Boil Required",vector:"High",heat:"Moderate",vaccine:68,action:"Dispatch chlorination team",reason:"Recent stomach illness reports and heavy rainfall need immediate preventive action."},
  {name:"Sundarpur",score:72,risk:"Moderate",water:"Chlorination Needed",vector:"Moderate",heat:"Moderate",vaccine:79,action:"Issue water advisory",reason:"Water source complaints increased this week. Clean storage vessels and monitor reports."},
  {name:"Nandgaon",score:91,risk:"Safe",water:"Safe",vector:"Safe",heat:"Moderate",vaccine:92,action:"Continue routine checks",reason:"All public-health signals remain within the expected range."},
  {name:"Kalyanwadi",score:62,risk:"Moderate",water:"Boil Required",vector:"High",heat:"Safe",vaccine:72,action:"Deploy vector-control team",reason:"Standing-water reports may increase mosquito breeding. Community clean-up is advised."}
];
export const translations: Record<string, Record<string,string>> = {
  English:{district:"District Official",village:"Village Public",asha:"ASHA Offline",sos:"EMERGENCY SOS",health:"COMMUNITY HEALTH SCORE",report:"REPORT A CONCERN",offline:"OFFLINE MODE"},
  "हिंदी":{district:"जिला अधिकारी",village:"ग्रामीण दृश्य",asha:"आशा ऑफ़लाइन",sos:"आपातकाल SOS",health:"सामुदायिक स्वास्थ्य स्कोर",report:"समस्या बताएं",offline:"ऑफ़लाइन मोड"},
  "मराठी":{district:"जिल्हा अधिकारी",village:"गाव दृश्य",asha:"आशा ऑफलाइन",sos:"आपत्काल SOS",health:"समुदाय आरोग्य गुण",report:"तक्रार नोंदवा",offline:"ऑफलाइन मोड"},
  "বাংলা":{district:"জেলা কর্মকর্তা",village:"গ্রাম দৃশ্য",asha:"আশা অফলাইন",sos:"জরুরি SOS",health:"কমিউনিটি স্বাস্থ্য স্কোর",report:"সমস্যা জানান",offline:"অফলাইন মোড"},
  "தமிழ்":{district:"மாவட்ட அலுவலர்",village:"கிராம காட்சி",asha:"ஆஷா ஆஃப்லைன்",sos:"அவசர SOS",health:"சமூக நல மதிப்பெண்",report:"கவலையை தெரிவிக்கவும்",offline:"ஆஃப்லைன் பயன்முறை"},
  "తెలుగు":{district:"జిల్లా అధికారి",village:"గ్రామ వీక్షణ",asha:"ఆశా ఆఫ్‌లైన్",sos:"అత్యవసర SOS",health:"కమ్యూనిటీ హెల్త్ స్కోర్",report:"సమస్యను నివేదించండి",offline:"ఆఫ్‌లైన్ మోడ్"},
  "ગુજરાતી":{district:"જિલ્લા અધિકારી",village:"ગામ દૃશ્ય",asha:"આશા ઑફલાઇન",sos:"ઇમરજન્સી SOS",health:"સમુદાય આરોગ્ય સ્કોર",report:"ચિંતા જણાવો",offline:"ઑફલાઇન મોડ"},
  "ਪੰਜਾਬੀ":{district:"ਜ਼ਿਲ੍ਹਾ ਅਧਿਕਾਰੀ",village:"ਪਿੰਡ ਦ੍ਰਿਸ਼",asha:"ਆਸ਼ਾ ਆਫ਼ਲਾਈਨ",sos:"ਐਮਰਜੈਂਸੀ SOS",health:"ਕਮਿਊਨਿਟੀ ਸਿਹਤ ਸਕੋਰ",report:"ਚਿੰਤਾ ਦੱਸੋ",offline:"ਆਫ਼ਲਾਈਨ ਮੋਡ"}
};

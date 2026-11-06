export const DEFAULT_JOB_CATEGORIES = [
  ...[
    ["skilled-trades-technical-services", "Skilled Trades & Technical Services"],
    ["construction-infrastructure", "Construction & Infrastructure"],
    ["manufacturing-production", "Manufacturing & Production"],
    ["agriculture-farming", "Agriculture & Farming"],
    ["information-technology-digital-services", "Information Technology & Digital Services"],
    ["administration-office-support", "Administration & Office Support"],
    ["sales-marketing-retail", "Sales, Marketing & Retail"],
    ["hospitality-tourism", "Hospitality & Tourism"],
    ["transportation-logistics", "Transportation & Logistics"],
    ["healthcare-caregiving", "Healthcare & Caregiving"],
    ["education-training", "Education & Training"],
    ["beauty-fashion-personal-services", "Beauty, Fashion & Personal Services"],
    ["cleaning-maintenance-facility-services", "Cleaning, Maintenance & Facility Services"],
    ["finance-accounting-business-services", "Finance, Accounting & Business Services"],
    ["general-labor-other-services", "General Labor & Other Services"]
  ].map(([id, nameEn]) => ({ id, nameEn, nameSi: nameEn, nameTa: nameEn, trades: [] }))
/*
  {
    id: "blue-collar",
    nameEn: "Blue Collar & General Labor",
    nameSi: "සාමාන්‍ය ශ්‍රමය සහ ක්ෂේත්‍ර සේවා",
    nameTa: "பொது உழைப்பு மற்றும் களப் பணிகள்",
    trades: [
      { id: "construction-labor", nameEn: "Construction Laborer", nameSi: "ඉදිකිරීම් ශ්‍රමික", nameTa: "கட்டுமானத் தொழிலாளி" },
      { id: "agriculture-worker", nameEn: "Agriculture & Harvesting Worker", nameSi: "කෘෂිකාර්මික හා අස්වනු නෙළීම", nameTa: "விவசாய & அறுவடைத் தொழிலாளி" },
      { id: "factory-worker", nameEn: "Factory & Packing Operator", nameSi: "කර්මාන්තශාලා ක්‍රියාකරු", nameTa: "தொழிற்சாலை இயக்குபவர்" },
      { id: "cleaner-janitor", nameEn: "Cleaning & Janitorial", nameSi: "පිරිසිදු කිරීම් සේවක", nameTa: "துப்புரவுப் பணியாளர்" },
      { id: "driver-delivery", nameEn: "Driver & Delivery Rider", nameSi: "රියදුරු සහ බෙදාහැරීම්", nameTa: "சாரதி & விநியோகம்" }
    ]
  },
  {
    id: "skilled-trades",
    nameEn: "Skilled Tradesperson",
    nameSi: "තාක්ෂණික හා නිපුණතා ශිල්පීන්",
    nameTa: "திறமையான வர்த்தகர்கள்",
    trades: [
      { id: "electrician", nameEn: "Licensed Electrician", nameSi: "විදුලි කාර්මික", nameTa: "மின்சார வல்லுநர்" },
      { id: "plumber", nameEn: "Plumbing Specialist", nameSi: "නල කාර්මික", nameTa: "குழாய் பொருத்துநர்" },
      { id: "carpenter", nameEn: "Woodwork & Carpentry", nameSi: "වඩු කාර්මික", nameTa: "தச்சர்" },
      { id: "mason", nameEn: "Masonry & Tiling", nameSi: "මේසන් කාර්මික", nameTa: "கொத்தனார்" },
      { id: "mechanic", nameEn: "Automotive Mechanic", nameSi: "මෝටර් රථ කාර්මික", nameTa: "வாகன மெக்கானிக்" },
      { id: "welder", nameEn: "Welding & Metal Fabrication", nameSi: "වෙල්ඩින් කාර්මික", nameTa: "வெல்டர்" },
      { id: "tailor", nameEn: "Garment & Tailoring", nameSi: "ඇඳුම් මැසීම", nameTa: "தையல்காரர்" }
    ]
  },
  {
    id: "white-collar",
    nameEn: "White Collar & Administrative",
    nameSi: "කාර්යාලීය සහ පරිපාලන සේවා",
    nameTa: "அலுவலக மற்றும் நிர்வாகப் பணிகள்",
    trades: [
      { id: "accountant-clerk", nameEn: "Accounts Clerk & Bookkeeper", nameSi: "ගිණුම් ලිපිකරු", nameTa: "கணக்கு எழுத்தர்" },
      { id: "data-entry", nameEn: "Data Entry & Office Assistant", nameSi: "දත්ත ඇතුළත් කිරීම්", nameTa: "தரவு உள்ளீடு" },
      { id: "sales-executive", nameEn: "Sales & Marketing Officer", nameSi: "විකුණුම් විධායක", nameTa: "விற்பனை அதிகாரி" },
      { id: "it-support", nameEn: "IT & Computer Technician", nameSi: "තොරතුරු තාක්ෂණ සහායක", nameTa: "தகவல் தொழில்நுட்ப ஆதரவு" }
    ]
  }
*/
];

export const DEFAULT_SECTORS = [
  { id: "agriculture-agro", nameEn: "Agriculture & Agro-Processing", nameSi: "කෘෂිකර්මාන්තය සහ සැකසුම්", nameTa: "விவசாயம் & உணவு பதப்படுத்துதல்" },
  { id: "handicrafts-cottage", nameEn: "Handicrafts & Cottage Industry", nameSi: "දේශීය අත්කම් සහ ගෘහ කර්මාන්ත", nameTa: "கைவினைப் பொருட்கள் & குடிசைத் தொழில்" },
  { id: "apparel-textile", nameEn: "Apparel, Batik & Textile", nameSi: "ඇඟලුම්, බතික් සහ රෙදිපිළි", nameTa: "ஆடை, பாடிக் & துணி வகை" },
  { id: "food-beverage", nameEn: "Food & Beverage Production", nameSi: "ආහාර පාන නිෂ්පාදනය", nameTa: "உணவு & பானங்கள் தயாரிப்பு" },
  { id: "retail-commerce", nameEn: "Local Retail & Grocery", nameSi: "සිල්ලර වෙළඳාම", nameTa: "சில்லறை வர்த்தகம்" },
  { id: "tourism-hospitality", nameEn: "Tourism, Homestay & Culinary", nameSi: "සංචාරක සහ ආගන්තුක සත්කාර", nameTa: "சுற்றுலா & விருந்தோம்பல்" },
  { id: "repairs-services", nameEn: "Technical Repair & Services", nameSi: "තාක්ෂණික අලුත්වැඩියා සේවා", nameTa: "தொழில்நுட்ப பழுதுபார்ப்பு" }
];

export const DEFAULT_SYSTEM_SETTINGS = [
  { key: "MATCH_RADIUS_KM", value: "50", description: "Default geospatial job matching radius in kilometers" },
  { key: "AUTO_TRANSLATE_ENABLED", value: "true", description: "Automatically translate job and pitch postings on publish" },
  { key: "MAX_UPLOAD_SIZE_MB", value: "5", description: "Maximum allowed file size for document uploads in MB" },
  { key: "GOV_NIC_CHECK_STUB_MODE", value: "simulated_success", description: "Government live verification stub behavior mode" }
];


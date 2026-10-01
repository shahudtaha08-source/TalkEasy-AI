/**
 * India Locations Data — TalkEasy v6.0
 * All 28 Indian states + 8 Union Territories with major cities.
 * Maintainable, data-driven structure used by FindHelp and Settings.
 */

export interface IndiaState {
  name: string;
  code: string;
  cities: string[];
}

export const INDIA_STATES: IndiaState[] = [
  {
    name: "Andhra Pradesh",
    code: "AP",
    cities: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
      "Rajamahendravaram", "Tirupati", "Kakinada", "Kadapa", "Anantapur",
      "Vizianagaram", "Eluru", "Ongole", "Nandyal", "Machilipatnam",
    ],
  },
  {
    name: "Arunachal Pradesh",
    code: "AR",
    cities: [
      "Itanagar", "Naharlagun", "Pasighat", "Namsai", "Bomdila",
      "Ziro", "Tawang", "Tezu", "Roing", "Along",
    ],
  },
  {
    name: "Assam",
    code: "AS",
    cities: [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
      "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu",
      "Goalpara", "Sivasagar", "Haflong", "North Lakhimpur", "Karimganj",
    ],
  },
  {
    name: "Bihar",
    code: "BR",
    cities: [
      "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga",
      "Purnia", "Arrah", "Begusarai", "Katihar", "Munger",
      "Chapra", "Sasaram", "Hajipur", "Dehri", "Siwan",
      "Motihari", "Nawada", "Bettiah", "Aurangabad", "Kishanganj",
    ],
  },
  {
    name: "Chhattisgarh",
    code: "CG",
    cities: [
      "Raipur", "Bhilai", "Durg", "Bilaspur", "Korba",
      "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Dhamtari",
      "Chirmiri", "Bhatapara", "Mahasamund", "Kawardha", "Kanker",
    ],
  },
  {
    name: "Goa",
    code: "GA",
    cities: [
      "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda",
      "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Pernem",
    ],
  },
  {
    name: "Gujarat",
    code: "GJ",
    cities: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
      "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Navsari",
      "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana",
      "Bhuj", "Porbandar", "Palanpur", "Valsad", "Amreli",
    ],
  },
  {
    name: "Haryana",
    code: "HR",
    cities: [
      "Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar",
      "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
      "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar",
      "Kaithal", "Rewari", "Palwal", "Fatehabad", "Narnaul",
    ],
  },
  {
    name: "Himachal Pradesh",
    code: "HP",
    cities: [
      "Shimla", "Manali", "Dharamsala", "Solan", "Mandi",
      "Baddi", "Nahan", "Palampur", "Sundernagar", "Chamba",
      "Una", "Hamirpur", "Bilaspur", "Kullu", "Kangra",
    ],
  },
  {
    name: "Jharkhand",
    code: "JH",
    cities: [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar",
      "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar",
      "Chaibasa", "Chirkunda", "Dumka", "Pakur", "Gumla",
    ],
  },
  {
    name: "Karnataka",
    code: "KA",
    cities: [
      "Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi",
      "Kalaburagi", "Davanagere", "Ballari", "Shivamogga", "Tumakuru",
      "Bidar", "Raichur", "Hassan", "Udupi", "Hospet",
      "Gadag", "Bagalkot", "Vijayapura", "Chitradurga", "Mandya",
    ],
  },
  {
    name: "Kerala",
    code: "KL",
    cities: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur",
      "Malappuram", "Palakkad", "Alappuzha", "Kannur", "Kottayam",
      "Kasaragod", "Idukki", "Pathanamthitta", "Wayanad", "Ernakulam",
      "Munnar", "Perinthalmanna", "Thiruvalla", "Thalassery", "Ponnani",
    ],
  },
  {
    name: "Madhya Pradesh",
    code: "MP",
    cities: [
      "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain",
      "Sagar", "Dewas", "Satna", "Ratlam", "Rewa",
      "Murwara", "Singrauli", "Burhanpur", "Khandwa", "Bhind",
      "Chhindwara", "Shivpuri", "Vidisha", "Chhatarpur", "Mandsaur",
    ],
  },
  {
    name: "Maharashtra",
    code: "MH",
    cities: [
      "Mumbai", "Pune", "Nagpur", "Thane", "Nashik",
      "Aurangabad", "Solapur", "Amravati", "Navi Mumbai", "Kolhapur",
      "Sangli", "Jalgaon", "Akola", "Latur", "Dhule",
      "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna",
      "Ambarnath", "Bhiwandi", "Malegaon", "Nanded", "Satara",
    ],
  },
  {
    name: "Manipur",
    code: "MN",
    cities: [
      "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Senapati",
      "Ukhrul", "Chandel", "Tamenglong", "Jiribam", "Kakching",
    ],
  },
  {
    name: "Meghalaya",
    code: "ML",
    cities: [
      "Shillong", "Tura", "Nongpoh", "Jowai", "Baghmara",
      "Resubelpara", "Williamnagar", "Nongstoin", "Mawkyrwat", "Mairang",
    ],
  },
  {
    name: "Mizoram",
    code: "MZ",
    cities: [
      "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib",
      "Serchhip", "Mamit", "Lawngtlai", "Hnahthial", "Khawzawl",
    ],
  },
  {
    name: "Nagaland",
    code: "NL",
    cities: [
      "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha",
      "Zunheboto", "Phek", "Longleng", "Kiphire", "Mon",
    ],
  },
  {
    name: "Odisha",
    code: "OD",
    cities: [
      "Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur",
      "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda",
      "Bargarh", "Rayagada", "Jeypore", "Kendujhar", "Phulbani",
    ],
  },
  {
    name: "Punjab",
    code: "PB",
    cities: [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
      "Mohali", "Firozpur", "Pathankot", "Hoshiarpur", "Batala",
      "Moga", "Rupnagar", "Sangrur", "Fatehgarh Sahib", "Muktsar",
      "Fazilka", "Gurdaspur", "Barnala", "Nawanshahr", "Kapurthala",
    ],
  },
  {
    name: "Rajasthan",
    code: "RJ",
    cities: [
      "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
      "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
      "Pali", "Sri Ganganagar", "Tonk", "Barmer", "Jhalawar",
      "Nagaur", "Hanumangarh", "Sawai Madhopur", "Jhunjhunu", "Bundi",
    ],
  },
  {
    name: "Sikkim",
    code: "SK",
    cities: [
      "Gangtok", "Namchi", "Gyalshing", "Mangan", "Ravangla",
      "Jorethang", "Nayabazar", "Singtam", "Rangpo", "Rongli",
    ],
  },
  {
    name: "Tamil Nadu",
    code: "TN",
    cities: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
      "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi",
      "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
      "Udhagamandalam", "Hosur", "Nagercoil", "Kancheepuram", "Kumarapalayam",
    ],
  },
  {
    name: "Telangana",
    code: "TG",
    cities: [
      "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam",
      "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Suryapet",
      "Miryalaguda", "Siddipet", "Mancherial", "Jagtial", "Kothagudem",
    ],
  },
  {
    name: "Tripura",
    code: "TR",
    cities: [
      "Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia",
      "Khowai", "Ambassa", "Ranir Bazar", "Sabroom", "Sonamura",
    ],
  },
  {
    name: "Uttar Pradesh",
    code: "UP",
    cities: [
      "Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut",
      "Allahabad", "Ghaziabad", "Noida", "Bareilly", "Aligarh",
      "Moradabad", "Saharanpur", "Gorakhpur", "Faridabad", "Firozabad",
      "Jhansi", "Muzaffarnagar", "Mathura", "Rampur", "Shahjahanpur",
      "Farrukhabad", "Mau", "Hapur", "Etawah", "Bulandshahr",
      "Sambhal", "Amroha", "Hardoi", "Sitapur", "Raebareli",
    ],
  },
  {
    name: "Uttarakhand",
    code: "UK",
    cities: [
      "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur",
      "Kashipur", "Rishikesh", "Kotdwar", "Ramnagar", "Pithoragarh",
      "Mussoorie", "Nainital", "Almora", "Champawat", "Uttarkashi",
    ],
  },
  {
    name: "West Bengal",
    code: "WB",
    cities: [
      "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri",
      "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur",
      "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia",
      "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri",
    ],
  },
  // Union Territories
  {
    name: "Andaman and Nicobar Islands",
    code: "AN",
    cities: ["Port Blair", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar"],
  },
  {
    name: "Chandigarh",
    code: "CH",
    cities: ["Chandigarh"],
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DN",
    cities: ["Daman", "Diu", "Silvassa", "Amli"],
  },
  {
    name: "Delhi",
    code: "DL",
    cities: [
      "New Delhi", "Delhi", "Dwarka", "Rohini", "Janakpuri",
      "Lajpat Nagar", "Karol Bagh", "Connaught Place", "Saket", "Pitampura",
      "Nehru Place", "Vasant Kunj", "Noida Extension", "Shahdara", "Preet Vihar",
    ],
  },
  {
    name: "Jammu and Kashmir",
    code: "JK",
    cities: [
      "Srinagar", "Jammu", "Sopore", "Baramulla", "Anantnag",
      "Udhampur", "Kathua", "Punch", "Rajouri", "Kupwara",
    ],
  },
  {
    name: "Ladakh",
    code: "LA",
    cities: ["Leh", "Kargil", "Nubra", "Zanskar", "Drass"],
  },
  {
    name: "Lakshadweep",
    code: "LD",
    cities: ["Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott"],
  },
  {
    name: "Puducherry",
    code: "PY",
    cities: ["Puducherry", "Karaikal", "Mahé", "Yanam", "Villianur"],
  },
];

/** Get all state names (sorted) */
export const STATE_NAMES: string[] = INDIA_STATES.map((s) => s.name).sort();

/** Get cities for a given state name */
export function getCitiesForState(stateName: string): string[] {
  const state = INDIA_STATES.find((s) => s.name === stateName);
  return state ? state.cities.sort() : [];
}

/** Search cities across all states */
export function searchCities(query: string): { state: string; city: string }[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: { state: string; city: string }[] = [];
  for (const state of INDIA_STATES) {
    for (const city of state.cities) {
      if (city.toLowerCase().includes(q)) {
        results.push({ state: state.name, city });
      }
    }
  }
  return results.slice(0, 20);
}

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

/**
 * Approximate geographic centroids (latitude, longitude) for every state and
 * union territory. These are rough reference points — good enough to guess the
 * nearest region for a "use my location" shortcut. They are never used to
 * store or transmit the user's precise position.
 */
export const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "Andhra Pradesh": { lat: 15.9, lng: 80.6 },
  "Arunachal Pradesh": { lat: 28.2, lng: 94.7 },
  "Assam": { lat: 26.2, lng: 92.9 },
  "Bihar": { lat: 25.6, lng: 85.1 },
  "Chhattisgarh": { lat: 21.3, lng: 81.6 },
  "Goa": { lat: 15.3, lng: 74.1 },
  "Gujarat": { lat: 22.3, lng: 71.2 },
  "Haryana": { lat: 29.1, lng: 76.1 },
  "Himachal Pradesh": { lat: 31.8, lng: 77.2 },
  "Jharkhand": { lat: 23.6, lng: 85.3 },
  "Karnataka": { lat: 15.3, lng: 75.7 },
  "Kerala": { lat: 10.3, lng: 76.4 },
  "Madhya Pradesh": { lat: 23.5, lng: 78.7 },
  "Maharashtra": { lat: 19.4, lng: 75.5 },
  "Manipur": { lat: 24.7, lng: 94.0 },
  "Meghalaya": { lat: 25.5, lng: 91.9 },
  "Mizoram": { lat: 23.3, lng: 92.8 },
  "Nagaland": { lat: 26.2, lng: 94.6 },
  "Odisha": { lat: 20.5, lng: 84.4 },
  "Punjab": { lat: 30.4, lng: 75.6 },
  "Rajasthan": { lat: 26.6, lng: 73.8 },
  "Sikkim": { lat: 27.6, lng: 88.5 },
  "Tamil Nadu": { lat: 11.1, lng: 78.7 },
  "Telangana": { lat: 17.9, lng: 79.6 },
  "Tripura": { lat: 23.7, lng: 91.7 },
  "Uttar Pradesh": { lat: 26.8, lng: 80.9 },
  "Uttarakhand": { lat: 30.1, lng: 79.0 },
  "West Bengal": { lat: 23.5, lng: 87.9 },
  "Andaman and Nicobar Islands": { lat: 11.7, lng: 92.8 },
  "Chandigarh": { lat: 30.7, lng: 76.8 },
  "Dadra and Nagar Haveli and Daman and Diu": { lat: 20.2, lng: 73.0 },
  "Delhi": { lat: 28.7, lng: 77.1 },
  "Jammu and Kashmir": { lat: 33.8, lng: 74.8 },
  "Ladakh": { lat: 34.5, lng: 77.5 },
  "Lakshadweep": { lat: 10.6, lng: 72.6 },
  "Puducherry": { lat: 11.9, lng: 79.8 },
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Nearest state/UT to the given coordinates, with the approximate distance.
 * Deterministic — pure maths over STATE_CENTROIDS.
 */
export function nearestState(lat: number, lng: number): { state: string; distanceKm: number } | null {
  const point = { lat, lng };
  let best: { state: string; distanceKm: number } | null = null;
  for (const [state, center] of Object.entries(STATE_CENTROIDS)) {
    const distanceKm = haversineKm(point, center);
    if (!best || distanceKm < best.distanceKm) best = { state, distanceKm };
  }
  return best;
}
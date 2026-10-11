/* Curated scholarship dataset — VERIFIED 2026-10-11.
 * Every entry: award amount + deadline confirmed on the official program page.
 * 8 candidates were dropped for unverifiable amounts/dates (see project notes).
 * Embedded as a JS const so the app runs from file:// with zero setup.
 */
const SCHOLARSHIPS_DATA = [
  {
    id: "coca-cola-scholars-2027", name: "Coca-Cola Scholars Program",
    award: "$20,000", deadline: "2026-09-30", grades: [12],
    minGpa: 3.0, fields: ["Any"],
    officialLink: "https://www.coca-colascholarsfoundation.org/apply/",
    note: "Merit-based; 150 U.S. high school seniors selected yearly for leadership and service."
  },
  {
    id: "gates-scholarship", name: "The Gates Scholarship",
    award: "Full cost of attendance", deadline: "2026-09-15", grades: [12],
    minGpa: 3.3, fields: ["Any"],
    officialLink: "https://www.thegatesscholarship.org/scholarship/",
    note: "Last-dollar full-cost award for Pell-eligible U.S. high school seniors."
  },
  {
    id: "dell-scholars", name: "Dell Scholars Program",
    award: "$20,000", deadline: "2027-01-12", grades: [12],
    minGpa: 2.4, fields: ["Any"],
    officialLink: "https://www.dellscholars.org/students/",
    note: "2027 cycle is TEXAS-ONLY (TX high school + TX public 4-year college). Plus laptop and support services."
  },
  {
    id: "elks-most-valuable-student", name: "Elks Most Valuable Student Scholarship",
    award: "Up to $30,000", deadline: "2026-11-12", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://www.elks.org/scholars/scholarships/mvs.cfm",
    note: "Open to all U.S. high school seniors; 500 four-year awards, top 20 get $30,000 total."
  },
  {
    id: "jack-kent-cooke-college", name: "Jack Kent Cooke Foundation College Scholarship",
    award: "Up to $55,000/year", deadline: "2026-11-11", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://www.jkcf.org/our-scholarships/college-scholarship-program/",
    note: "For high-achieving U.S. seniors with financial need; last-dollar funding."
  },
  {
    id: "regeneron-sts", name: "Regeneron Science Talent Search",
    award: "$250,000 (1st place)", deadline: "2026-11-05", grades: [12],
    minGpa: null, fields: ["STEM"],
    officialLink: "https://www.societyforscience.org/regeneron-sts/",
    note: "Premier U.S. high-school science research competition; requires an original independent research project."
  },
  {
    id: "lester-pearson-uoft", name: "Lester B. Pearson International Scholarship (U of T)",
    award: "Full 4-year: tuition, books, fees + residence", deadline: "2026-11-06", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://future.utoronto.ca/pearson-scholarships",
    note: "U of Toronto full ride for international students (incl. India); ~37 scholars/yr; school nomination required."
  },
  {
    id: "questbridge-match", name: "QuestBridge National College Match",
    award: "Over $360,000 (full 4-year)", deadline: "2026-10-01", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://www.questbridge.org/apply-to-college/programs/national-college-match",
    note: "Full 4-year match at 55 U.S. partner colleges for high-achieving low-income seniors."
  },
  {
    id: "apia-scholars", name: "APIA Scholars",
    award: "$2,500–$20,000", deadline: "2027-01-15", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://apiascholars.org/scholarships/",
    note: "For Asian/Pacific Islander American students with financial need; one application covers all APIA awards."
  },
  {
    id: "ron-brown-scholar", name: "Ron Brown Scholar Program",
    award: "$40,000", deadline: "2026-12-01", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://ronbrown.org/ron-brown-scholarship/",
    note: "For African American U.S. high school seniors showing academic excellence, leadership, and service."
  },
  {
    id: "breakthrough-junior-challenge", name: "Breakthrough Junior Challenge",
    award: "$250,000", deadline: "2026-09-15", grades: [9, 10, 11, 12],
    minGpa: null, fields: ["STEM"],
    officialLink: "http://breakthroughjuniorchallenge.org/faq",
    note: "Global science-video contest, ages 13-18; $250K scholarship + $50K teacher prize + $100K school lab."
  },
  {
    id: "inspire-manak-india", name: "INSPIRE Awards MANAK (India)",
    award: "₹10,000", deadline: "2026-10-10", grades: [6, 7, 8, 9, 10, 11, 12],
    minGpa: null, fields: ["STEM"],
    officialLink: "https://inspireawards-dst.gov.in",
    note: "DST Govt of India; school nomination required (5 ideas/school, max 2 from classes 11-12 science)."
  },
  {
    id: "vfw-voice-of-democracy", name: "VFW Voice of Democracy",
    award: "$35,000", deadline: "2026-10-31", grades: [9, 10, 11, 12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://vfw.org/community/youth-and-education/youth-scholarships",
    note: "Patriotic audio-essay contest; U.S. + territories + military overseas schools; AI assistance prohibited."
  },
  {
    id: "youngarts-2027", name: "YoungArts National Arts Competition",
    award: "Up to $10,000", deadline: "2026-10-06", grades: [10, 11, 12],
    minGpa: null, fields: ["Arts"],
    officialLink: "https://youngarts.org/apply-/",
    note: "10 arts disciplines; winners also eligible for U.S. Presidential Scholar in the Arts nomination."
  },
  {
    id: "gloria-barron-prize", name: "Gloria Barron Prize for Young Heroes",
    award: "$10,000", deadline: "2026-04-15", grades: [9, 10, 11, 12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://barronprize.org/faqs/",
    note: "Ages 8-18, U.S./Canada; honors youth service projects."
  },
  {
    id: "scholastic-art-writing-2027", name: "Scholastic Art & Writing Awards",
    award: "Up to $12,500", deadline: "2026-12-01", grades: [7, 8, 9, 10, 11, 12],
    minGpa: null, fields: ["Arts"],
    officialLink: "https://www.artandwriting.org/awards/how-to-enter/calendar/",
    note: "Deadlines vary by region (Dec 1, 2026 – Jan 4, 2027); national scholarships go to Gold Medal portfolios."
  },
  {
    id: "carson-scholars-2027", name: "Carson Scholars Fund Scholarship",
    award: "$1,000", deadline: "2027-01-13", grades: [4, 5, 6, 7, 8, 9, 10, 11],
    minGpa: 3.75, fields: ["Any"],
    officialLink: "https://carsonscholars.org/for-students/",
    note: "Grades 4-11; SCHOOL NOMINATION required; 3.75 GPA + community service; U.S. schools only."
  },
  {
    id: "arkwright-engineering", name: "Arkwright Engineering Scholarships",
    award: "£250/year for both years", deadline: "2025-12-11", grades: [10, 11, 12],
    minGpa: null, fields: ["STEM"],
    officialLink: "https://www.smallpeicetrust.org.uk/arkwright-engineering-scholarships/",
    note: "UK flagship engineering scholarship for ages 16-18; grant + industry mentor + STEM events.",
    country: "UK"
  },
  {
    id: "schulich-leader", name: "Schulich Leader Scholarships",
    award: "$120,000 (Engineering) / $100,000 (Science)", deadline: "2027-01-27", grades: [12],
    minGpa: null, fields: ["STEM"],
    officialLink: "https://you.ubc.ca/financial-planning/scholarships-awards-canadian-students/schulich-leader/",
    note: "Canada's largest STEM undergrad scholarship; school nomination required.",
    country: "Canada"
  },
  {
    id: "td-indigenous-peoples", name: "TD Scholarship for Indigenous Peoples",
    award: "Up to $60,000", deadline: "2026-10-31", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://www.newswire.ca/news-releases/td-scholarship-for-indigenous-peoples-call-for-2027-applications-820767618.html",
    note: "For First Nations, Metis and Inuit students entering post-secondary; 25 awards yearly.",
    country: "Canada"
  },
  {
    id: "swinburne-vc-excellence", name: "Swinburne Vice-Chancellor's Excellence Scholarship",
    award: "A$5,000/year", deadline: "2026-12-31", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://www.swinburne.edu.au/courses/scholarships/vice-chancellor-s-excellence-scholarship/",
    note: "Automatic for Year 12 school leavers with ATAR 95+ entering Swinburne; Australian citizens/PR only.",
    country: "Australia"
  },
  {
    id: "nmms", name: "National Means-cum-Merit Scholarship Scheme (NMMSS)",
    award: "Rs.12,000/year", deadline: "2026-10-31", grades: [9, 10, 11, 12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://scholarships.gov.in",
    note: "Central govt merit-cum-means scheme for Class 9 entrants in govt/aided schools; 1 lakh fresh awards yearly.",
    country: "India"
  },
  {
    id: "mext-undergraduate", name: "Japanese Government (MEXT) Undergraduate Scholarship",
    award: "Full tuition + monthly stipend + airfare", deadline: "2026-06-05", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://www.pk.emb-japan.go.jp/itpr_en/MEXT_Undergrad_Scholarship.html",
    note: "Japan's fully funded government scholarship for undergrad study.",
    country: "Japan"
  },
  {
    id: "tata-capital-pankh", name: "Tata Capital Pankh Scholarship Program 2026-27",
    award: "Up to Rs.15,000 (Classes 11-12)", deadline: "2026-10-26", grades: [11, 12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://www.buddy4study.com/article/the-tata-capital-pankh-scholarship",
    note: "Tata Capital CSR merit-cum-means aid; 60%+ marks, family income <= Rs.4 lakh.",
    country: "India"
  },
  {
    id: "terry-fox-humanitarian", name: "Terry Fox Humanitarian Award",
    award: "$28,000", deadline: "2026-12-01", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "https://terryfoxawards.ca/applicant-information/",
    note: "For graduating secondary students with sustained voluntary humanitarian work; Canadian citizens/PR.",
    country: "Canada"
  },
  {
    id: "uoa-international-school-leaver", name: "University of Auckland International School Leaver Scholarship",
    award: "NZ$20,000", deadline: "2026-10-23", grades: [12],
    minGpa: null, fields: ["Any"],
    officialLink: "http://international.auckland.ac.nz/study/scholarships",
    note: "For international students completing NZ secondary school and entering first-year undergrad at Auckland.",
    country: "New Zealand"
  }
];

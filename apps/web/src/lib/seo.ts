export const SITE_CONFIG = {
  name: "DailyLift",
  shortName: "DailyLift",
  title: "DailyLift — AI-Powered Workout & Meal Planner",
  description:
    "AI-generated workout and meal plans tailored to your goals, fitness level, and equipment. Track progressive overload, log sets, calculate BMR & TDEE, and hit your fitness targets.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://dailylift.app",
  ogImage: "https://dailylift.app/og-image.png",
  keywords: [
    "AI fitness planner",
    "workout planner",
    "progressive overload tracker",
    "AI meal planner",
    "BMR calculator",
    "TDEE calculator",
    "body fat calculator",
    "gym workout routine",
    "home workout plan",
    "Push Pull Legs routine",
    "Upper Lower split",
    "calorie calculator",
    "macro tracker",
    "strength training logger",
    "fitness tracking app",
  ],
  author: "DailyLift Team",
  creator: "DailyLift",
  themeColor: "#6366f1",
};

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export const MAIN_FAQS: FAQItem[] = [
  {
    question: "What is DailyLift and how does it work?",
    answer:
      "DailyLift is an AI-powered fitness companion that generates personalized workout splits and daily meal plans tailored to your specific fitness goals, experience level, equipment availability (gym, home, outdoor), and dietary preferences. It provides integrated workout logging with progressive overload guidance, rest timers, and scientifically validated health calculators.",
    category: "General",
  },
  {
    question: "How does DailyLift implement progressive overload?",
    answer:
      "DailyLift automatically tracks your previous performance for every exercise (weight, reps, and sets). It applies progressive overload principles by recommending intelligent progression targets — suggesting small weight increments (+1–2.5 kg), additional reps within target ranges, or extra sets when you consistently hit your rep ceiling, ensuring steady strength and hypertrophy gains.",
    category: "Workouts",
  },
  {
    question: "Can I generate workout plans for home or outdoor training without equipment?",
    answer:
      "Yes! DailyLift supports multiple training environments including Commercial Gym (full equipment), Home Gym (dumbbells/bands), Bodyweight/Home (minimal/no gear), and Outdoor. The AI plan builder selects appropriate exercise variations (e.g. push-ups, bodyweight squats, pull-ups) and adjusts volume and intensity accordingly.",
    category: "Workouts",
  },
  {
    question: "How are daily calories and macronutrient targets calculated?",
    answer:
      "DailyLift uses the clinically recognized Mifflin-St Jeor formula to compute your Basal Metabolic Rate (BMR) from your age, gender, height, and weight. It then applies activity multipliers to calculate Total Daily Energy Expenditure (TDEE) and adjusts calories based on your goal (e.g., -500 kcal for fat loss, +300 kcal for muscle gain) with optimal protein, carbohydrate, and fat macro ratios.",
    category: "Nutrition",
  },
  {
    question: "What workout splits does DailyLift recommend?",
    answer:
      "DailyLift supports all major scientifically validated training splits, including Push-Pull-Legs (PPL) for 3–6 day frequencies, Upper / Lower splits for 4 days, Full Body routines for 2–3 days, and Body-part splits. DailyLift can automatically recommend the optimal split based on your available training days and experience level.",
    category: "Workouts",
  },
  {
    question: "How does the AI meal planner handle dietary preferences?",
    answer:
      "The meal planner adapts to non-vegetarian, vegetarian, vegan, and eggetarian preferences. Each generated daily plan includes meal timing (breakfast, lunch, snack, dinner), exact ingredient breakdowns, step-by-step preparation instructions, total calories, and macronutrient targets matching your daily energy requirements.",
    category: "Nutrition",
  },
  {
    question: "Which health and fitness calculators are available on DailyLift?",
    answer:
      "DailyLift includes five specialized calculators: Body Mass Index (BMI), Basal Metabolic Rate (BMR using Mifflin-St Jeor), Daily Calorie and TDEE Needs (with goal adjustments), U.S. Navy Method Body Fat Percentage (using waist, neck, hip, and height measurements), and Daily Water & Hydration Requirements.",
    category: "Calculators",
  },
  {
    question: "Is DailyLift free to use and do I need a credit card?",
    answer:
      "DailyLift is free to get started. You can create an account in less than two minutes, generate your custom workout and meal plans, log your workouts, and access all health calculators without entering any credit card information.",
    category: "General",
  },
];

export const CALCULATOR_FAQS: FAQItem[] = [
  {
    question: "What is BMR and how is it calculated?",
    answer:
      "Basal Metabolic Rate (BMR) is the number of calories your body burns at rest to maintain essential vital functions such as breathing and circulation. DailyLift uses the Mifflin-St Jeor equation: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + s (where s is +5 for males and -161 for females).",
    category: "Calculators",
  },
  {
    question: "What is the difference between BMR and TDEE?",
    answer:
      "BMR is your baseline metabolic calorie burn without any movement. Total Daily Energy Expenditure (TDEE) incorporates your physical activity level and workout frequency by multiplying BMR by an activity factor (1.2 for sedentary up to 1.9 for extremely active). TDEE represents your total daily maintenance calories.",
    category: "Calculators",
  },
  {
    question: "How accurate is the U.S. Navy Body Fat formula?",
    answer:
      "The U.S. Navy circumference method estimates body fat percentage using body circumference measurements (neck, waist, and hips for women) combined with height. Studies show it has an accuracy within 3–4% of DEXA scans, making it one of the most accessible and reliable tape-measure methods available.",
    category: "Calculators",
  },
  {
    question: "How much water should I drink daily?",
    answer:
      "Daily water requirements depend on body mass and exercise intensity. A baseline guideline is approximately 30–35 ml per kilogram of body weight, with an additional 500–1000 ml added for moderate-to-high intensity training days to replace fluids lost through perspiration.",
    category: "Calculators",
  },
];

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_CONFIG.name,
    "alternateName": "DailyLift Fitness",
    "url": SITE_CONFIG.url,
    "description": SITE_CONFIG.description,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_CONFIG.url}/exercises?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function getSoftwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": SITE_CONFIG.name,
    "url": SITE_CONFIG.url,
    "description": SITE_CONFIG.description,
    "applicationCategory": "HealthAndFitnessApplication",
    "operatingSystem": "All modern web browsers, iOS, Android, macOS, Windows",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
    },
    "featureList": [
      "AI-Generated Custom Workout Plans",
      "Personalized Daily Meal Plans & Macro Tracking",
      "Live Workout Logger with Rest Timers & RPE",
      "Progressive Overload Tracking & 1RM Estimates",
      "Scientific Fitness Calculators (BMI, BMR, TDEE, Navy Body Fat, Water)",
      "Exercise Library with Form Cues and Muscle Filtering",
      "Body Weight Trend & Volume Analytics",
    ],
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_CONFIG.name,
    "url": SITE_CONFIG.url,
    "logo": `${SITE_CONFIG.url}/icon.svg`,
    "sameAs": [],
  };
}

export function getFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

export function getHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Start an AI Workout & Nutrition Plan with DailyLift",
    "description": "Step-by-step guide to generating your custom training routine and nutrition plan tailored to your body and goals.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Create your profile",
        "text": "Enter your age, gender, height, weight, and fitness background in the quick 2-minute onboarding flow.",
        "url": `${SITE_CONFIG.url}/onboarding?step=1`,
      },
      {
        "@type": "HowToStep",
        "name": "Select your goal and environment",
        "text": "Choose whether you want to lose fat, build muscle, or increase endurance, and specify if you train at a gym, at home, or outdoors.",
        "url": `${SITE_CONFIG.url}/onboarding?step=2`,
      },
      {
        "@type": "HowToStep",
        "name": "Generate your workout and meal split",
        "text": "DailyLift generates a structured routine (PPL, Upper/Lower, or Full Body) and daily meal plans matching your caloric and macro requirements.",
        "url": `${SITE_CONFIG.url}/plans`,
      },
      {
        "@type": "HowToStep",
        "name": "Log workouts and track progressive overload",
        "text": "Start your active training session, log your sets, reps, and weights, and follow the built-in progressive overload recommendations.",
        "url": `${SITE_CONFIG.url}/workouts`,
      },
    ],
  };
}

import { Doctors } from "@/constants";

export interface DoctorRecommendation {
  doctor: any;
  score: number;
  reasons: string[];
  matchType: 'exact' | 'good' | 'alternative';
}

export interface SymptomCategory {
  symptoms: string[];
  specializations: string[];
  priority: 'high' | 'medium' | 'low';
}

// Symptom to specialization mapping
export const SYMPTOM_SPECIALIZATION_MAP: Record<string, SymptomCategory> = {
  'heart': {
    symptoms: ['chest pain', 'heart palpitations', 'shortness of breath', 'high blood pressure'],
    specializations: ['Heart/Cardiology'],
    priority: 'high'
  },
  'cancer': {
    symptoms: ['unexplained weight loss', 'fatigue', 'lumps', 'persistent cough'],
    specializations: ['Cancer/Oncology'],
    priority: 'high'
  },
  'bone': {
    symptoms: ['joint pain', 'back pain', 'fracture', 'arthritis', 'sports injury'],
    specializations: ['Bone/Orthopedics'],
    priority: 'medium'
  },
  'skin': {
    symptoms: ['rash', 'acne', 'mole changes', 'skin infection', 'allergic reaction'],
    specializations: ['Skin/Dermatology'],
    priority: 'medium'
  },
  'mental': {
    symptoms: ['anxiety', 'depression', 'stress', 'insomnia', 'mood changes'],
    specializations: ['Mental Health'],
    priority: 'medium'
  },
  'diabetes': {
    symptoms: ['frequent urination', 'excessive thirst', 'fatigue', 'blurred vision'],
    specializations: ['Diabetes'],
    priority: 'high'
  },
  'general': {
    symptoms: ['fever', 'cold', 'headache', 'nausea', 'annual checkup'],
    specializations: ['General Medicine'],
    priority: 'low'
  }
};

// Enhanced doctor data with ratings and experience
export const ENHANCED_DOCTORS = Doctors.map(doctor => ({
  ...doctor,
  rating: Math.floor(Math.random() * 20) / 10 + 4.0,
  reviewCount: Math.floor(Math.random() * 200) + 50,
  experience: Math.floor(Math.random() * 20) + 5,
  successRate: Math.floor(Math.random() * 15) + 85,
  awards: getRandomAwards(doctor.name),
  languages: getRandomLanguages(),
  consultationFee: Math.floor(Math.random() * 100) + 100,
  availabilityScore: Math.floor(Math.random() * 30) + 70
}));

function getRandomAwards(doctorName: string): string[] {
  const allAwards = [
    'Top Doctor 2024',
    'Patient Choice Award',
    'Excellence in Healthcare',
    'Best Specialist',
    'Outstanding Service',
    'Healthcare Hero'
  ];
  
  const numAwards = Math.floor(Math.random() * 3) + 1;
  const shuffled = allAwards.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numAwards);
}

function getRandomLanguages(): string[] {
  const allLanguages = ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu'];
  const numLanguages = Math.floor(Math.random() * 3) + 2;
  const shuffled = allLanguages.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numLanguages);
}

export function getSmartRecommendations(
  reason: string,
  selectedSpecialization: string = 'All',
  doctorAvailability: Record<string, boolean> = {}
): DoctorRecommendation[] {
  const lowerReason = reason.toLowerCase();
  
  // Find matching symptom category
  let matchedCategory: SymptomCategory | null = null;
  for (const [key, category] of Object.entries(SYMPTOM_SPECIALIZATION_MAP)) {
    if (category.symptoms.some(symptom => lowerReason.includes(symptom))) {
      matchedCategory = category;
      break;
    }
  }

  // Filter doctors based on specialization and availability
  let filteredDoctors = ENHANCED_DOCTORS;
  
  if (selectedSpecialization !== 'All') {
    filteredDoctors = filteredDoctors.filter(doctor => 
      doctor.specializations.includes(selectedSpecialization as any)
    );
  }

  // Filter by availability if provided
  if (Object.keys(doctorAvailability).length > 0) {
    filteredDoctors = filteredDoctors.filter(doctor => 
      doctorAvailability[doctor.name] !== false
    );
  }

  // Score and rank doctors
  const recommendations: DoctorRecommendation[] = filteredDoctors.map(doctor => {
    let score = 0;
    const reasons: string[] = [];

    // Base score from rating
    score += doctor.rating * 10;
    reasons.push(`High patient rating (${doctor.rating.toFixed(1)}★)`);

    // Experience bonus
    if (doctor.experience >= 15) {
      score += 20;
      reasons.push(`Senior doctor (${doctor.experience}+ years)`);
    } else if (doctor.experience >= 10) {
      score += 15;
      reasons.push(`Experienced doctor (${doctor.experience} years)`);
    }

    // Success rate bonus
    if (doctor.successRate >= 95) {
      score += 15;
      reasons.push(`Excellent success rate (${doctor.successRate}%)`);
    }

    // Specialization match bonus
    if (matchedCategory && doctor.specializations.some(spec => 
      matchedCategory!.specializations.includes(spec)
    )) {
      score += 25;
      reasons.push(`Perfect match for your symptoms`);
    }

    // Availability bonus
    score += doctor.availabilityScore * 0.1;
    reasons.push(`Good availability (${doctor.availabilityScore}%)`);

    // Awards bonus
    score += doctor.awards.length * 5;
    if (doctor.awards.length > 0) {
      reasons.push(`Award-winning doctor`);
    }

    // Determine match type
    let matchType: 'exact' | 'good' | 'alternative' = 'alternative';
    if (matchedCategory && doctor.specializations.some(spec => 
      matchedCategory!.specializations.includes(spec)
    )) {
      matchType = matchedCategory.priority === 'high' ? 'exact' : 'good';
    }

    return {
      doctor,
      score,
      reasons,
      matchType
    };
  });

  // Sort by score (highest first)
  recommendations.sort((a, b) => b.score - a.score);

  // Limit to top 5 recommendations
  return recommendations.slice(0, 5);
}

export function getRecommendationMessage(recommendation: DoctorRecommendation): string {
  const { doctor, matchType, reasons } = recommendation;
  
  switch (matchType) {
    case 'exact':
      return `🎯 Perfect match! Dr. ${doctor.name} specializes in exactly what you need.`;
    case 'good':
      return `✅ Great choice! Dr. ${doctor.name} has excellent experience in this area.`;
    default:
      return `💡 Alternative option: Dr. ${doctor.name} can help with your appointment.`;
  }
}

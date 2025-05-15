
import type { AcademicMonth } from "@/types/app";

export const MONTHS = [
  'June', 'July', 'August', 'September', 'October', 
  'November', 'December', 'January', 'February', 
  'March', 'April', 'May'
];

export function generateAcademicYear(startYear: number): AcademicMonth[] {
  return MONTHS.map((month) => {
    // For months Jan-May, use the next year
    const year = month === 'January' || month === 'February' || month === 'March' || 
                 month === 'April' || month === 'May' 
                 ? startYear + 1 : startYear;
    
    return {
      name: month,
      monthYear: `${month} ${year}`,
      displayText: `${month} ${year}`
    };
  });
}

// Get the current academic year's starting year
export function getCurrentAcademicYear(): number {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-based (0 = January)
  const currentYear = now.getFullYear();
  
  // If we're in January-May, we're in the previous academic year that started in June
  return (currentMonth >= 0 && currentMonth <= 4) ? currentYear - 1 : currentYear;
}


export interface Resource {
  id: string;
  name: string;
  type: 'Lecture Notes' | 'Textbook' | 'Research Paper' | 'Lab Equipment' | 'Software License' | 'Video Lecture' | 'PDF Document' | 'Other';
  course: string;
  year: number;
  description: string;
  keywords: string[];

  // Fields for uploaded file, using snake_case to match database columns
  file_url?: string;        // URL from Supabase Storage
  file_name?: string;       // Original name of the uploaded file
  file_mime_type?: string;  // MIME type of the file
  file_size_bytes?: number; // Size of the file in bytes

  // Timestamps and uploader
  created_at?: string;
  updated_at?: string;
  uploader_id?: string;
}

// Mock data needs to be updated to reflect the new structure if you're still using it for initial testing.
export const mockResources: Resource[] = [
  {
    id: '1',
    name: 'Introduction to Quantum Physics Notes',
    type: 'Lecture Notes',
    course: 'PHY301',
    year: 2023,
    description: 'Comprehensive lecture notes covering the fundamentals of quantum physics.',
    keywords: ['quantum', 'physics', 'notes', 'PHY301'],
    file_name: 'PHY301_Quantum_Intro.pdf',
    file_mime_type: 'application/pdf',
    file_size_bytes: 1200000, // 1.2 MB
    file_url: 'https://placehold.co/downloadable/PHY301_Quantum_Intro.pdf' // Placeholder
  },
  {
    id: '2',
    name: 'Advanced Calculus Textbook (Digital Copy)',
    type: 'Textbook',
    course: 'MTH205',
    year: 2022,
    description: 'In-depth textbook for advanced calculus students, includes exercises and solutions.',
    keywords: ['calculus', 'math', 'textbook', 'MTH205'],
    file_name: 'AdvCalc_Textbook.epub',
    file_mime_type: 'application/epub+zip',
    file_size_bytes: 5500000,
    file_url: 'https://placehold.co/downloadable/AdvCalc_Textbook.epub' // Placeholder
  },
  {
    id: '4',
    name: 'Spectrophotometer XYZ Model Manual',
    type: 'Lab Equipment',
    course: 'CHM410',
    year: 2021,
    description: 'User manual for the High-precision spectrophotometer available for chemistry lab experiments.',
    keywords: ['spectrophotometer', 'chemistry', 'lab', 'CHM410', 'manual'],
    file_name: 'SpectroXYZ_Manual.pdf',
    file_mime_type: 'application/pdf',
    file_size_bytes: 850000
  },
  // ... other resources, ensure they follow the new structure
];

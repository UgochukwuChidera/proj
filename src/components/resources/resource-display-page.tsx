
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Resource } from '@/lib/mock-data';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import { ResourceCard } from './resource-card';
import { FilterControls } from './filter-controls';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Loader2, FilterX, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function ResourceDisplayPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [areFiltersVisible, setAreFiltersVisible] = useState(true);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);

  const fetchFilterOptions = useCallback(async () => {
    // Fetch distinct years
    const { data: yearsData, error: yearsError } = await supabase
      .from('resources')
      .select('year', { count: 'exact', head: false }) 
      .order('year', { ascending: false });
    if (yearsError) console.error("Error fetching years:", yearsError.message);
    else setAvailableYears([...new Set(yearsData?.map(r => r.year) || [])].sort((a,b) => b-a));

    // Fetch distinct types
    const { data: typesData, error: typesError } = await supabase
      .from('resources')
      .select('type', { count: 'exact', head: false });
    if (typesError) console.error("Error fetching types:", typesError.message);
    else setAvailableTypes([...new Set(typesData?.map(r => r.type) || [])].sort());
    
    // Fetch distinct courses
    const { data: coursesData, error: coursesError } = await supabase
      .from('resources')
      .select('course', { count: 'exact', head: false });
    if (coursesError) console.error("Error fetching courses:", coursesError.message);
    else setAvailableCourses([...new Set(coursesData?.map(r => r.course) || [])].sort());
  }, []);

  const fetchResources = useCallback(async (filters?: { term?: string; year?: string; type?: string; course?: string }) => {
    setIsLoading(true);
    setError(null);
    
    let query = supabase.from('resources').select('*');

    if (filters?.term) {
      query = query.or(`name.ilike.%${filters.term}%,description.ilike.%${filters.term}%,keywords.cs.{${filters.term}}`);
    }
    if (filters?.year) {
      query = query.eq('year', parseInt(filters.year, 10));
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.course) {
      query = query.eq('course', filters.course);
    }

    query = query.order('created_at', { ascending: false }); 

    const { data, error: dbError } = await query;

    if (dbError) {
      let detailedErrorMessage = `Failed to load resources. Supabase error: "${dbError.message || 'No specific message provided by Supabase'}".`;
      if (dbError.details) detailedErrorMessage += ` Details: ${dbError.details}.`;
      if (dbError.hint) detailedErrorMessage += ` Hint: ${dbError.hint}.`;
      
      setError(detailedErrorMessage);
      setResources([]);
    } else {
      setResources(data as Resource[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // This effect handles the initial data load and auth state changes.
    if (authLoading) {
      // If auth is still loading, we wait. The component will show a loader.
      return;
    }

    if (isAuthenticated) {
      // Once auth is confirmed, fetch data.
      fetchResources();
      fetchFilterOptions();
    } else {
      // If user is not authenticated, don't fetch data.
      // ConditionalAppShell will handle the redirect to login.
      // We can clear resources and stop the loader here for a clean state.
      setIsLoading(false);
      setResources([]);
    }
  }, [authLoading, isAuthenticated, fetchResources, fetchFilterOptions]);


  const handleApplyFilters = () => {
    fetchResources({
      term: searchTerm,
      year: selectedYear,
      type: selectedType,
      course: selectedCourse,
    });
  };
  
  const handleResetFiltersAndRefresh = () => {
    setSearchTerm('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedCourse('');
    fetchResources(); 
  };

  const handleResourceDeleted = (resourceId: string) => {
    setResources(prevResources => prevResources.filter(r => r.id !== resourceId));
    // The toast is now shown in the ResourceCard component for better context
  };
  
  // This is the primary loading indicator for the page.
  // It shows when auth state is being determined OR when resources are being fetched.
  if (authLoading || (isLoading && isAuthenticated)) { 
    return (
      <div className="container mx-auto py-2 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-8" />
        <p>Loading resources...</p>
      </div>
    );
  }

  // This state is handled by ConditionalAppShell, but it's good practice to have a fallback.
  if (!isAuthenticated && !authLoading) {
     return (
      <div className="container mx-auto py-2">
        <Alert variant="destructive" className="mt-8">
          <Search className="h-4 w-4" />
          <AlertTitle className="font-headline">Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in to view university resources. You will be redirected shortly.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-headline text-3xl font-bold text-primary">University Resources</h1>
        <Button variant="outline" onClick={() => setAreFiltersVisible(!areFiltersVisible)} className="font-body">
          {areFiltersVisible ? <FilterX className="mr-2 h-4 w-4" /> : <SlidersHorizontal className="mr-2 h-4 w-4" />}
          {areFiltersVisible ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          <AlertTitle className="font-headline">Error Loading Resources</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {areFiltersVisible && (
        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          onApplyFilters={handleApplyFilters}
          onResetAndRefresh={handleResetFiltersAndRefresh}
          availableYears={availableYears}
          availableTypes={availableTypes}
          availableCourses={availableCourses}
          isFetching={isLoading}
        />
      )}

      {isLoading ? (
         <div className="text-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-4" />
            <p>Fetching resources...</p>
         </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((resource) => (
            <ResourceCard 
                key={resource.id} 
                resource={resource} 
                isAdmin={user?.isAdmin || false}
                onDeleteSuccess={handleResourceDeleted}
            />
          ))}
        </div>
      ) : (
        !error && ( 
          <Alert className="mt-8">
            <Search className="h-4 w-4" />
            <AlertTitle className="font-headline">No Resources Found</AlertTitle>
            <AlertDescription>
              Try adjusting your search terms or filters.
            </AlertDescription>
          </Alert>
        )
      )}
    </div>
  );
}

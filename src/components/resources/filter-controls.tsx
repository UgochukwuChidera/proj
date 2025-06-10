
"use client";

import type React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, RotateCcw, SearchCheck, Loader2 } from 'lucide-react';

interface FilterControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  onApplyFilters: () => void;
  onResetAndRefresh: () => void;
  availableYears: number[];
  availableTypes: string[];
  availableCourses: string[];
  isFetching: boolean;
}

const ALL_ITEMS_VALUE = "__ALL_ITEMS__";

export function FilterControls({
  searchTerm,
  setSearchTerm,
  selectedYear,
  setSelectedYear,
  selectedType,
  setSelectedType,
  selectedCourse,
  setSelectedCourse,
  onApplyFilters,
  onResetAndRefresh,
  availableYears,
  availableTypes,
  availableCourses,
  isFetching,
}: FilterControlsProps) {

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters();
  };
  
  return (
    <form onSubmit={handleApply} className="mb-6 p-4 border bg-card shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="searchTerm" className="font-body">Search by Name/Keyword</Label>
          <Input
            id="searchTerm"
            type="text"
            placeholder="e.g., Physics, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
            disabled={isFetching}
          />
        </div>
        <div>
          <Label htmlFor="yearFilter" className="font-body">Filter by Year</Label>
          <Select 
            value={selectedYear} 
            onValueChange={(value) => setSelectedYear(value === ALL_ITEMS_VALUE ? "" : value)}
            disabled={isFetching}
          >
            <SelectTrigger id="yearFilter" className="w-full mt-1">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_VALUE}>All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="typeFilter" className="font-body">Filter by Type</Label>
          <Select 
            value={selectedType} 
            onValueChange={(value) => setSelectedType(value === ALL_ITEMS_VALUE ? "" : value)}
            disabled={isFetching}
          >
            <SelectTrigger id="typeFilter" className="w-full mt-1">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_VALUE}>All Types</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="courseFilter" className="font-body">Filter by Course</Label>
          <Select 
            value={selectedCourse} 
            onValueChange={(value) => setSelectedCourse(value === ALL_ITEMS_VALUE ? "" : value)}
            disabled={isFetching}
          >
            <SelectTrigger id="courseFilter" className="w-full mt-1">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_VALUE}>All Courses</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="ghost" onClick={onResetAndRefresh} type="button" disabled={isFetching} className="font-body w-full sm:w-auto">
          {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />} 
          Reset & Show All
        </Button>
        <Button type="submit" disabled={isFetching} className="font-body w-full sm:w-auto">
          {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCheck className="mr-2 h-4 w-4" />} 
          Apply Filters & Refresh
        </Button>
      </div>
    </form>
  );
}

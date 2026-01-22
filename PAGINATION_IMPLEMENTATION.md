# Pagination Implementation for Classes API

## Overview
This document describes the implementation of paginated responses for the classes list API to match the backend API structure.

## Backend API Response Structure

The backend returns a paginated response with this structure:

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "students_count": 0,
      "description": "string",
      "status": "ACTIVE",
      "created_at": "2026-01-13T04:28:12.702129",
      "created_by": {
        "id": "string",
        "username": "string"
      }
    }
  ],
  "meta": {
    "total_items": 5,
    "total_pages": 1,
    "current_page": 1,
    "page_size": 10,
    "has_next": false,
    "has_previous": false
  }
}
```

## Changes Made

### 1. API Types (`src/lib/api/sessions.ts`)

#### Imported Existing Pagination Type
```typescript
import { ApiError, handleResponse, type PaginationMeta } from './tests';
```

Reused the existing `PaginationMeta` interface from `tests.ts` which already had the correct structure.

#### Added New Types

**ClassListItem** - Represents a class in the list view (different from detail view):
```typescript
export interface ClassListItem {
  id: string;
  name: string;
  description: string | null;
  students_count: number;           // Note: different from Class.student_ids
  status: ClassStatus;
  created_at: string;
  created_by: {
    id: string;
    username: string;
  };
}
```

**GetPaginatedClassesResponse** - The paginated response wrapper:
```typescript
export interface GetPaginatedClassesResponse {
  data: ClassListItem[];
  meta: PaginationMeta;
}
```

#### Updated API Function

Changed `getAllClasses` to return paginated response:

**Before:**
```typescript
async getAllClasses(...): Promise<Class[]>
```

**After:**
```typescript
async getAllClasses(
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  teacher_id: string | null = null
): Promise<GetPaginatedClassesResponse>
```

### 2. Class Store (`src/lib/stores/classStore.ts`)

#### Updated State
```typescript
interface ClassStore {
  classes: ClassListItem[];           // Changed from Class[]
  paginationMeta: PaginationMeta | null;  // NEW: Store pagination info
  // ... other fields
}
```

#### Updated `fetchClasses`
```typescript
const response = await sessionsApi.getAllClasses(1, 10, 'created_at', 'desc');
set({ 
  classes: response.data,        // Extract data array
  paginationMeta: response.meta, // Store pagination metadata
  loading: false 
});
```

#### Updated Other Methods
Modified `createClass`, `updateClass`, `deleteClass`, and `enrollStudent` to refresh the list after mutations:
```typescript
// Example: createClass
await sessionsApi.createClass(data);
await get().fetchClasses();  // Refresh to get updated paginated data
```

#### Removed List Updates from `fetchClassById`
Since list items (`ClassListItem`) and detail items (`Class`) are now different types, removed the logic that tried to update the list when fetching details.

### 3. Class Management Component (`src/pages/admin/ClassManagement.tsx`)

#### Updated Class Display
Changed from `student_ids.length` to `students_count`:
```typescript
<span>{class_.students_count} students</span>
```

#### Updated Detail Loading
Added `fetchAvailableStudents()` call when opening class details:
```typescript
const handleViewClass = async (classId: string) => {
  await fetchClassById(classId);
  await fetchAvailableStudents();  // NEW: Load students when modal opens
  setShowClassDetails(true);
};
```

#### Added Null Safety
```typescript
const filteredClasses = classes?.filter((c) =>
  c.name.toLowerCase().includes(searchQuery.toLowerCase())
) ?? [];
```

## Type Separation: List vs Detail

### List View (ClassListItem)
- Used in paginated lists
- Contains `students_count` (number)
- Contains `created_by` object
- Optimized for list display

### Detail View (Class)
- Used when viewing/editing a single class
- Contains `student_ids` (array)
- Contains `teacher_id` (string)
- Contains full student enrollment data

This separation allows:
- Backend to optimize list queries (no need to join all student IDs)
- Frontend to display student counts efficiently
- Proper typing for different use cases

## API Request Example

```bash
GET /api/v1/classes?page=1&page_size=10&sort_by=created_at&sort_order=desc
```

## Pagination Metadata Usage

The pagination metadata is now stored in the class store and can be used for:
- Displaying total number of classes
- Implementing pagination controls (next/previous page)
- Showing "Showing X of Y classes" messages
- Determining if more data exists (`has_next`)

Example usage:
```typescript
const { classes, paginationMeta } = useClassStore();

// Display total
<p>Total Classes: {paginationMeta?.total_items}</p>

// Show pagination info
<p>Page {paginationMeta?.current_page} of {paginationMeta?.total_pages}</p>

// Enable/disable next button
<Button disabled={!paginationMeta?.has_next}>Next Page</Button>
```

## Benefits

1. **Scalability**: Can handle large numbers of classes efficiently
2. **Performance**: Reduced data transfer (only send necessary fields)
3. **Type Safety**: Separate types for list and detail views
4. **Consistency**: Matches backend API structure exactly
5. **Future-Ready**: Easy to add pagination controls later

## Future Enhancements

Potential improvements:
- [ ] Add pagination controls (previous/next buttons)
- [ ] Add page size selector (10, 25, 50, 100)
- [ ] Display total items count
- [ ] Add loading states during page changes
- [ ] Implement infinite scroll
- [ ] Cache pages in memory
- [ ] Add filtering by status, teacher, etc.

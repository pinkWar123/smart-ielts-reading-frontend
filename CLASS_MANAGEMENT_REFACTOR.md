# Class Management Refactor

## Overview
This document describes the refactoring of the class management feature to filter classes by teacher, navigate to a separate detail page, and update the class detail API structure.

## Changes Made

### 1. API Types Update (`src/lib/api/sessions.ts`)

#### Added UserInfo Interface
```typescript
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'TEACHER';
  full_name: string;
}
```

#### Updated Class Interface
Changed from simple IDs to full user objects:

**Before:**
```typescript
export interface Class {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;           // Single teacher ID
  student_ids: string[];        // Array of student IDs
  status: ClassStatus;
  created_at: string;
  updated_at: string | null;
}
```

**After:**
```typescript
export interface Class {
  id: string;
  name: string;
  description: string | null;
  status: ClassStatus;
  teachers: UserInfo[];         // Array of full teacher objects
  students: UserInfo[];         // Array of full student objects
  created_at: string;
  created_by: UserInfo;         // Full creator object
  updated_at: string | null;
}
```

### 2. Class Store Update (`src/lib/stores/classStore.ts`)

#### Added Teacher Filtering
```typescript
fetchClasses: async (teacherId?: string) => {
  const response = await sessionsApi.getAllClasses(
    1, 10, 'created_at', 'desc', 
    teacherId || null  // Pass teacher_id filter
  );
  // ...
}
```

### 3. Class Management Component (`src/pages/admin/ClassManagement.tsx`)

#### Removed Modal-Based Detail View
- Removed `showClassDetails` state
- Removed `selectedClass` display modal
- Removed student enrollment/removal from this page
- Removed `fetchAvailableStudents` call

#### Added Teacher-Based Filtering
```typescript
useEffect(() => {
  // If teacher, only fetch their classes. If admin, fetch all classes.
  const teacherId = user?.role === 'TEACHER' ? user.user_id : undefined;
  fetchClasses(teacherId);
}, [fetchClasses, user]);
```

#### Changed Navigation
**Before:** Opened modal with class details
```typescript
const handleViewClass = async (classId: string) => {
  await fetchClassById(classId);
  setShowClassDetails(true);
};
```

**After:** Navigates to detail page
```typescript
const handleViewClass = (classId: string) => {
  navigate(`/admin/classes/${classId}`);
};
```

### 4. New Class Detail Page (`src/pages/admin/ClassDetail.tsx`)

Created a dedicated page for viewing and managing class details:

#### Features
- **Teachers Section:**
  - Display all assigned teachers with avatar, name, and email
  - "Add Teacher" button (placeholder for future implementation)
  - "Remove Teacher" button for each teacher (placeholder)

- **Students Section:**
  - Display all enrolled students with avatar, name, and email
  - "Add Student" button (placeholder for future implementation)
  - "Remove Student" button for each student (placeholder)

- **Actions:**
  - "Archive Class" button
  - "View Sessions for this Class" button
  - Back navigation to classes list

#### Layout
- Sticky header with navigation
- Role-based badge (Teacher/Admin)
- Class info header with status badge
- Separate cards for teachers and students
- Responsive design with gradient background

### 5. Routing Update (`src/App.tsx`)

Added new route for class detail page:
```typescript
<Route
  path="/admin/classes/:classId"
  element={
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
      <ClassDetail />
    </ProtectedRoute>
  }
/>
```

## User Flow

### For Teachers
1. Navigate to `/admin/classes`
2. See only classes they teach (filtered by their user ID)
3. Click on a class card
4. Navigate to `/admin/classes/{classId}`
5. View full class details with teachers and students
6. Use placeholder buttons for managing enrollment (to be implemented)

### For Admins
1. Navigate to `/admin/classes`
2. See all classes in the system (no teacher filter)
3. Click on a class card
4. Navigate to `/admin/classes/{classId}`
5. View full class details with teachers and students
6. Use placeholder buttons for managing enrollment (to be implemented)

## API Calls

### List Classes
```bash
GET /api/v1/classes?page=1&page_size=10&sort_by=created_at&sort_order=desc&teacher_id={id}
```
- `teacher_id` parameter is included only for teachers
- Admins fetch without `teacher_id` filter

### Get Class Detail
```bash
GET /api/v1/classes/{class_id}
```

Response structure:
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "ACTIVE",
  "teachers": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "TEACHER",
      "full_name": "string"
    }
  ],
  "students": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "STUDENT",
      "full_name": "string"
    }
  ],
  "created_at": "2026-01-13T04:27:49.515466",
  "created_by": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "ADMIN",
    "full_name": "string"
  },
  "updated_at": null
}
```

## Benefits

1. **Better User Experience:**
   - Teachers only see their classes
   - Cleaner navigation with dedicated detail page
   - No unnecessary data fetching (students list)

2. **Performance:**
   - Reduced initial load (no need to fetch all students)
   - Filtered queries for teachers
   - Lazy loading of class details

3. **Scalability:**
   - Supports multiple teachers per class
   - Supports multiple students per class
   - Easy to add more features to detail page

4. **Type Safety:**
   - Clear separation between list and detail views
   - Proper typing for user objects
   - Type-safe navigation

## Future Enhancements

### To Be Implemented
1. **Add Student Functionality:**
   - Search for students
   - Select and add to class
   - API call to enroll student

2. **Add Teacher Functionality:**
   - Search for teachers
   - Select and add to class
   - API call to assign teacher

3. **Remove Student/Teacher:**
   - Confirm dialog
   - API call to remove enrollment
   - Refresh data

4. **Edit Class Details:**
   - Edit name and description
   - Change status
   - API call to update

5. **Additional Features:**
   - Class statistics (sessions, average scores)
   - Student progress overview
   - Export class roster
   - Bulk student import

## Testing Checklist

- [ ] Admin can see all classes
- [ ] Teacher can see only their classes
- [ ] Clicking a class navigates to detail page
- [ ] Detail page displays all teachers
- [ ] Detail page displays all students
- [ ] Placeholder buttons show alert messages
- [ ] Archive class works and redirects back
- [ ] View sessions navigation works
- [ ] Back navigation returns to classes list
- [ ] Role badges display correctly
- [ ] No students fetched on initial page load

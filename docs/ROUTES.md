# Application Routes Map

## 🗺️ Complete Route Structure

```
┌─────────────────────────────────────────────────────────┐
│                     HOME PAGE (/)                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  🎓 IELTS Reading Practice Platform            │    │
│  │                                                 │    │
│  │  [Start Practice] ──────────┐                  │    │
│  │  [Admin Dashboard] ─────┐   │                  │    │
│  │                         │   │                  │    │
│  └─────────────────────────│───│──────────────────┘    │
└─────────────────────────────│───│───────────────────────┘
                              │   │
                ┌─────────────┘   └──────────────┐
                │                                 │
                ▼                                 ▼
    ┌──────────────────────┐          ┌─────────────────────┐
    │   ADMIN DASHBOARD    │          │  STUDENT DASHBOARD  │
    │      (/admin)        │          │     (/student)      │
    ├──────────────────────┤          ├─────────────────────┤
    │                      │          │                     │
    │ • Stats Overview     │          │ • Enter Name        │
    │ • Quick Actions      │          │ • Browse Tests      │
    │ • Recent Tests       │          │ • Search Tests      │
    │ • Load Sample Data   │          │ • Start Test        │
    │                      │          │                     │
    │ ┌──────────────────┐ │          └──────────┬──────────┘
    │ │ Create Passage   │─┼─┐                   │
    │ └──────────────────┘ │ │                   │
    │ ┌──────────────────┐ │ │                   ▼
    │ │ Create Test      │─┼─┼─┐     ┌──────────────────────┐
    │ └──────────────────┘ │ │ │     │   TEST INTERFACE     │
    │ ┌──────────────────┐ │ │ │     │      (/test)         │
    │ │ Passage Library  │─┼─┼─┼─┐   ├──────────────────────┤
    │ └──────────────────┘ │ │ │ │   │                      │
    └──────────────────────┘ │ │ │   │  ┌────────┬────────┐ │
                             │ │ │   │  │Passage │Questions│ │
                             │ │ │   │  │        │        │ │
                             │ │ │   │  │  Left  │  Right │ │
                             │ │ │   │  │  Panel │  Panel │ │
                             │ │ │   │  │        │        │ │
                             │ │ │   │  └────────┴────────┘ │
                             │ │ │   │                      │
                             │ │ │   │  • Timer             │
                             │ │ │   │  • Tab Detection     │
                             │ │ │   │  • Navigation        │
                             │ │ │   │  • Submit            │
                             │ │ │   │                      │
                             │ │ │   └──────────┬───────────┘
                             │ │ │              │
                             │ │ │              ▼
                             │ │ │   ┌──────────────────────┐
                             │ │ │   │   RESULTS PAGE       │
                             │ │ │   │  (within /test)      │
                             │ │ │   ├──────────────────────┤
                             │ │ │   │                      │
                             │ │ │   │  • Score & Band      │
                             │ │ │   │  • Correct/Wrong     │
                             │ │ │   │  • Answer Review     │
                             │ │ │   │  • Tab Switches      │
                             │ │ │   │                      │
                             │ │ │   └──────────────────────┘
                             │ │ │
                             ▼ ▼ ▼
        ┌────────────────────────────────────────┐
        │        ADMIN SUB-PAGES                  │
        ├────────────────────────────────────────┤
        │                                         │
        │  /admin/passage/new                     │
        │  ┌───────────────────────────────────┐  │
        │  │ PASSAGE CREATOR                   │  │
        │  │                                   │  │
        │  │ [Upload Images] [Manual Entry]   │  │
        │  │                                   │  │
        │  │ • Image Upload with Claude AI    │  │
        │  │ • Manual Text Entry              │  │
        │  │ • Title & Content Fields         │  │
        │  │ • Save to Library                │  │
        │  └───────────────────────────────────┘  │
        │                                         │
        │  /admin/passages                        │
        │  ┌───────────────────────────────────┐  │
        │  │ PASSAGE LIBRARY                   │  │
        │  │                                   │  │
        │  │ • Search Passages                │  │
        │  │ • View All Passages              │  │
        │  │ • Delete Passages                │  │
        │  │ • Passage Statistics             │  │
        │  └───────────────────────────────────┘  │
        │                                         │
        │  /admin/test/new                        │
        │  ┌───────────────────────────────────┐  │
        │  │ TEST BUILDER                      │  │
        │  │                                   │  │
        │  │ • Choose Test Type               │  │
        │  │   - Full Test (3 passages)       │  │
        │  │   - Single Passage (1 passage)   │  │
        │  │ • Select Passages                │  │
        │  │ • Configure Time Limit           │  │
        │  │ • Save & Publish                 │  │
        │  └───────────────────────────────────┘  │
        │                                         │
        └────────────────────────────────────────┘
```

## 📍 Route Details

### Public Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Landing page with navigation |
| `/student` | StudentDashboard | Browse and start tests |
| `/test` | TestInterface | Take the test (with results) |

### Admin Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | AdminDashboard | Admin home with stats |
| `/admin/passage/new` | PassageCreator | Create new passages |
| `/admin/passages` | PassageLibrary | View all passages |
| `/admin/test/new` | TestBuilder | Create new tests |

## 🔄 User Flows

### Student Flow
```
1. Home → Click "Start Practice"
2. Student Dashboard → Enter name & select test
3. Test Interface → Answer questions
4. Results Page → View score and review
5. Home → Back to home page
```

### Teacher Flow (Creating Content)
```
1. Home → Click "Admin Dashboard"
2. Admin Dashboard → Click "Load Sample Data" (first time)
   OR
   → Click "Create Passage"
3. Passage Creator → Upload images or enter text manually
4. Save → Passage added to library
5. Admin Dashboard → Click "Create Test"
6. Test Builder → Select passages & configure
7. Save → Test published for students
```

### Teacher Flow (Managing Content)
```
1. Admin Dashboard → Click "Passage Library"
2. Passage Library → View, search, or delete passages
   OR
3. Admin Dashboard → View "Recent Tests" section
4. See test statistics and status
```

## 🎯 Navigation Components

### HomePage Navigation
- **Primary CTA**: "Start Practice" → `/student`
- **Secondary CTA**: "Admin Dashboard" → `/admin`

### Admin Dashboard Navigation
- **Quick Actions Cards**:
  - "Create Passage" → `/admin/passage/new`
  - "Create Test" → `/admin/test/new`
  - "Passage Library" → `/admin/passages`

### Test Interface Navigation
- **Previous/Next Buttons**: Navigate between passages
- **Submit Button**: Complete test and view results
- **Back to Home**: Return from results

## 🔐 Route Protection (Future Enhancement)

Currently, all routes are public. For production, add:

```typescript
// Protected Admin Routes
/admin/* → Require teacher authentication

// Protected Test Routes  
/test → Require student name entry

// Public Routes
/ → Always accessible
/student → Always accessible (but requires name to start)
```

## 🚀 Quick Access URLs

When server is running on `http://localhost:5175`:

- **Home**: http://localhost:5175/
- **Student Dashboard**: http://localhost:5175/student
- **Admin Dashboard**: http://localhost:5175/admin
- **Create Passage**: http://localhost:5175/admin/passage/new
- **Passage Library**: http://localhost:5175/admin/passages
- **Create Test**: http://localhost:5175/admin/test/new

## 📱 Route Features

### All Routes Include:
✅ TypeScript type safety
✅ React Router v6 navigation
✅ Responsive design
✅ Loading states
✅ Error boundaries (can be added)
✅ SEO-friendly (add titles/meta later)

### Special Features by Route:

**Test Interface** (`/test`):
- Tab detection active
- Timer countdown
- Prevents accidental navigation
- Auto-saves answers

**Admin Routes**:
- Access to all management features
- Create, read, update, delete operations
- Sample data loading

**Student Dashboard**:
- Test filtering and search
- Name validation before starting
- Test information preview


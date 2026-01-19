# IELTS Reading Practice Platform

A comprehensive web application for IELTS teachers to create and manage reading tests, and for students to practice with advanced monitoring features.

## Features

### For Teachers (Admin)
- **AI-Powered Text Extraction**: Upload images of IELTS passages and automatically convert them to text using Claude AI
- **Passage Library**: Build a reusable library of reading passages
- **Test Builder**: Create full tests (3 passages, 40 questions) or single passage tests
- **Question Configuration**: Support for all IELTS question types:
  - Multiple Choice
  - True/False/Not Given
  - Yes/No/Not Given
  - Matching Headings
  - Matching Information
  - Matching Features
  - Sentence Completion
  - Summary Completion
  - Short Answer
  - Diagram Labeling
  - Table Completion
  - Flow Chart
  - Note Completion

### For Students
- **Interactive Test Interface**: Two-panel layout with passage on left, questions on right
- **Tab Switching Detection**: Monitor and log when students switch tabs or lose focus
- **Timer**: Automatic countdown with time tracking
- **Instant Results**: View scores, band scores, and detailed answer review
- **Navigation**: Easy navigation between passages and questions

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Routing**: React Router v6
- **AI Integration**: Claude API (Anthropic)
- **Storage**: LocalStorage (can be upgraded to backend)

## Installation

1. **Clone the repository** (or ensure you're in the project directory)

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:
```env
VITE_CLAUDE_API_KEY=your_claude_api_key_here
```

Get your API key from: https://console.anthropic.com/

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser** and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── admin/           # Admin-specific components
│   ├── student/         # Student-specific components
│   └── shared/          # Shared components
├── pages/
│   ├── admin/           # Admin pages
│   └── student/         # Student pages
├── lib/
│   ├── api/             # API services (Claude, storage)
│   ├── types/           # TypeScript type definitions
│   ├── stores/          # Zustand state stores
│   └── utils/           # Utility functions
├── hooks/               # Custom React hooks
└── services/            # Business logic services
```

## Usage Guide

### For Teachers

1. **Access Admin Dashboard**: Click "Admin Dashboard" from the home page
2. **Create a Passage**:
   - Click "Create Passage"
   - Upload images OR manually enter text
   - AI will extract text from images automatically
   - Save the passage to your library
3. **Create a Test**:
   - Click "Create Test"
   - Choose test type (Full Test or Single Passage)
   - Select passages from library or create new ones
   - Configure questions and correct answers
   - Publish the test
4. **View Test Results**: Monitor student attempts and tab switching behavior

### For Students

1. **Enter Your Name**: Required before starting any test
2. **Select a Test**: Choose from Full Tests or Single Passage Tests
3. **Take the Test**:
   - Read the passage on the left panel
   - Answer questions on the right panel
   - Navigate between passages using arrow buttons
   - **Warning**: Tab switching is monitored and logged
4. **Submit and Review**: View your score, band score, and detailed results

## Important Notes

### Security Considerations

⚠️ **API Key Security**: The Claude API key is currently configured in the frontend. For production:
- Create a backend proxy endpoint
- Never expose API keys in client-side code
- Use server-side rendering or a backend API

### Tab Detection

The tab detection feature:
- Logs when users switch tabs or windows
- Shows warnings to students
- Cannot completely prevent cheating (browser limitations)
- Provides valuable information for teachers to review

### Data Storage

Currently using LocalStorage:
- **Pros**: No backend required, simple setup
- **Cons**: Data is browser-specific, limited storage
- **Recommendation**: Upgrade to a backend (Supabase, Firebase, or custom API) for production

## Development

### Adding New Question Types

1. Add the type to `src/lib/types/question.ts`
2. Update `QuestionRenderer.tsx` to handle rendering
3. Update scoring logic in `src/lib/utils/scoring.ts`

### Customizing UI

All UI components are in `src/components/ui/`. They use Tailwind CSS classes and can be easily customized.

### State Management

- Admin state: `src/lib/stores/adminStore.ts`
- Test state: `src/lib/stores/testStore.ts`

## Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

## Future Enhancements

- [ ] Backend API integration
- [ ] User authentication and authorization
- [ ] Student progress tracking
- [ ] Advanced analytics and reporting
- [ ] Export test results to PDF
- [ ] Bulk passage import
- [ ] Question bank management
- [ ] Test scheduling and assignment
- [ ] Mobile app version

## Troubleshooting

### Module not found errors
If you see path alias errors (`@/...`), restart your IDE's TypeScript server.

### Claude API errors
- Verify your API key is correct in `.env`
- Check your API quota and billing status
- Ensure images are in supported formats (JPEG, PNG)

### Build errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## License

This project is for educational purposes.

## Support

For issues or questions, please contact your development team.


# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key (Optional for testing)
The app works without the Claude API key for manual text entry. To enable image-to-text conversion:

```bash
cp .env.example .env
```

Then edit `.env` and add your Claude API key from https://console.anthropic.com/

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Quick Demo

#### Option A: Use Sample Data (Recommended)
1. Click "Admin Dashboard"
2. Click "Load Sample Data" button
3. Go back to home and click "Start Practice"
4. Enter your name and try the sample test!

#### Option B: Create Your Own Content
1. Click "Admin Dashboard"
2. Click "Create Passage"
3. Choose "Manual Entry" tab
4. Enter a passage title and content
5. Click "Save Passage"
6. Click "Create Test"
7. Select your passage and create a test
8. Go to "Start Practice" to take the test

## Features to Try

### For Teachers (Admin)
- ✅ Create passages manually or with AI
- ✅ Build passage library
- ✅ Create full tests (3 passages) or single passage tests
- ✅ View all tests and passages

### For Students
- ✅ Take tests with timer
- ✅ Two-panel interface (passage + questions)
- ✅ Navigation between passages
- ✅ Tab switching detection
- ✅ Instant results with band scores

## Important Notes

### Tab Detection
- The app monitors when students switch tabs
- Shows warnings to students
- Logs all tab switches in the results
- Cannot completely prevent cheating (browser limitation)

### Data Storage
- Currently uses browser LocalStorage
- Data persists per browser
- Clear browser data = lose all content
- For production, integrate a backend database

### Image Upload (Requires API Key)
- Supports JPEG, PNG images
- Uses Claude AI to extract text
- Costs API credits per request
- Works best with clear, high-quality images

## Keyboard Shortcuts

### Test Interface
- Tab detection automatically monitors focus
- Use mouse to navigate between questions
- Arrow buttons to change passages

## Troubleshooting

### "Module not found" errors
Restart your IDE or run:
```bash
npm run dev
```

### Sample data not loading
Clear browser localStorage:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### API key errors
- Verify the key is in `.env` file
- Check the format: `VITE_CLAUDE_API_KEY=sk-...`
- Restart the dev server after adding the key

## Next Steps

1. **Create Real Content**: Add your IELTS passages and questions
2. **Customize Scoring**: Adjust band score thresholds in `src/lib/utils/scoring.ts`
3. **Add Backend**: Integrate with Supabase, Firebase, or custom API
4. **Deploy**: Build and deploy to Vercel, Netlify, or your hosting platform

## Need Help?

- Check the main README.md for detailed documentation
- Review the code comments in key files
- All components are in `src/components/`
- All types are defined in `src/lib/types/`

Happy teaching! 🎓


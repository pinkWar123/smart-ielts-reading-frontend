# WebSocket Integration Testing Guide

## Overview

This guide provides comprehensive testing scenarios and checklist for validating the WebSocket integration between students and teachers during live test sessions.

## Pre-Testing Setup

### 1. Environment Configuration

Ensure the following environment variables are set in your `.env` file:

```bash
VITE_API_URL=http://127.0.0.1:8000  # or your backend URL
```

### 2. Backend Requirements

Verify the backend WebSocket server is running and accessible at:
- Development: `ws://127.0.0.1:8000/api/v1/websocket/{session_id}/ws?token={jwt_token}`
- Production: `wss://your-domain.com/api/v1/websocket/{session_id}/ws?token={jwt_token}`

### 3. Test Accounts

Prepare the following test accounts:
- **Teachers:** At least 1 teacher account
- **Students:** At least 5-10 student accounts for realistic testing
- **Admin:** 1 admin account (optional, for monitoring)

## Testing Scenarios

### Scenario 1: Basic Connection Flow

**Objective:** Verify basic WebSocket connection establishment

**Steps:**
1. Create a new test session as teacher
2. Navigate to the session monitoring page
3. **Verify:** Connection status badge shows "Connected" in green
4. Open browser DevTools Console
5. **Verify:** See "WebSocket connected" log message
6. **Verify:** ConnectionStatus component shows latency (in ms)

**Expected Results:**
- ✅ WebSocket connects successfully
- ✅ Connection status indicator is green
- ✅ No error messages in console
- ✅ Latency is displayed (typically < 200ms)

---

### Scenario 2: Student Waiting Room

**Objective:** Test student joining waiting room before session starts

**Steps:**
1. As teacher, create session and start waiting phase
2. As student, navigate to session waiting room URL
3. **Verify:** Student sees "Waiting for Teacher to Start" message
4. **Verify:** Connected student count updates on both teacher and student views
5. Add 2-3 more students to waiting room
6. **Verify:** Counter increments in real-time for all participants

**Expected Results:**
- ✅ Students can join waiting room
- ✅ Participant count updates in real-time
- ✅ All connected students see updated count
- ✅ Teacher sees all connected students in monitoring view

---

### Scenario 3: Session Start

**Objective:** Test session start broadcast to all participants

**Steps:**
1. Have 3+ students in waiting room
2. As teacher, click "Start Session"
3. **Verify:** All students automatically redirect to test interface
4. **Verify:** Test timer starts for all students simultaneously
5. **Verify:** Teacher sees session status change to "IN_PROGRESS"
6. **Verify:** Teacher sees list of connected students

**Expected Results:**
- ✅ All students receive `session_started` message
- ✅ Students redirect to test interface automatically
- ✅ Timer starts synchronously across all clients
- ✅ No students are left in waiting room

---

### Scenario 4: Real-Time Progress Tracking

**Objective:** Verify teacher sees student progress in real-time

**Steps:**
1. Start test session with 2+ students
2. As Student 1, navigate to Question 5
3. **Verify (Teacher View):** Student 1's current question updates to "Question 5"
4. As Student 2, navigate to Passage 2, Question 3
5. **Verify (Teacher View):** Student 2's position updates
6. Check that progress updates are debounced (max 1 per 2 seconds per student)

**Expected Results:**
- ✅ Teacher sees real-time question position updates
- ✅ Updates are debounced to prevent spam
- ✅ Multiple students' progress tracked independently
- ✅ No performance degradation with many students

---

### Scenario 5: Answer Submission Tracking

**Objective:** Test real-time answer submission notifications

**Steps:**
1. As student, answer Question 1
2. **Verify (Teacher View):** "Answers" count increments by 1
3. **Verify (Activity Feed):** New activity shows "Answered Question 1"
4. As student, change answer for Question 1
5. **Verify (Activity Feed):** Activity shows "Answered Question 1 (updated)"
6. Answer 5 more questions rapidly
7. **Verify:** All answers are tracked without message loss

**Expected Results:**
- ✅ Each answer submission creates activity log
- ✅ Updates vs new answers are differentiated
- ✅ Answer count updates in real-time
- ✅ No answers are lost even with rapid submission

---

### Scenario 6: Text Highlighting

**Objective:** Test text highlighting detection and tracking

**Steps:**
1. As student, select and highlight text in passage
2. Wait 2 seconds (debounce period)
3. **Verify (Teacher View):** Highlight count increments
4. **Verify (Activity Feed):** Shows highlighted text preview (first 50 chars)
5. Highlight 3 more text selections rapidly
6. **Verify:** Only 1-2 messages sent (due to debouncing)

**Expected Results:**
- ✅ Highlights are detected and tracked
- ✅ Debouncing prevents spam (max 1 per 2 seconds)
- ✅ Teacher sees preview of highlighted text
- ✅ Highlight count updates correctly

---

### Scenario 7: Violation Detection

**Objective:** Test all violation types are detected and reported

**7a. Tab Switch:**
1. As student, switch to another browser tab
2. **Verify (Student):** Warning message appears
3. **Verify (Teacher):** Violation alert appears in activity feed
4. **Verify (Teacher):** Violation count increments
5. **Verify:** Violation type shows "TAB_SWITCH"

**7b. Copy Attempt:**
1. As student, try to copy text from passage (Ctrl+C)
2. **Verify:** Same verifications as 7a
3. **Verify:** Type shows "COPY_ATTEMPT"

**7c. Right Click:**
1. As student, right-click on page
2. **Verify:** Violation recorded
3. **Verify:** Type shows "RIGHT_CLICK"

**7d. Developer Tools:**
1. As student, press F12 to open DevTools
2. **Verify:** Violation recorded
3. **Verify:** Type shows "DEV_TOOLS"

**Expected Results:**
- ✅ All violation types are detected
- ✅ Violations are reported immediately (no debouncing)
- ✅ Both REST API and WebSocket record violations
- ✅ Teacher sees violation details with type and count

---

### Scenario 8: Student Submission

**Objective:** Test submission notification to teacher

**Steps:**
1. As student, complete test and click Submit
2. **Verify (Student):** Submission confirmation appears
3. **Verify (Teacher):** Submitted count increments
4. **Verify (Activity Feed):** Shows submission with score (if available)
5. **Verify (Progress Card):** Student marked as "Submitted"
6. **Verify:** Student cannot modify answers after submission

**Expected Results:**
- ✅ Submission is instant and confirmed
- ✅ Teacher notified immediately
- ✅ Score displayed if calculated
- ✅ Student card shows submitted status

---

### Scenario 9: Session Completion

**Objective:** Test auto-submit when session completes

**Steps:**
1. Start session with 2 students
2. Have Student 1 submit normally
3. Keep Student 2 without submitting
4. As teacher, click "Complete Session"
5. **Verify (Student 2):** Attempt auto-submits
6. **Verify (Student 2):** Redirects to results page
7. **Verify (Teacher):** All students show as submitted

**Expected Results:**
- ✅ `session_completed` message broadcasts to all
- ✅ Unsubmitted attempts auto-submit
- ✅ Students redirect to results automatically
- ✅ Teacher sees completion status for all

---

### Scenario 10: Disconnection & Reconnection

**Objective:** Test connection loss and automatic reconnection

**Steps:**
1. Start test session with 1 student
2. As student, open DevTools and throttle network to "Offline"
3. **Verify (Student):** Connection status shows "Disconnected"
4. **Verify (Teacher):** Student shows as disconnected
5. Re-enable network
6. **Verify (Student):** Auto-reconnects within 30 seconds
7. **Verify:** Test state is preserved
8. **Verify (Teacher):** Student shows as connected again

**Expected Results:**
- ✅ Disconnection is detected within 45 seconds
- ✅ Auto-reconnection with exponential backoff
- ✅ State is preserved during disconnection
- ✅ Teacher notified of disconnect/reconnect

---

### Scenario 11: Concurrent Users (Load Test)

**Objective:** Test performance with many concurrent students

**Steps:**
1. Create session with 20+ students enrolled
2. Have 10 students join waiting room
3. Start session
4. Have all students:
   - Navigate questions simultaneously
   - Answer questions rapidly
   - Highlight text
   - Trigger occasional violations
5. **Monitor (Teacher):** CPU usage, memory, UI responsiveness
6. **Verify:** Activity feed handles high message volume

**Expected Results:**
- ✅ All students connect successfully
- ✅ Messages are batched (max 30 per 300ms)
- ✅ UI remains responsive
- ✅ No message loss
- ✅ Memory usage stays reasonable

---

### Scenario 12: Message Ordering

**Objective:** Verify messages are processed in correct order

**Steps:**
1. As student, rapidly:
   - Navigate to Question 5
   - Answer Question 5
   - Highlight text
   - Navigate to Question 6
2. **Verify (Teacher):** Activity feed shows events in chronological order
3. **Verify:** Timestamps increase monotonically
4. **Verify:** No out-of-order updates

**Expected Results:**
- ✅ Messages processed in timestamp order
- ✅ Priority messages (errors, violations) processed first
- ✅ UI updates reflect correct sequence
- ✅ No race conditions

---

## Performance Benchmarks

### Connection Metrics
- **Connection Time:** < 1 second
- **Latency:** < 200ms (local), < 500ms (remote)
- **Reconnection Time:** 1-30 seconds (exponential backoff)

### Message Throughput
- **Student Actions:** Debounced to max 1 per 2 seconds
- **Teacher Updates:** Batched max 30 messages per 300ms
- **Activity Feed:** Max 50 visible activities

### Resource Usage (20 concurrent students)
- **CPU:** < 20% sustained
- **Memory:** < 200MB for teacher view
- **Network:** < 100 KB/s sustained

---

## Common Issues & Troubleshooting

### Issue: WebSocket won't connect

**Symptoms:** Connection status stuck on "Connecting"

**Possible Causes:**
1. Backend not running
2. Incorrect WebSocket URL
3. JWT token expired or invalid
4. CORS configuration issue

**Solutions:**
- Check backend logs for WebSocket errors
- Verify `VITE_API_URL` in .env
- Refresh authentication token
- Check browser console for detailed error

---

### Issue: Messages not received

**Symptoms:** Teacher not seeing student activities

**Possible Causes:**
1. WebSocket disconnected silently
2. Message handler not registered
3. Backend not broadcasting correctly
4. Network filtering WebSocket traffic

**Solutions:**
- Check connection status indicator
- Look for "WebSocket closed" in console
- Verify backend WebSocket implementation
- Test on different network

---

### Issue: High latency or lag

**Symptoms:** Updates delayed by several seconds

**Possible Causes:**
1. Poor network connection
2. Too many messages not being batched
3. UI re-rendering too frequently
4. Backend performance issues

**Solutions:**
- Check latency in ConnectionStatus popover
- Verify message batching is working
- Use React DevTools Profiler
- Monitor backend CPU/memory

---

### Issue: Duplicated activities

**Symptoms:** Same activity appears multiple times

**Possible Causes:**
1. Message deduplication disabled
2. Backend sending duplicates
3. Re-renders triggering re-processing

**Solutions:**
- Enable deduplication in useOptimizedWebSocket
- Check backend for duplicate sends
- Ensure message IDs are unique

---

## Manual Testing Checklist

### Pre-Session
- [ ] Backend WebSocket server running
- [ ] Frontend environment variables configured
- [ ] Test accounts created (teacher + students)
- [ ] Browser DevTools console open

### Connection
- [ ] WebSocket connects on page load
- [ ] Connection status shows "Connected"
- [ ] Latency is displayed and reasonable
- [ ] No connection errors in console

### Waiting Room
- [ ] Students can join waiting room
- [ ] Participant count updates in real-time
- [ ] Teacher sees connected student list
- [ ] Connection status badges accurate

### Session Start
- [ ] Session starts successfully
- [ ] All students auto-redirect to test
- [ ] Timer starts synchronously
- [ ] Teacher view shows IN_PROGRESS

### During Test - Student Side
- [ ] Text highlighting works
- [ ] Tab switch detected
- [ ] Copy/paste detected
- [ ] Right-click detected
- [ ] Dev tools detected
- [ ] Questions can be answered
- [ ] Navigation works smoothly

### During Test - Teacher Side
- [ ] Progress updates in real-time
- [ ] Answers tracked correctly
- [ ] Highlights counted
- [ ] Violations displayed with details
- [ ] Activity feed updates live
- [ ] Statistics dashboard accurate
- [ ] Connection indicators work

### Submission
- [ ] Student can submit test
- [ ] Teacher notified of submission
- [ ] Submitted status shown
- [ ] Score displayed (if available)

### Session End
- [ ] Auto-submit works
- [ ] Students redirect to results
- [ ] Teacher can complete session
- [ ] Final statistics correct

### Disconnection Handling
- [ ] Disconnection detected
- [ ] Auto-reconnection works
- [ ] State preserved after reconnect
- [ ] Connection quality indicated

### Performance (10+ students)
- [ ] All messages delivered
- [ ] UI remains responsive
- [ ] No excessive memory usage
- [ ] Message batching working
- [ ] No console errors

---

## Automated Testing (Future)

Consider implementing automated E2E tests using:

### Tools
- **Playwright/Cypress:** For browser automation
- **WS library:** For WebSocket client simulation
- **Jest:** For unit tests of hooks and components

### Test Scenarios to Automate
1. Connection flow test
2. Message handling test
3. Reconnection test
4. Load test with simulated clients
5. Message ordering test

---

## Success Criteria

The WebSocket integration is considered complete when:

- ✅ All 12 testing scenarios pass
- ✅ Performance benchmarks are met
- ✅ No console errors during normal operation
- ✅ Connection is stable for 1+ hour sessions
- ✅ Works with 20+ concurrent students
- ✅ All message types implemented and tested
- ✅ Error handling covers all edge cases
- ✅ Reconnection is seamless and automatic

---

## Next Steps

After completing this testing guide:

1. **Document Issues:** Log any bugs or issues found
2. **Performance Tuning:** Adjust debounce/batch intervals if needed
3. **User Feedback:** Gather feedback from actual teachers/students
4. **Monitoring:** Set up production monitoring for WebSocket health
5. **Documentation:** Update user guides with WebSocket features

---

## Support & Resources

- **Backend API Docs:** See `websocket.md` for complete message specifications
- **Frontend Components:** Check component JSDoc for usage details
- **Troubleshooting:** Refer to "Common Issues" section above
- **Performance:** See `useOptimizedWebSocket` for batching configuration

---

*Last Updated: January 18, 2026*

# 🧪 FanPulse - Testing Guide

## SOLO Tier - End-to-End Testing Checklist

### ✅ Phase 1: Authentication & Onboarding

#### Registration
- [ ] Can create account with email + password
- [ ] Email validation works (min 3 chars, valid format)
- [ ] Password validation works (min 8 chars)
- [ ] Name validation works (required)
- [ ] Error messages display correctly
- [ ] Loading states show during registration
- [ ] Success message after registration
- [ ] Email verification notice appears

#### Login
- [ ] Can login with correct credentials
- [ ] Error on incorrect password
- [ ] Error on non-existent email
- [ ] "Remember me" checkbox works
- [ ] Redirect to dashboard after login
- [ ] Token stored correctly (localStorage)
- [ ] Refresh token works

#### Forgot Password
- [ ] Can request password reset
- [ ] Email sent confirmation
- [ ] Reset link works
- [ ] Can set new password
- [ ] Redirect to login after reset

#### Logout
- [ ] Logout button works
- [ ] Redirects to login page
- [ ] Token cleared from storage
- [ ] Cannot access dashboard after logout

---

### ✅ Phase 2: Dashboard Home

#### KPI Cards
- [ ] Momentum Score displays correctly (0-100)
- [ ] Trend arrows show (↑↓↔)
- [ ] Projected Revenue shows with currency
- [ ] Superfans Count displays
- [ ] Loading skeletons show while loading
- [ ] Dark mode styles correct

#### Charts
- [ ] Momentum Evolution chart loads
- [ ] 90 days data visible
- [ ] Hover tooltips work
- [ ] Responsive on mobile
- [ ] Streams Evolution chart loads
- [ ] 30 days data visible
- [ ] Social Engagement chart loads

#### Next Actions Widget
- [ ] Top 3 actions display
- [ ] Urgency badges show (critical/high/medium/low)
- [ ] Can mark action as complete
- [ ] Can snooze action
- [ ] Action disappears after completion

#### Recent Alerts
- [ ] Last 5 alerts display
- [ ] Timestamp shows correctly ("2h ago")
- [ ] Click redirects to Alerts page
- [ ] Alert types visible (viral spike, momentum drop, etc.)

#### Empty States
- [ ] Shows "No artists" if none added
- [ ] "Add Artist" button works
- [ ] Friendly message displays

---

### ✅ Phase 3: Actions & Todo Page

#### Filters
- [ ] Filter by Artiste works
- [ ] Filter by Urgency works (critical/high/medium/low)
- [ ] Filter by Status works (pending/completed/snoozed/ignored)
- [ ] Filter by Type works
- [ ] Search by keyword works
- [ ] Multiple filters combine correctly

#### Actions List
- [ ] All actions load
- [ ] Pagination works (if > 20 actions)
- [ ] Urgency color-coded correctly
- [ ] Artist name displays
- [ ] Action description shows
- [ ] Timestamp displays

#### Action Management
- [ ] Mark as Complete works
- [ ] Snooze action works (disappears from pending)
- [ ] Ignore action works
- [ ] View Details opens modal
- [ ] Modal shows full context

#### Stats Cards
- [ ] Total count correct
- [ ] Pending count correct
- [ ] Completed count correct
- [ ] Critical count correct
- [ ] High count correct

#### Empty States
- [ ] "No actions" shows if none
- [ ] Filter message if no results
- [ ] Friendly empty state design

---

### ✅ Phase 4: Momentum Index

#### Artist List
- [ ] All artists load
- [ ] Artist photos display
- [ ] Momentum scores show (0-100)
- [ ] Status badges display (fire/growing/stable/declining)
- [ ] Trend percentage shows (+/- X%)
- [ ] Loading skeletons while loading

#### Filters
- [ ] Filter by status works (all/fire/growing/stable/declining)
- [ ] Filter updates list correctly
- [ ] Clear filter works

#### Detail Panel (Selected Artist)
- [ ] Click artist selects it
- [ ] Highlight selected artist
- [ ] Momentum Breakdown shows
- [ ] 5 signals display (streams, saves, playlist, engagement, virality)
- [ ] Progress bars animate
- [ ] "View Full Profile" button works

#### Historical Chart
- [ ] 90 days chart displays
- [ ] Zones colored (green = growth, red = decline)
- [ ] Annotations show events
- [ ] Hover tooltips work

---

### ✅ Phase 5: Superfans

#### Artist Selector
- [ ] Dropdown lists all artists
- [ ] Select artist loads superfans
- [ ] Auto-selects first artist

#### FVS Slider
- [ ] Min FVS slider works (0-100)
- [ ] Updates superfans list
- [ ] Shows threshold value

#### Superfans Grid
- [ ] Top 20 superfans display
- [ ] Fan cards show photo (if available)
- [ ] FVS score prominent (0-100)
- [ ] Breakdown mini-graph shows
- [ ] Name + Location display
- [ ] Hover effect on cards

#### Fan Detail Modal
- [ ] Click card opens modal
- [ ] Full profile displays
- [ ] FVS breakdown detailed
- [ ] Listening habits show
- [ ] Engagement history shows
- [ ] Close modal works

#### Insights Stats
- [ ] Total superfans count
- [ ] Active last 30d count
- [ ] Avg engagement score
- [ ] Total LTV (lifetime value)

#### Export CSV
- [ ] Export button works
- [ ] CSV file downloads
- [ ] Correct data in CSV
- [ ] Filename includes artist name + date

#### Empty States
- [ ] "No superfans" if none found
- [ ] Suggestion to lower threshold
- [ ] Friendly message

---

### ✅ Phase 6: Release Optimizer

#### Date Picker
- [ ] Calendar shows 90 days future
- [ ] Color-coding works (green/yellow/red)
- [ ] Hover shows score preview
- [ ] Click date selects it

#### Selected Date Detail
- [ ] Score 0-10 displays prominently
- [ ] 6 factors breakdown shows
- [ ] Progress bars for each factor
- [ ] Recommendations list displays

#### Competition List
- [ ] Competitors for date display
- [ ] Genre + popularity show
- [ ] Flag major competitors (>1M followers)

#### Stream Predictions
- [ ] 3 scenarios graph (conservative, realistic, optimistic)
- [ ] Confidence bands visible
- [ ] Timeline 30 days

#### Recommendations
- [ ] Top 3 alternative dates if score < 7
- [ ] Reasoning for each suggestion
- [ ] Compare button works

---

### ✅ Phase 7: Revenue Forecasting

#### Timeline Selector
- [ ] 3 months / 6 months / 12 months toggle
- [ ] Date range picker works
- [ ] Updates chart

#### Scenarios Chart
- [ ] 3 lines display (conservative, realistic, optimistic)
- [ ] Area chart with confidence bands
- [ ] Hover tooltips work
- [ ] Responsive on mobile

#### Breakdown by Source
- [ ] Pie chart or stacked bar
- [ ] Shows: Streaming, Concerts, Merch, Sync, Other
- [ ] Percentages visible
- [ ] Click filters table

#### Monthly Table
- [ ] All months listed
- [ ] Columns: Month, Streaming, Live, Merch, Sync, Total
- [ ] Values formatted as currency
- [ ] Scroll if many months

#### Export
- [ ] Export CSV button works
- [ ] CSV downloads with correct data

---

### ✅ Phase 8: Alerts

#### Real-time Connection
- [ ] WebSocket connects (green "Connected" badge)
- [ ] Disconnected warning if offline (red badge)

#### Current Opportunities (Live)
- [ ] Live opportunities display (if any)
- [ ] Type icons show
- [ ] Priority color-coded
- [ ] Recommended actions list

#### Alerts History
- [ ] All alerts load
- [ ] Type icons show
- [ ] Severity badges (urgent/warning/info)
- [ ] Timestamp displays ("2h ago")
- [ ] Artist name shows

#### Filters
- [ ] Filter by Type works
- [ ] Filter by Artiste works
- [ ] Filter by Status (read/unread) works
- [ ] Mark all as read works

#### Actions
- [ ] Mark as read (green check)
- [ ] Delete alert (red trash)
- [ ] Confirm before delete

#### Stats Cards
- [ ] Total alerts last 30d
- [ ] Unread count
- [ ] Critical count
- [ ] Last 24h count

---

### ✅ Phase 9: Settings

#### Profile Section
- [ ] Name field editable
- [ ] Email field editable
- [ ] Company field editable
- [ ] Website field editable (URL validation)
- [ ] Timezone selector works
- [ ] Save Changes button works
- [ ] Success toast after save

#### Notifications Section
- [ ] Email preferences toggles work
- [ ] Push notifications toggles work
- [ ] 7 alert types checkboxes work
- [ ] Save Preferences button works

#### Platforms Section
- [ ] Spotify shows "Connected" status
- [ ] Instagram shows "Connected" status
- [ ] TikTok shows "Not Connected" (PRO badge)
- [ ] YouTube shows "Not Connected" (PRO badge)
- [ ] Apple Music shows "Not Connected" (PRO badge)
- [ ] Disconnect button works (Spotify, Instagram)
- [ ] Connect button works (TikTok, YouTube, Apple Music)

#### Billing Section
- [ ] Current plan displays (SOLO €199/mois)
- [ ] Status shows "Active"
- [ ] Usage bars display (Artists, API Calls, Storage)
- [ ] Usage colors change (green < 50%, yellow 50-80%, red > 80%)
- [ ] Payment method shows (Visa •••• 4242)
- [ ] Invoices list displays
- [ ] Download invoice button works
- [ ] Upgrade Plan button works (redirects to pricing)

#### Security Section
- [ ] Last password change date shows
- [ ] Change Password button works
- [ ] 2FA status shows "Disabled"
- [ ] Enable 2FA button works
- [ ] Active sessions list displays
- [ ] Current session marked
- [ ] Revoke session button works

---

### ✅ Phase 10: UX Essentials

#### Command Palette (⌘K)
- [ ] ⌘K opens command palette (Mac)
- [ ] Ctrl+K opens command palette (Windows/Linux)
- [ ] Search bar focused on open
- [ ] Pages section displays
- [ ] Fuzzy search works
- [ ] Artists section displays
- [ ] Select page navigates
- [ ] Select artist navigates
- [ ] Quick Actions section shows
- [ ] ESC closes palette
- [ ] Click outside closes palette
- [ ] Arrow keys navigate results
- [ ] Enter selects result

#### Dark Mode
- [ ] Toggle in header works
- [ ] 3 modes: Light / Dark / System
- [ ] Light mode correct colors
- [ ] Dark mode correct colors
- [ ] System mode follows OS
- [ ] All pages support dark mode
- [ ] Charts visible in dark mode
- [ ] No layout shift on toggle
- [ ] Preference persists (localStorage)

#### Skeleton Loading
- [ ] Dashboard shows skeletons while loading
- [ ] Actions page shows skeletons
- [ ] Momentum page shows skeletons
- [ ] Superfans page shows skeletons
- [ ] Skeletons animated (pulse)
- [ ] Smooth transition to real content

#### Toast Notifications
- [ ] Success toast shows (green)
- [ ] Error toast shows (red)
- [ ] Info toast shows (blue)
- [ ] Warning toast shows (yellow)
- [ ] Icons display correctly
- [ ] Close button works
- [ ] Auto-dismiss after 5s
- [ ] Multiple toasts stack
- [ ] Dark mode toasts correct

#### Empty States
- [ ] Friendly design
- [ ] Icons display
- [ ] Title + description clear
- [ ] Action buttons work
- [ ] Variant colors correct (default/info/warning/success)

---

### ✅ Phase 11: Mobile Responsive

#### Header
- [ ] Logo visible
- [ ] Artist selector usable
- [ ] Search button accessible
- [ ] Dark mode toggle visible
- [ ] User menu accessible

#### Sidebar
- [ ] Hamburger menu on mobile
- [ ] Sidebar slides in
- [ ] Navigation links work
- [ ] Close button works
- [ ] Backdrop closes sidebar

#### Dashboard
- [ ] KPI cards stack vertically
- [ ] Charts responsive
- [ ] Touch scroll works
- [ ] Cards readable

#### Actions Page
- [ ] Filters collapse on mobile
- [ ] Action cards stack
- [ ] Buttons accessible
- [ ] Text readable

#### Momentum Page
- [ ] Artist list scrollable
- [ ] Detail panel moves below
- [ ] Charts resize
- [ ] Filters usable

#### Superfans Page
- [ ] Grid becomes 1-2 columns
- [ ] Cards readable
- [ ] Export button accessible
- [ ] Modal full-screen on mobile

#### Settings Page
- [ ] Tabs scroll horizontally
- [ ] Forms full-width
- [ ] Buttons accessible
- [ ] Text inputs usable

---

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile

---

## Performance Testing

### Lighthouse Scores
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

### Core Web Vitals
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Bundle Size
- [ ] First Load JS < 200 KB
- [ ] Total JS < 500 KB

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate dropdowns

### Screen Reader
- [ ] All images have alt text
- [ ] Buttons have aria-labels
- [ ] Form fields have labels
- [ ] Error messages announced
- [ ] Loading states announced

### Color Contrast
- [ ] Text readable (WCAG AA)
- [ ] Dark mode contrast sufficient
- [ ] Focus indicators visible

---

## Edge Cases

### No Data
- [ ] Empty states show everywhere
- [ ] No JavaScript errors
- [ ] Friendly messages

### Slow Network
- [ ] Loading states show
- [ ] Timeouts handled gracefully
- [ ] Retry mechanisms work

### Offline
- [ ] Error message shows
- [ ] "Reconnected" toast when back online

### Large Datasets
- [ ] Pagination works (>100 items)
- [ ] Virtual scrolling (if needed)
- [ ] Performance maintained

---

## Bug Reporting Template

```markdown
### Bug Description
[Clear description of the issue]

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: [Chrome 120]
- Device: [Desktop / Mobile]
- OS: [macOS 14 / Windows 11 / iOS 17]
- Screen size: [1920x1080]

### Screenshots
[Attach screenshots if applicable]

### Console Errors
[Copy any console errors]
```

---

## Testing Sign-off

**Tested by:** _______________
**Date:** _______________
**Version:** _______________

**Overall Status:**
- [ ] All critical features work
- [ ] No critical bugs
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Accessibility compliant

**Approved for launch:** ☐ Yes  ☐ No

---

## Contact

For testing issues or questions, contact: rodolphe@fanpulse.io

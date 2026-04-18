# Requirements Document

## Introduction

This specification covers a comprehensive UI/UX polish pass for the ChewyTodoList mobile app (React Native + Expo). The audit compared the mobile Expo Web app against the web frontend and identified systematic issues across six pages: Login, Home (Task List), Projects, Views, Settings, and Task Detail. The core problems fall into five categories: inconsistent icon system (emoji vs proper icons), missing visual polish (gradients, shadows, glassmorphism), inadequate touch targets, broken navigation on Expo Web, and inconsistent typography/spacing. This feature brings the mobile app to visual parity with the web frontend while respecting mobile-native interaction patterns.

## Glossary

- **Mobile_App**: The ChewyTodoList React Native + Expo mobile application, running on iOS, Android, and Expo Web
- **Icon_System**: The unified set of vector icons used across the Mobile_App, replacing all emoji and Unicode character icons
- **Tab_Bar**: The bottom navigation bar in the Mobile_App containing Home, Projects, Views, and Settings tabs
- **Task_Card**: The card component that displays a single task's summary information in list and other views
- **FAB**: The Floating Action Button used to create new tasks, positioned in the bottom-right corner
- **Login_Page**: The authentication screen where users enter credentials to access the Mobile_App
- **Home_Page**: The main task list screen showing views, search, and task cards
- **Projects_Page**: The screen listing all project groups and their projects
- **Views_Page**: The screen listing all system and custom task views
- **Settings_Page**: The user profile and app settings screen
- **Task_Detail_Page**: The full task editing screen showing all task properties, subtasks, and notes
- **Touch_Target**: The tappable area of an interactive element, measured in density-independent pixels
- **Card_Elevation**: The visual shadow and border treatment applied to card components to create depth
- **Glassmorphism**: A design effect combining semi-transparent backgrounds with backdrop blur
- **Gradient_Button**: A button styled with a multi-color gradient background instead of a flat color
- **Skeleton_Loader**: A placeholder animation shown while content is loading, displaying the approximate shape of the expected content
- **View_Tab**: A horizontal tab in the Home_Page header used to switch between different task views

## Requirements

### Requirement 1: Unified Icon System

**User Story:** As a user, I want all icons in the Mobile_App to use a consistent vector icon library, so that the interface looks professional and cohesive across all screens.

#### Acceptance Criteria

1. THE Icon_System SHALL use `@expo/vector-icons` (MaterialCommunityIcons or Ionicons family) as the single icon source for all interactive and decorative icons across the Mobile_App
2. WHEN the Tab_Bar renders tab icons, THE Tab_Bar SHALL display vector icons from the Icon_System instead of emoji characters (🏠📋👁⚙️)
3. WHEN the Login_Page renders input field icons, THE Login_Page SHALL display vector icons from the Icon_System instead of emoji characters (👤🔒⚡)
4. WHEN the Home_Page renders view type indicators, THE Home_Page SHALL display vector icons from the Icon_System instead of Unicode text characters (☰⊞📅⊟⟶⊡)
5. WHEN the Views_Page renders view type icons in the list, THE Views_Page SHALL display vector icons from the Icon_System instead of Unicode text characters
6. WHEN the Projects_Page renders project icons, THE Projects_Page SHALL display vector icons from the Icon_System instead of the 📋 emoji
7. WHEN the Task_Card renders status indicators, THE Task_Card SHALL display vector icons from the Icon_System instead of Unicode characters (○◎✓✗)
8. WHEN the Task_Card renders priority indicators, THE Task_Card SHALL display vector icons from the Icon_System instead of Unicode flag characters (⚑)
9. WHEN the Settings_Page renders menu items, THE Settings_Page SHALL display a leading vector icon from the Icon_System for each settings row (tags, card config, dark mode, password, version)
10. WHEN the Task_Detail_Page renders the back button and more menu, THE Task_Detail_Page SHALL display vector icons from the Icon_System instead of text characters (← and ⋯)

### Requirement 2: Login Page Visual Polish

**User Story:** As a user, I want the login page to have a polished, modern appearance with gradient effects and glassmorphism, so that the first impression of the app feels premium.

#### Acceptance Criteria

1. WHEN the Login_Page renders the login button, THE Login_Page SHALL apply a linear gradient background (indigo→purple→pink) to the button instead of a flat purple color
2. WHEN the Login_Page renders the form card, THE Login_Page SHALL apply a glassmorphism effect with semi-transparent white background and visible backdrop blur on native platforms
3. WHEN the Login_Page renders background decorations, THE Login_Page SHALL display at least two blurred gradient circles with opacity between 0.08 and 0.15 positioned at different corners
4. WHEN the Login_Page renders the logo icon, THE Login_Page SHALL display a vector checkmark icon from the Icon_System instead of the ✓ text character

### Requirement 3: Task Card Visual Improvements

**User Story:** As a user, I want task cards to have clear visual boundaries, proper spacing, and a non-overlapping completion checkbox, so that I can scan and interact with tasks comfortably.

#### Acceptance Criteria

1. THE Task_Card SHALL render with a visible border (1px solid with border color from theme) or shadow elevation to visually separate cards from the background
2. WHEN the ListView renders a Task_Card with a completion checkbox, THE ListView SHALL position the checkbox inside the card's left padding area without overlapping the card content
3. THE Task_Card SHALL reserve left padding of at least 44dp when a completion checkbox is displayed, so that the title and other fields do not overlap the checkbox
4. WHEN the Task_Card renders a status badge, THE Task_Card SHALL use a compact dot indicator (8dp circle) as the default variant instead of the text badge, reducing horizontal space usage
5. WHEN a user taps a Task_Card on the Home_Page, THE Home_Page SHALL navigate to the Task_Detail_Page for that task on all platforms including Expo Web

### Requirement 4: Home Page Layout and Navigation

**User Story:** As a user, I want the home page to have a visible search bar, prominent FAB button, and working tab navigation, so that I can efficiently find and create tasks.

#### Acceptance Criteria

1. WHEN the Home_Page renders the FAB, THE FAB SHALL be positioned at the bottom-right corner of the screen with a minimum size of 56×56dp and a visible shadow
2. WHEN the Home_Page renders View_Tabs, THE Home_Page SHALL display an underline or bold-weight active indicator that clearly distinguishes the selected tab from inactive tabs
3. WHEN a user taps a Tab_Bar item on Expo Web, THE Tab_Bar SHALL navigate to the corresponding screen and update the active tab indicator
4. WHEN the Home_Page renders the search icon, THE Home_Page SHALL use a vector icon from the Icon_System with a minimum Touch_Target of 44×44dp

### Requirement 5: Touch Target Compliance

**User Story:** As a user, I want all interactive elements to be large enough to tap comfortably, so that I do not accidentally tap the wrong control.

#### Acceptance Criteria

1. THE Mobile_App SHALL ensure all interactive elements (buttons, checkboxes, icons, menu items) have a minimum Touch_Target of 44×44dp as measured by the element's tappable area including hit slop
2. WHEN the Task_Detail_Page renders priority selection buttons, THE Task_Detail_Page SHALL render each button with a minimum height of 44dp and minimum width of 48dp
3. WHEN the Task_Detail_Page renders quick date buttons, THE Task_Detail_Page SHALL render each button with a minimum height of 40dp and sufficient horizontal padding for comfortable tapping
4. WHEN the Projects_Page renders the group menu button (⋯), THE Projects_Page SHALL render the button with a minimum Touch_Target of 44×44dp and a visible icon color that contrasts with the background

### Requirement 6: Card Elevation and Shadow System

**User Story:** As a user, I want cards and elevated surfaces to have consistent shadows, so that the visual hierarchy is clear and elements do not appear flat.

#### Acceptance Criteria

1. THE Mobile_App SHALL define a consistent shadow system with at least two elevation levels: low (for list item cards) and medium (for floating elements like FAB and modals)
2. WHEN the Task_Card renders on the Home_Page, THE Task_Card SHALL apply the low elevation shadow with a visible shadow offset and opacity
3. WHEN the Projects_Page renders project list cards, THE Projects_Page SHALL apply the low elevation shadow or a 1px border to the card container
4. WHEN the FAB renders, THE FAB SHALL apply the medium elevation shadow with the primary color as the shadow color

### Requirement 7: Settings Page Visual Enhancement

**User Story:** As a user, I want the settings page to have icons for each menu item and a visually distinct avatar, so that the page is easy to scan and feels polished.

#### Acceptance Criteria

1. WHEN the Settings_Page renders the user avatar, THE Settings_Page SHALL apply a gradient background (primary color gradient) to the avatar circle instead of a flat light purple
2. WHEN the Settings_Page renders settings menu items, THE Settings_Page SHALL display a leading icon from the Icon_System for each item: tag icon for tag management, card icon for card config, moon/sun icon for dark mode, lock icon for password, info icon for version
3. WHEN the Settings_Page renders settings sections, THE Settings_Page SHALL group items under labeled section headers (e.g., "通用设置", "账户安全", "关于") with visible spacing between groups

### Requirement 8: Task Detail Page Interaction Improvements

**User Story:** As a user, I want the task detail page to have adequately sized controls, visible tag removal, and a clear activity log indicator, so that editing tasks is efficient and intuitive.

#### Acceptance Criteria

1. WHEN the Task_Detail_Page renders tags, THE Task_Detail_Page SHALL display a remove (×) button on each tag pill with a minimum Touch_Target of 32×32dp
2. WHEN the Task_Detail_Page renders the subtask section with zero subtasks, THE Task_Detail_Page SHALL display an "添加子任务" prompt button instead of showing "0/0 已完成"
3. WHEN the Task_Detail_Page renders the more menu button (⋯), THE Task_Detail_Page SHALL display the button as a vector icon with a minimum Touch_Target of 44×44dp and a visible color that contrasts with the header background
4. WHEN the Task_Detail_Page renders the activity log section, THE Task_Detail_Page SHALL display a section header with an expand/collapse chevron icon indicating that activity history is available

### Requirement 9: Views Page Visual Hierarchy

**User Story:** As a user, I want the views page to have proper icons and visual distinction between view types, so that I can quickly identify and manage my views.

#### Acceptance Criteria

1. WHEN the Views_Page renders view type icons, THE Views_Page SHALL display vector icons from the Icon_System with distinct icons for each view type (list, board, calendar, table, timeline, gallery)
2. WHEN the Views_Page renders the "导航栏" badge, THE Views_Page SHALL render the badge with a minimum height of 20dp and font size of at least 11sp for readability
3. WHEN the Views_Page renders the marketplace button (广场), THE Views_Page SHALL display a vector icon from the Icon_System instead of the 🏪 emoji

### Requirement 10: Typography Consistency

**User Story:** As a user, I want text across the app to follow a consistent typographic hierarchy, so that headings, body text, and labels are visually distinct and easy to read.

#### Acceptance Criteria

1. THE Mobile_App SHALL apply consistent font weights across all pages: 700 for page titles, 600 for section headers, 500 for list item primary text, 400 for body and secondary text
2. THE Mobile_App SHALL apply consistent font sizes from the theme constants: 20sp for page titles, 15sp for list item primary text, 13sp for secondary/meta text, 11sp for badges and captions
3. WHEN the Task_Card renders the task title, THE Task_Card SHALL use font weight 600 and font size 15sp consistently across all view types

### Requirement 11: Loading State Improvements

**User Story:** As a user, I want to see skeleton placeholder animations while content loads, so that the app feels responsive and I understand what content is coming.

#### Acceptance Criteria

1. WHEN the Home_Page is loading task data, THE Home_Page SHALL display skeleton loader placeholders that approximate the shape of Task_Cards instead of a centered spinner
2. WHEN the Projects_Page is loading project data, THE Projects_Page SHALL display skeleton loader placeholders that approximate the shape of project list items instead of a centered spinner
3. WHEN the Views_Page is loading view data, THE Views_Page SHALL display skeleton loader placeholders that approximate the shape of view list items instead of a centered spinner

### Requirement 12: Empty State Consistency

**User Story:** As a user, I want empty states across all pages to follow a consistent pattern with an icon, message, and optional action, so that I always know what to do when a section has no content.

#### Acceptance Criteria

1. THE Mobile_App SHALL render empty states with a consistent layout: a vector icon from the Icon_System (not emoji), a primary message in 16sp font, and an optional secondary message in 13sp muted color
2. WHEN the Home_Page displays an empty task list, THE Home_Page SHALL show an empty state with a task-related vector icon and a message indicating no tasks exist for the current view
3. WHEN the Projects_Page displays an empty project list, THE Projects_Page SHALL show an empty state with a project-related vector icon and a prompt to create the first project

### Requirement 13: Color Consistency

**User Story:** As a user, I want the primary purple color and its variants to be applied consistently from the theme constants, so that the app has a unified color identity.

#### Acceptance Criteria

1. THE Mobile_App SHALL reference all primary color values from the `Colors` theme constant instead of hardcoded hex values (#8b5cf6) in component styles
2. WHEN the Mobile_App renders active/selected states (active tab, focused input, selected option), THE Mobile_App SHALL use `Colors.primary` for the highlight color consistently
3. WHEN the Mobile_App renders background tints derived from the primary color, THE Mobile_App SHALL use `Colors.primaryLight` from the theme instead of manually constructed opacity values

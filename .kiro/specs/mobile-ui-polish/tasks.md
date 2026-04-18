# Tasks

## Task 1: Theme Constants and Shared Infrastructure

- [-] 1.1 Add shadow system constants (`Shadows.low`, `Shadows.medium`, `Shadows.primaryMedium`) to `mobile/constants/theme.ts`
- [ ] 1.2 Create icon mapping file `mobile/constants/icons.ts` with all icon name constants (TabIcons, ViewTypeIcons, StatusIcons, PriorityIcons, SettingsIcons, ActionIcons)
- [ ] 1.3 Create `mobile/components/ui/SkeletonLoader.tsx` with base SkeletonLoader, SkeletonCard, and SkeletonListItem components using Animated opacity pulse
- [ ] 1.4 Create `mobile/components/ui/EmptyState.tsx` with standardized empty state layout (vector icon, primary message, optional description, optional action button)

## Task 2: Tab Bar — Icons and Web Navigation Fix

- [ ] 2.1 Update `mobile/app/(tabs)/_layout.tsx` to replace emoji TabIcon with MaterialCommunityIcons using TabIcons mapping, and convert any className usage to inline styles
- [ ] 2.2 Add web-safe tab navigation fix in `mobile/app/(tabs)/_layout.tsx` using Platform.OS check and router.replace for web tab presses

## Task 3: FAB Component Fix

- [ ] 3.1 Update `mobile/components/ui/FAB.tsx` to replace className with inline styles, use MaterialCommunityIcons for the icon, apply Shadows.primaryMedium, and ensure 56×56dp minimum size with absolute positioning

## Task 4: Task Card and ListView Polish

- [ ] 4.1 Update `mobile/components/task/TaskCardRenderer.tsx` to replace Unicode/emoji icons with MaterialCommunityIcons for PriorityField (flag icons), StatusField (circle icons), DueDateField (calendar icon), and ProjectField (folder icon)
- [ ] 4.2 Update `mobile/components/task/TaskCard.tsx` to apply Shadows.low for card elevation and ensure visible card boundaries
- [ ] 4.3 Update `mobile/components/views/ListView.tsx` to fix checkbox positioning (inside card padding, no overlap), add Platform.OS web check to skip Swipeable wrapper, and replace emoji icons in swipe actions with MaterialCommunityIcons
- [ ] 4.4 Update `mobile/components/views/ListView.tsx` empty state to use the new EmptyState component with vector icon

## Task 5: Home Page Polish

- [ ] 5.1 Update `mobile/app/(tabs)/index.tsx` to replace emoji VIEW_TYPE_ICONS with MaterialCommunityIcons using ViewTypeIcons mapping
- [ ] 5.2 Update `mobile/app/(tabs)/index.tsx` search icon to use MaterialCommunityIcons with 44×44dp touch target
- [ ] 5.3 Update `mobile/app/(tabs)/index.tsx` view tab active indicator to use underline style or bold weight for clear active state distinction
- [ ] 5.4 Update `mobile/app/(tabs)/index.tsx` loading state to use SkeletonCard components instead of centered ActivityIndicator
- [ ] 5.5 Replace hardcoded `#8b5cf6` color references in `mobile/app/(tabs)/index.tsx` with `Colors.primary`

## Task 6: Login Page Visual Polish

- [ ] 6.1 Update `mobile/app/(auth)/login.tsx` to replace emoji icons (👤🔒⚡👁🙈) with MaterialCommunityIcons
- [ ] 6.2 Update `mobile/app/(auth)/login.tsx` login button to use layered-view gradient effect (indigo→purple→pink) instead of flat color
- [ ] 6.3 Update `mobile/app/(auth)/login.tsx` form card to apply glassmorphism effect (semi-transparent background, blur on native)
- [ ] 6.4 Update `mobile/app/(auth)/login.tsx` logo to use MaterialCommunityIcons checkmark instead of ✓ text character
- [ ] 6.5 Update `mobile/app/(auth)/login.tsx` background decorations to use proper opacity values (0.08–0.15) and replace hardcoded colors with theme references

## Task 7: Projects Page Polish

- [ ] 7.1 Update `mobile/app/(tabs)/projects/index.tsx` to replace 📋 emoji project icons with MaterialCommunityIcons folder icon
- [ ] 7.2 Update `mobile/app/(tabs)/projects/index.tsx` to apply Shadows.low or 1px border to project list card containers
- [ ] 7.3 Update `mobile/app/(tabs)/projects/index.tsx` group menu button (⋯) to use MaterialCommunityIcons with 44×44dp touch target and visible color
- [ ] 7.4 Update `mobile/app/(tabs)/projects/index.tsx` loading state to use SkeletonListItem components instead of centered ActivityIndicator
- [ ] 7.5 Update `mobile/app/(tabs)/projects/index.tsx` empty state to use EmptyState component with vector icon

## Task 8: Views Page Polish

- [ ] 8.1 Update `mobile/app/(tabs)/views/index.tsx` to replace Unicode VIEW_TYPE_ICONS with MaterialCommunityIcons using ViewTypeIcons mapping
- [ ] 8.2 Update `mobile/app/(tabs)/views/index.tsx` marketplace button to use MaterialCommunityIcons store icon instead of 🏪 emoji
- [ ] 8.3 Update `mobile/app/(tabs)/views/index.tsx` "导航栏" badge to ensure minimum height 20dp and font size 11sp
- [ ] 8.4 Update `mobile/app/(tabs)/views/index.tsx` loading state to use SkeletonListItem components instead of centered ActivityIndicator
- [ ] 8.5 Update `mobile/app/(tabs)/views/index.tsx` empty state to use EmptyState component with vector icon

## Task 9: Settings Page Polish

- [ ] 9.1 Update `mobile/app/(tabs)/settings/index.tsx` to add leading MaterialCommunityIcons for each settings menu item (tags, card config, dark mode, password, version)
- [ ] 9.2 Update `mobile/app/(tabs)/settings/index.tsx` to group settings items under labeled section headers ("通用设置", "账户安全", "关于")
- [ ] 9.3 Update `mobile/app/(tabs)/settings/index.tsx` user avatar to use layered-view gradient background instead of flat #f3f0ff
- [ ] 9.4 Update `mobile/app/(tabs)/settings/index.tsx` to replace text arrows (› and →) with MaterialCommunityIcons chevron-right and logout icons

## Task 10: Task Detail Page Polish

- [ ] 10.1 Update `mobile/app/task/[uid].tsx` back button and more menu to use MaterialCommunityIcons (arrow-left, dots-horizontal) with 44×44dp touch targets
- [ ] 10.2 Update `mobile/app/task/[uid].tsx` priority selection buttons to ensure minimum height 44dp and width 48dp
- [ ] 10.3 Update `mobile/app/task/[uid].tsx` tag display to add remove (×) button on each tag pill with 32×32dp touch target
- [ ] 10.4 Update `mobile/components/task/detail/SubtaskList.tsx` to show "添加子任务" prompt button when subtask count is zero instead of "暂无子任务" text
- [ ] 10.5 Update `mobile/components/task/detail/ActivityLog.tsx` to replace ▲/▼ text with MaterialCommunityIcons chevron-up/chevron-down icons
- [ ] 10.6 Update `mobile/app/task/[uid].tsx` status icons (✓ ○) and other Unicode characters to use MaterialCommunityIcons

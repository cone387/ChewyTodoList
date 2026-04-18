# Design Document: Mobile UI Polish

## Overview

This design covers a comprehensive UI/UX polish pass for the ChewyTodoList mobile app (React Native + Expo SDK 54 + Expo Router 6). The changes span six screens (Login, Home, Projects, Views, Settings, Task Detail) and address five systematic issues:

1. **Inconsistent icon system** — emoji/unicode characters replaced with `@expo/vector-icons`
2. **Missing visual polish** — shadows, gradients, glassmorphism effects added
3. **Inadequate touch targets** — all interactive elements brought to 44dp minimum
4. **Broken Expo Web navigation** — tab bar and task card click issues addressed
5. **Inconsistent typography/spacing** — unified via theme constants

The approach is additive — no existing functionality changes, only visual and interaction improvements. All styling uses inline `style` props (not className/NativeWind, which doesn't work on Expo Web).

## Architecture

### Design Decisions

**Icon Library Choice: MaterialCommunityIcons**
We use `MaterialCommunityIcons` from `@expo/vector-icons` as the primary icon family. Rationale:
- Already bundled with Expo (no install needed)
- Largest icon set (~7000 icons) covering all our needs
- Consistent visual weight and style
- `Ionicons` used as fallback only where MaterialCommunityIcons lacks a suitable glyph

**No expo-linear-gradient dependency**
Instead of adding `expo-linear-gradient`, we simulate gradient effects using layered `View` components with different background colors and opacity. This avoids a new dependency and works identically on all platforms. For the login button specifically, we use a two-tone approach with overlapping semi-transparent views.

**Shadow System via Theme Constants**
Shadows are defined as reusable objects in `theme.ts` rather than per-component. This ensures consistency and makes future adjustments trivial.

**Skeleton Loader: Custom Component**
We build a lightweight `SkeletonLoader` component using `Animated` API (already available) with a pulsing opacity animation. No additional library needed.

**Expo Web Tab Navigation Fix**
Expo Router's `<Tabs>` component has a known issue on web where tab presses don't navigate correctly. The fix uses `router.replace()` in a custom `tabBarButton` wrapper that intercepts press events on web platform.

**Task Card Click on Web**
The `TouchableOpacity` `onPress` handler works on web, but the issue is that the `Swipeable` wrapper from `react-native-gesture-handler` intercepts touch events on web. The fix wraps the card in a `Pressable` on web platform, bypassing the gesture handler.

### File Change Summary

| Area | Files Modified | Files Created |
|------|---------------|---------------|
| Theme/Constants | `constants/theme.ts` | — |
| Tab Layout | `app/(tabs)/_layout.tsx` | — |
| Login Page | `app/(auth)/login.tsx` | — |
| Home Page | `app/(tabs)/index.tsx` | — |
| Projects Page | `app/(tabs)/projects/index.tsx` | — |
| Views Page | `app/(tabs)/views/index.tsx` | — |
| Settings Page | `app/(tabs)/settings/index.tsx` | — |
| Task Detail | `app/task/[uid].tsx` | — |
| Task Card | `components/task/TaskCard.tsx`, `TaskCardRenderer.tsx` | — |
| ListView | `components/views/ListView.tsx` | — |
| FAB | `components/ui/FAB.tsx` | — |
| Skeleton Loader | — | `components/ui/SkeletonLoader.tsx` |
| Empty State | — | `components/ui/EmptyState.tsx` |
| Icon Mapping | — | `constants/icons.ts` |
| Subtask List | `components/task/detail/SubtaskList.tsx` | — |
| Activity Log | `components/task/detail/ActivityLog.tsx` | — |

## Components and Interfaces

### 1. Icon Mapping (`constants/icons.ts`)

Centralized icon name constants to avoid magic strings throughout the app.

```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Type for icon names
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Tab bar icons
export const TabIcons: Record<string, IconName> = {
  home: 'home',
  projects: 'folder-multiple',
  views: 'view-dashboard',
  settings: 'account-circle',
};

// View type icons
export const ViewTypeIcons: Record<string, IconName> = {
  list: 'format-list-bulleted',
  board: 'view-column',
  calendar: 'calendar-month',
  table: 'table',
  timeline: 'chart-timeline-variant',
  gallery: 'view-grid',
};

// Task status icons
export const StatusIcons: Record<number, IconName> = {
  0: 'circle-outline',        // unassigned
  1: 'circle-half-full',      // todo
  2: 'check-circle',          // completed
  3: 'close-circle',          // abandoned
};

// Task priority icons
export const PriorityIcons: Record<number, IconName> = {
  0: 'flag-outline',          // low
  1: 'flag',                  // medium
  2: 'flag',                  // high
  3: 'alert-decagram',        // urgent
};

// Settings menu icons
export const SettingsIcons: Record<string, IconName> = {
  tags: 'tag-multiple',
  cardConfig: 'card-text',
  darkMode: 'weather-night',   // toggles to 'white-balance-sunny' when dark
  password: 'lock',
  version: 'information',
};

// Common action icons
export const ActionIcons: Record<string, IconName> = {
  back: 'arrow-left',
  close: 'close',
  more: 'dots-horizontal',
  search: 'magnify',
  add: 'plus',
  delete: 'delete',
  complete: 'check',
  undo: 'undo',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  chevronRight: 'chevron-right',
  store: 'store',
  folder: 'folder',
  clipboard: 'clipboard-text',
  subtask: 'file-tree',
  attachment: 'paperclip',
  calendar: 'calendar',
  user: 'account',
  lock: 'lock',
  eye: 'eye',
  eyeOff: 'eye-off',
  lightning: 'lightning-bolt',
};
```

### 2. Shadow System (added to `constants/theme.ts`)

```typescript
export const Shadows = {
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryMedium: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};
```

### 3. SkeletonLoader Component (`components/ui/SkeletonLoader.tsx`)

```typescript
interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}
```

A simple animated `View` that pulses between opacity 0.3 and 0.7 using `Animated.loop`. Accepts width, height, and borderRadius to approximate the shape of the content it replaces.

Composed variants:
- `SkeletonCard`: Approximates a TaskCard (title bar + two small bars)
- `SkeletonListItem`: Approximates a settings/view list row (icon circle + two text bars)

### 4. EmptyState Component (`components/ui/EmptyState.tsx`)

```typescript
interface EmptyStateProps {
  icon: string;          // MaterialCommunityIcons name
  iconSize?: number;     // default 48
  iconColor?: string;    // default '#d1d5db'
  message: string;       // primary message, 16sp
  description?: string;  // secondary message, 13sp muted
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

Standardized empty state layout used across Home, Projects, Views pages. Replaces ad-hoc emoji + text patterns.

### 5. FAB Updates (`components/ui/FAB.tsx`)

Current FAB uses `className` which doesn't work on Expo Web. Convert to inline styles and apply:
- `position: 'absolute'`, `bottom: 24`, `right: 20`
- `Shadows.primaryMedium` for the shadow
- `MaterialCommunityIcons` for the `+` icon
- Minimum 56×56dp size

### 6. Tab Layout Fix (`app/(tabs)/_layout.tsx`)

Replace emoji `TabIcon` with `MaterialCommunityIcons`. For Expo Web tab navigation fix:

```typescript
// Custom tab bar button that uses router.replace on web
function WebSafeTabButton({ children, onPress, to, ...rest }) {
  if (Platform.OS === 'web') {
    return (
      <Pressable onPress={() => router.replace(to)} {...rest}>
        {children}
      </Pressable>
    );
  }
  return <Pressable onPress={onPress} {...rest}>{children}</Pressable>;
}
```

### 7. ListView Task Card Click Fix

On web, the `Swipeable` wrapper intercepts clicks. Fix by conditionally rendering without `Swipeable` on web:

```typescript
const CardWrapper = Platform.OS === 'web' 
  ? ({ children }) => <View>{children}</View>
  : Swipeable;
```

## Data Models

No data model changes. This feature is purely presentational — all changes are to component rendering, styling, and navigation behavior. The existing `Task`, `Project`, `TaskView`, `TaskCardConfig`, and `CardFieldConfig` types remain unchanged.

## Error Handling

- **Icon fallback**: If a `MaterialCommunityIcons` name is invalid, React Native will show a missing glyph box. The centralized `constants/icons.ts` mapping prevents this by using only verified icon names.
- **Gradient fallback**: Since we avoid `expo-linear-gradient`, there's no dependency that could fail to load. The layered-view gradient approach degrades gracefully to a solid color if views don't render.
- **Skeleton loader timeout**: If data loading takes longer than expected, skeleton loaders continue animating indefinitely until data arrives or an error state is shown. No timeout is added — the existing error handling in data hooks covers failure cases.
- **Platform detection**: All platform-specific code uses `Platform.OS` checks, which is reliable across iOS, Android, and Web.

## Testing Strategy

### Why Property-Based Testing Does Not Apply

This feature is a UI polish pass — it involves icon replacements, style constant changes, shadow additions, layout adjustments, and platform-specific navigation fixes. The changes are:

- **Visual/presentational**: Swapping emoji for vector icons, adding shadows, adjusting padding
- **Configuration-driven**: Icon mappings are static lookup tables with fixed, small domains
- **Platform-specific fixes**: Web navigation workarounds that require E2E testing
- **Style constant definitions**: Shadow objects, typography values

None of these involve data transformations, parsing, serialization, or business logic with meaningful input variation. Property-based testing would not find more bugs than example-based tests for this feature.

### Recommended Testing Approach

**Unit Tests (example-based)**:
- Verify icon mapping completeness: all view types, status values, priority values have entries
- Verify shadow constants have required properties (shadowColor, shadowOffset, etc.)
- Verify SkeletonLoader renders with correct animated opacity
- Verify EmptyState renders icon, message, and optional description

**Snapshot Tests**:
- Render each page component and snapshot to catch unintended visual regressions
- Snapshot the icon mapping objects to catch accidental changes

**Manual Testing / E2E**:
- Tab navigation on Expo Web (critical — automated E2E with Playwright recommended)
- Task card click navigation on Expo Web
- Touch target sizes on physical devices (accessibility audit)
- Visual review of shadows, gradients, and skeleton animations on iOS, Android, and Web

**Accessibility Audit**:
- Verify all interactive elements meet 44dp minimum touch target
- Verify icon elements have appropriate `accessibilityLabel` props

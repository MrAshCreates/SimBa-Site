# Design System

## Compliance

1. Use color and typography tokens from `/app/styles/theme.css` for **all** styling, adapt and modify the theme if required, further instructions below.
2. Use `/app/styles/tokens/*.css` for all other design requirements where the theme does not apply, add new tokens to files if required to.
3. Reuse the existing UI component library unless explicitly overridden.
4. Ensure layouts are fully responsive.
5. **Do not** introduce Tailwind unless the user explicitly asks for them.

## Visual Excellence - Beautiful Web App Guidelines

- Follow these principles to create a visually stunning, user-friendly web application that feels polished, beautiful, and professional.

### Layout & Structure

- Clear visual hierarchy (titles, sections, CTAs stand out)
- Consistent spacing scale (e.g. 4/8/16/24px)
- Balanced whitespace (nothing feels crowded)
- Responsive grid system (mobile => desktop)

### Visual Design

- Cohesive color palette (with defined roles: primary, accent, background, etc.)
- High-quality typography (at least two weights, consistent sizing)
- Unified component styling (buttons, inputs, modals match visually)
- Clean, soft shadows or gradients for depth (optional but elegant)

### Imagery & Iconography

- Consistent icon style (outline vs. filled, same stroke width)
- Well-treated images (same corner radius/aspect ratio)
- Optional textures or decorative elements for character

### UX & Interactions

- Smooth transitions/animations (hover, modal, reorder, load)
- Clear feedback on interaction (clicks, hovers, errors)
- Minimal interface clutter (hide non-essential info until needed)
- Mobile-friendly and keyboard accessible

### Extra Polish

- Microinteractions add delight (e.g. button ripple, loading shimmer)
- Subtle branding or personality (color, tone, motion)
- Feels tactile or `alive` (snappy layout, no jank)
- Fonts and colors meet accessibility standards (e.g. contrast ratios)

### Motion & Fluidity

- Seamless page transitions (fade, slide, zoom - not jarring reloads)
- Element entrance animations (staggered fade-ins, reveals)
- Inertia-based scrolling or drag effects (for carousels, cards, etc.)
- Reduced motion support for accessibility

## Device Adaptability

- Truly responsive, not just resized (some components collapse, adapt, or reorder)
- Touch-friendly hit areas and swipe interactions
- Looks and feels `native` on mobile (e.g. fixed bottom nav, large tap zones)
- Retina/high-DPI support for crisp rendering

## Microcopy & Feedback

- Thoughtful, human-centered microcopy (e.g. empty states, form tips)
- Error states feel helpful, not generic
- Button labels are action-oriented and clear
- Loading states are calm, not jarring (e.g. use skeletons or gentle loaders)

# Media Guidance

- Media-Driven Visuals
  - Enhance UI components and pages using **free, high-quality media** assets (images, backgrounds, illustrations, etc.) where appropriate.
  - Favor content from royalty-free sources like [unsplash.com](https://unsplash.com), [pexels.com](https://www.pexels.com), or [pixabay.com](https://pixabay.com).
  - Always lazy-load large images and use responsive "<img>" patterns or CSS "background-image" techniques to maintain performance.
- Enrichment Use Cases
  - Use background images or subtle textures in hero sections, empty states, and onboarding flows.
  - Include thematic or contextual visuals that reinforce the app's domain (e.g., travel destinations, products, people).
  - Design image-rich layouts for galleries, blog posts, or marketing pages.
- Design Compliance
  - Apply all sizing, spacing, and styling via tokens in "/app/styles/theme.css".
  - Ensure **accessibility**: include "alt" text, maintain adequate contrast, and don't convey critical info through visuals alone.
  - Always adapt media usage to be **fully responsive** - no cropping or overflow at common breakpoints.
- Performance & Ethics
  - Prefer optimized formats (WebP, AVIF) where possible.
  - Do not hotlink images - download and serve them from the app's assets if reuse is expected.
  - Only use media you are licensed to include (never commercial or copyrighted images without permission).

# Style Guide

## Theme (app/styles/theme.css)

- The theme layer applies semantic meaning to the raw color and typography token values. It translates the abstract tokens into concrete design decisions for the application.
- When creating a project for the first time, begin by first modifying the "theme.css" file to set up the initial theme. This will ensure that all components and styles are built on a consistent foundation.:
  - Modify variables in "theme.css" to create a custom theme, but maintain its existing format and structure. Always use these semantic variables throughout the app for consistency.
  - When customizing colors, do your best to stick to available color palette options in "colors.css".
  - If you want to introduce new colors to the theme, first add a new color palette to "colors.css" and then use it via the semantic variables in the "theme.css" file.
  - Do not introduce completely new theming conventions or structures; instead, extend or modify the existing ones.

### Typography

- Semantic typography styles (e.g., heading levels, body text, captions) built from typography tokens.
- **Typography Tokens:**
  - `--font-display` - Large display text using Playfair Display with fluid sizing
  - `--font-heading` - Section headings using Playfair Display
  - `--font-subheading` - Medium weight Inter for subheadings
  - `--font-body` - Standard body text using Inter with fluid sizing
  - `--font-caption` - Small caption text using Inter
  - `--font-code` - Monospace font for code blocks

### Colors

- **Palette Scale to Semantic**: Maps the color token palettes to semantic roles within the application.
  - Full palette variants are used to style most of the UI in an application
  - **Default Available Variants**:
    - **Base**: The primary color palette for the application, based on different hues of gray.
    - **Accent**: The accent color palette used for highlighting and calls to action.
  - **Full Semantic Color Properties**:
    - `--color-VARIANT-bg-app: var(--COLOR-1)` - App background
    - `--color-VARIANT-bg-subtle: var(--COLOR-2)` - Subtle UI background
    - `--color-VARIANT-bg: var(--COLOR-3)` - UI element background
    - `--color-VARIANT-bg-hover: var(--COLOR-4)` - Hovered UI element background
    - `--color-VARIANT-bg-active: var(--COLOR-5)` - Active / Selected UI element background
    - `--color-VARIANT-border-subtle: var(--COLOR-6)` - Subtle borders and separators
    - `--color-VARIANT-border: var(--COLOR-7)` - UI element border and focus rings
    - `--color-VARIANT-border-hover: var(--COLOR-8)` - Hovered UI element border
    - `--color-VARIANT-text-muted: var(--COLOR-9)` - Muted text
    - `--color-VARIANT-text-subtle: var(--COLOR-10)` - Subtle text
    - `--color-VARIANT-text: var(--COLOR-11)` - Normal text
    - `--color-VARIANT-text-strong: var(--COLOR-12)` - High contrast text
- **Partial Semantic Variants**: Predefined semantic color variations for highlighting special or important UI elements.
  - New semantic variants can be added as the system evolves.
  - **Default Available Variants**:
    - "pop": For elements that need to stand out.
    - "danger": For error states, warnings, or destructive actions.
    - "success": For success states or positive feedback.
  - **Partial Semantic Color Properties**:
    - `--color-VARIANT-bg: var(--COLOR-9)` - The highest chroma, used for highlights.
    - `--color-VARIANT-bg-hover: var(--COLOR-10)` - The second highest chroma, used for hover effects.
    - `--color-VARIANT-text: var(--COLOR-13)` - Provides contrasting white or black text color against backgrounds.
- **Color Scheme**: Defines how colors are applied in different display modes.
- **Light**: Theme for light mode should be mapped to `--COLOR-*` tokens
- **Dark**: Theme for dark mode should be mapped to `--dark-COLOR-*` tokens.

## Color Scheme

- The color scheme system automatically toggles the HTML root element's class between `light-theme` and `dark-theme` based on the user preference and system defaults.
- Semantic color tokens are applied automatically according to the active theme.
- **Do not** use the `prefers-color-scheme` media query directly in your CSS. Instead, conditionally style elements using only the root html `light-theme` and `dark-theme` classes when necessary. Make sure to use `:global(.light-theme)` and `:global(.dark-theme)` when in `*.module.css` files!
- To enable user-controlled theme switching, use the `<ColorSchemeToggle />` from `~/components/ui/color-scheme-toggle/color-scheme-toggle` React component or the `useColorScheme` hook from `@dazl/color-scheme/react`. Both allow toggling between light, dark, and system modes.

## Tokens

Tokens are the foundational building blocks of the design system. They represent the raw values for various design properties.

### Animations (app/styles/tokens/animations.css)

- Defines comprehensive animation tokens including easing functions, pre-built animations, and keyframe declarations.
- Provides smooth, natural motion with physics-based easing curves and accessibility considerations.

**Easing Function Tokens:**

- `--ease-1` through `--ease-5` - General purpose easing curves from gentle to sharp
- `--ease-in-1` through `--ease-in-5` - Accelerating curves for entry animations
- `--ease-out-1` through `--ease-out-5` - Decelerating curves for exit animations
- `--ease-in-out-1` through `--ease-in-out-5` - S-curve easing for smooth transitions
- `--ease-elastic-1` through `--ease-elastic-5` - Elastic bounce effects (aliases for elastic-out)
- `--ease-elastic-in-1` through `--ease-elastic-in-5` - Elastic entry animations
- `--ease-elastic-out-1` through `--ease-elastic-out-5` - Elastic exit animations
- `--ease-elastic-in-out-1` through `--ease-elastic-in-out-5` - Bidirectional elastic easing
- `--ease-squish-1` through `--ease-squish-5` - Squash and stretch effects
- `--ease-spring-1` through `--ease-spring-5` - Physics-based spring animations using linear() function
- `--ease-bounce-1` through `--ease-bounce-5` - Natural bounce effects with varying intensity
- `--ease-step-1` through `--ease-step-5` - Stepped animations (2, 3, 4, 7, 10 steps)

**Pre-built Animation Tokens:**

- `--animation-fade-in/out` - Basic opacity transitions with bloom variants
- `--animation-scale-up/down` - Size scaling animations
- `--animation-slide-in/out-[direction]` - Directional slide transitions (up, down, left, right)
- `--animation-shake-[axis]` - Attention-grabbing shake effects (x, y, z rotation)
- `--animation-spin` - Continuous rotation
- `--animation-ping` - Radar-like expanding pulse
- `--animation-blink` - Opacity blinking
- `--animation-float` - Gentle vertical floating
- `--animation-bounce` - Bouncing motion
- `--animation-pulse` - Scale pulsing effect

**Keyframe Animations:**

- All animations include corresponding `@keyframes` declarations
- Dark mode adaptations for bloom effects (reduced brightness)
- Infinite animations for continuous effects (spin, ping, blink, float, bounce, pulse)

### Colors (app/styles/tokens/colors.css)

- **Base Grays & Color Pairings**: Includes foundational gray scales and predefined color pairings.
  - These should ideally not be changed to maintain consistency.
  - New palettes can be added as needed.
  - **Neutral Pairing**: "gray" works well with any hue if you want a simple, neutral vibe.
  - **Natural Pairing**: For a more harmonious and colorful feel, choose a gray scale that is saturated with a hue closest to your primary accent color.
    - "mauve" pairs well with: tomato, red, ruby, crimson, pink, plum, purple, violet.
    - "slate" pairs well with: iris, indigo, blue, sky, cyan.
    - "sage" pairs well with: mint, teal, jade, green.
    - "olive" pairs well with: grass, lime.
    - "sand" pairs well with: yellow, amber, orange, brown.

### Decorations (app/styles/tokens/decorations.css)

- Defines visual decoration tokens for gradients, noise patterns, shadows, borders, and border radius.
- Includes 30 predefined gradients with automatic color space optimization for modern browsers.

**Gradient Tokens:**

- `--gradient-1` through `--gradient-30` - Various linear, radial, and conic gradients
- `--gradient-space` - Automatically uses `in oklab` color space when supported for smoother transitions
- Use for backgrounds, overlays, and visual effects

**Noise Pattern Tokens:**

- `--noise-1` through `--noise-5` - SVG-based fractal noise patterns with varying frequencies
- `--noise-filter-1` through `--noise-filter-5` - Corresponding contrast/brightness filters
- Use for texture overlays and visual grain effects

**Shadow Tokens:**

- `--shadow-1` through `--shadow-6` - Progressive box shadow depths
- `--inner-shadow-0` through `--inner-shadow-4` - Inset shadows with highlight effects
- `--shadow-color` and `--shadow-strength` - Configurable shadow base values
- Automatically adjusts for dark mode with increased strength and different color

**Border Radius Tokens:**

- `--radius-1: 2px` through `--radius-6: 12px` - Standard corner radius
- `--radius-drawn-1` through `--radius-drawn-6` - Hand-drawn style irregular corners
- `--radius-blob-1` through `--radius-blob-5` - Organic blob-like shapes
- `--radius-conditional-1` through `--radius-conditional-6` - Responsive radius based on viewport
- `--radius-round: 1e5px` - Perfect circle/pill shape

**Border Size Tokens:**

- `--border-size-1: 1px` through `--border-size-5: 25px` - Standard border widths

### Sizes (app/styles/tokens/sizes.css)

- Defines standard sizing units for elements, components, and layout (e.g. icons).
- Should NOT be used for font sizes or spacings, which have their own dedicated tokens.

**Content Size Tokens:**

- `--size-1: 8px` through `--size-48: 384px`
- Available sizes: 1, 1-5, 2, 2-5, 3, 4, 5, 6, 8, 12, 16, 20, 24, 32, 40, 48
- Use for width, height, icon sizes, component dimensions

**Z-Index Layer Tokens:**

- `--layer-1: 1` through `--layer-5: 5` - Standard layering
- `--layer-important: 2147483647` - Maximum z-index for critical overlays

**Aspect Ratio Tokens:**

- `--ratio-square: 1` - 1:1 ratio
- `--ratio-landscape: 4/3` - Landscape orientation
- `--ratio-portrait: 3/4` - Portrait orientation
- `--ratio-widescreen: 16/9` - Widescreen format
- `--ratio-ultrawide: 18/5` - Ultra-wide format

### Spacings (app/styles/tokens/spacings.css)

- Defines standard spacing units for margins, paddings, and layout gaps.
- Should NOT be used for font sizes or UI elements, which have their own dedicated tokens.

**Available spacing tokens:**

- `--space-0-25: 2px`
- `--space-0-5: 4px`
- `--space-1: 8px`
- `--space-1-5: 12px`
- `--space-2: 16px`
- `--space-2-5: 20px`
- `--space-3: 24px`
- `--space-4: 32px`
- `--space-5: 40px`
- `--space-6: 48px`
- `--space-8: 64px`
- `--space-12: 96px`

### Typography (app/styles/tokens/typography.css)

- Defines comprehensive typography tokens including font families, weights, sizes, line heights, and letter spacing.
- Provides system-optimized font stacks with fallbacks for cross-platform compatibility.
- When needing to add new fonts:
  - If a new font stylesheet from google fonts is needed, adjust the `links` export in `app/root.tsx`
  - Adjust existing semantic css font variables in `app/styles/tokens/typography.css`, or add new ones. Make use of these variables in the `app/styles/theme.css` file.
  - Do NOT create new css variables in `typography.css` that already exist in `theme.css`!

**Font Family Tokens:**

- `--font-system-ui` - Modern system UI fonts (system-ui, -apple-system, Segoe UI, Roboto, etc.)
- `--font-transitional` - Transitional serif fonts (Charter, Bitstream Charter, Cambria)
- `--font-old-style` - Classical serif fonts (Iowan Old Style, Palatino Linotype)
- `--font-humanist` - Humanist sans-serif fonts (Seravek, Gill Sans Nova, Ubuntu)
- `--font-geometric-humanist` - Geometric humanist fonts (Avenir, Montserrat, Corbel)
- `--font-neo-grotesque` - Modern grotesque fonts (Inter, Roboto, Helvetica Neue)
- `--font-monospace-code` - Code-optimized monospace fonts (Dank Mono, Operator Mono, Fira Mono)
- `--font-industrial` - Condensed industrial fonts (Bahnschrift, DIN Alternate)
- `--font-rounded-sans` - Friendly rounded fonts (ui-rounded, Quicksand, Comfortaa)
- `--font-slab-serif` - Slab serif fonts (Rockwell, Roboto Slab)
- `--font-handwritten` - Casual handwritten fonts (Segoe Print, Bradley Hand)
- `--font-sans`, `--font-serif`, `--font-mono` - Primary font aliases

**Font Weight Tokens:**

- `--font-weight-1: 100` through `--font-weight-9: 900` - Complete weight scale from thin to black

**Line Height Tokens:**

- `--font-lineheight-00: 0.95` through `--font-lineheight-5: 2` - Tight to loose line spacing
- Use `00` and `0` for tight headings, `3-5` for body text

**Letter Spacing Tokens:**

- `--font-letterspacing-0: -0.05em` (tight) through `--font-letterspacing-7: 1em` (very loose)
- Negative values for tighter spacing, positive for looser spacing

**Font Size Tokens:**

- `--font-size-00: 0.5rem` through `--font-size-8: 3.5rem` - Fixed size scale
- `--font-size-fluid-0` through `--font-size-fluid-3` - Responsive sizes using clamp() for fluid typography

### Utils (app/styles/tokens/utils.css)

- **sr-only**: Utility classes for screen-reader-only content.

## Best Practices

- Avoid using inline styles in any component, instead prefer to write CSS in each component's CSS modules file (e.g. "my-comp.module.css").
- **Always use semantic variables** from "theme.css" in your component styles whenever possible (e.g., "var(--color-base-text)" instead of "var(--slate-11)"). This ensures consistency, makes future theme updates easier, and correctly supports features like automatic dark mode.
- Only fall back to raw tokens from the "app/styles/tokens/" directory in rare, specific cases where a semantic variable truly doesn't fit the use case. If you find yourself doing this often, consider whether a new semantic variable should be added to "theme.css".
- Keep the "prefers-color-scheme: dark" media query in "theme.css" as the single source of truth for dark mode adjustments.
- Ensure any new UI components you create respect these theme variables.
- Prefer using modern CSS features like CSS Grid and Flexbox for layout, as they work well with the design system's responsive principles.

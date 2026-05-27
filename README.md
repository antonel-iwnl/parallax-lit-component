# ParallaxHero Web Component

The `ParallaxHero` is a custom Web Component built using [Lit](https://lit.dev/). It encapsulates a dynamic, mouse-tracking background parallax effect originally created (by me) in the NavigoLearn repository (in React), making it reusable across any web framework (or vanilla HTML).

## Installation & Setup

1. Make sure you have the Lit library installed in your project:
   ```bash
   npm install lit
   ```

2. If you are importing this specifically into a React application, you will also need the `@lit/react` wrapper to seamlessly pass events and props:
   ```bash
   npm install @lit/react
   ```

## How It Works

The component uses an internal `requestAnimationFrame` loop that runs independently of your application's main framework render cycle. It performs two main animations:
1. **Floating Nodes:** A vertical oscillating animation (using a precomputed sine wave table for performance) is applied to individual background rectangles. 
2. **Mouse Parallax:** The component listens to the global `mousemove` event. It tracks the distance of the mouse relative to the screen center and applies a linear interpolation (`lerp`) to gently shift the entire `<g>` (group) of rectangles based on the cursor's position.

Because it inherits from `LitElement`, it leverages an efficient Shadow DOM update mechanism, selectively re-rendering only the attributes (like transforms and coordinates) that change on every frame.

## How to Utilize It

### In Vanilla HTML or other Frameworks
Simply import the definition script, and use the custom element tag `<parallax-hero>` anywhere in your markup:

```html
<script type="module" src="./path/to/ParallaxHero.ts"></script>

<body>
  <!-- The component has absolute positioning and takes up 100vw/100vh by default -->
  <parallax-hero></parallax-hero>
  
  <div style="position: relative; z-index: 10;">
    <h1>My Website Content</h1>
  </div>
</body>
```

### In a React Application
React requires a wrapper to perfectly interoperate with Custom Elements (especially regarding synthetic events).

At the bottom of `ParallaxHero.ts`, you can uncomment or use the `@lit/react` wrapper:

```tsx
import React from 'react';
import { createComponent } from '@lit/react';
import { ParallaxHero } from './ParallaxHero';

export const ParallaxHeroReact = createComponent({
  tagName: 'parallax-hero',
  elementClass: ParallaxHero,
  react: React,
});
```

Then, import the wrapped component into your React tree:

```tsx
import { ParallaxHeroReact } from './path/to/ParallaxHero';

function App() {
  return (
    <div style={{ position: 'relative' }}>
      <ParallaxHeroReact />
      <main style={{ position: 'relative', zIndex: 10 }}>
        <h1>Welcome to my React App</h1>
      </main>
    </div>
  );
}

export default App;
```

## How to Customize

You can customize the appearance and behavior directly within `ParallaxHero.ts`:

### 1. Modifying the Shapes and Colors
Inside the `render()` method, look for the mapped nodes:
```js
<rect
  x="${node.targetX}"
  y="${node.currentY}"
  width="96"  /* Change width */
  height="32" /* Change height */
  rx="4"      /* Border radius */
  ry="4"      /* Border radius */
  class="parallax-node"
></rect>
```
To change the color, update the static CSS styles defined at the top of the class:
```css
rect.parallax-node {
  fill: white;          /* Change fill color */
  stroke: #94a3b8;      /* Change border color */
  stroke-width: 2px;
}
```

### 2. Changing the Background Gradients
The SVG uses `<radialGradient>` and `<linearGradient>` applied to a mask to create a fade-out effect around the edges. To change these, edit the `<defs>` and `<mask id="mask">` section inside the `render()` function. 
You can also change the core background color within the `:host` CSS block (`background-color: white;`).

### 3. Adjusting Node Generation & Density
You can control how many nodes are generated and how far apart they are by tweaking the constants at the top of `ParallaxHero.ts`:
```typescript
const SPACING_X = 250;      // Distance between nodes horizontally
const SPACING_Y = 300;      // Distance between nodes vertically
const RANDOM_OFFSET = 0.7;  // How much randomness in their placement
```

### 4. Adjusting Animation Speeds
- **Floating intensity:** In `startAnimation()`, change the `floatingEffect` variable (currently `25`).
- **Mouse tracking speed:** Modify the denominator in the distance calculations:
  ```typescript
  // Increase 12 to make the mouse tracking effect more subtle, or decrease to make it more pronounced.
  this.viewCoords = {
    x: lerp(this.viewCoords.x, DISTANCE_X / 12, 0.2),
    y: lerp(this.viewCoords.y, DISTANCE_Y / 12, 0.2),
  };
  ```

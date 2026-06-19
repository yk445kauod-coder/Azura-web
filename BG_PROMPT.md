# Menu Background Prompt

## Task
Style the background of TikTok-style vertical scroll menu items.

## Requirements

### Background Image Treatment
1. **Image Layer**: Show menu item image as full-screen background
2. **Blur Effect**: Apply `blur-xl` (24px) to background image
3. **Scale Up**: Use `scale-110` to fill edges after blur

### Dark Shading Overlay
1. **Base Overlay**: `bg-black/60` - 60% black overlay on entire screen
2. **Top Gradient**: `bg-gradient-to-t from-black via-black/50 to-transparent` 
   - Dark at top, fading to transparent
3. **Bottom Gradient**: `bg-gradient-to-b from-black/50 via-black/30 to-transparent`
   - Dark at bottom for nav bar contrast

### Visual Hierarchy
```
[Full Screen Background]
  └── [Blurred Image (blur-xl, scale-110)]
  └── [Black Overlay 60%]
  └── [Top Dark Gradient]
  └── [Bottom Dark Gradient]
  └── [Content Layer - Item image, text, buttons]
```

### Tailwind Classes
```jsx
<div className="absolute inset-0">
  <img 
    src={item.image} 
    className="w-full h-full object-cover blur-xl scale-110"
  />
  <div className="absolute inset-0 bg-black/60" />
  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
</div>
```

### Fallback (No Image)
When no image available, use category gradient:
```jsx
<div className={`absolute inset-0 bg-gradient-to-br ${CAT_THEMES[category].bg}`}>
  <Particles /> {/* Animated floating emojis */}
</div>
```

## Key Points
- NOT fully black - image should be slightly visible through blur
- NOT too bright - 60%+ black overlay keeps text readable
- Smooth gradients for professional look
- Content always readable over shaded background

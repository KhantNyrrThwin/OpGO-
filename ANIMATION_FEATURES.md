# Simple GSAP Animations for Flags and Registers

## Overview
This document describes the simple, subtle animation system implemented for the 8085 microprocessor simulator's flags and registers display using GSAP.

## Animation Philosophy
- **Subtle and Professional**: Animations are designed to be noticeable but not overwhelming
- **Performance Focused**: Using GSAP for smooth, optimized animations
- **User Experience**: Clear visual feedback without distraction

## Flag Animations

### Visual Effects
- **Gentle Scale**: Flags scale up to 105% when values change
- **Smooth Timing**: 300ms duration with power2.out easing
- **Yoyo Effect**: Scale up then back down for natural feel

### Animation Details
- Duration: 300ms
- Easing: power2.out (smooth deceleration)
- Scale: 1.05x (5% increase)
- Yoyo: true (returns to original size)
- Repeat: 1 (plays once forward, once backward)

### Code Example
```typescript
gsap.to(flagRef.current, {
  scale: 1.05,
  duration: 0.3,
  ease: "power2.out",
  yoyo: true,
  repeat: 1
})
```

## Register Animations

### Visual Effects
- **Subtle Scale**: Registers scale up to 102% when values change
- **Quick Response**: 200ms duration for immediate feedback
- **Smooth Transitions**: power2.out easing for natural movement

### Animation Details
- Duration: 200ms
- Easing: power2.out
- Scale: 1.02x (2% increase)
- Yoyo: true
- Repeat: 1

### Code Example
```typescript
gsap.to(registerRef.current, {
  scale: 1.02,
  duration: 0.2,
  ease: "power2.out",
  yoyo: true,
  repeat: 1
})
```

## Additional Enhancements

### Hover Effects
- **Input Fields**: Subtle background color change on hover
- **Transition Duration**: 200ms for smooth color changes
- **Hover State**: `hover:bg-white/10` for subtle feedback

### Color Transitions
- **Smooth Changes**: All color transitions use 200ms duration
- **Consistent Timing**: Uniform transition speeds across components

## Performance Features

### GSAP Benefits
- **Hardware Acceleration**: Optimized for smooth performance
- **Memory Efficient**: Minimal memory footprint
- **Browser Optimized**: Works seamlessly across all modern browsers

### Animation Management
- **Automatic Cleanup**: GSAP handles animation cleanup
- **Efficient Rendering**: Only animates changed elements
- **Smooth Performance**: 60fps animations with minimal CPU usage

## Usage Examples

### Testing Flag Animations
Use the `test-flags.mpc` file to see subtle animations:
```assembly
MVI A, 00H;    ; Triggers zero flag animation
MVI E, 80H;    ; Triggers sign flag animation
```

### Testing Register Animations
Register animations trigger when values change:
```assembly
MOV B, A;      ; Triggers register B animation
MOV C, B;      ; Triggers register C animation
```

## Customization

### Easy Modifications
- **Duration**: Change `duration` values in GSAP calls
- **Scale**: Adjust `scale` values for different effects
- **Easing**: Modify `ease` values for different animation feels

### Example Customizations
```typescript
// Slower animation
duration: 0.5

// Larger scale effect
scale: 1.1

// Different easing
ease: "back.out"
```

## Browser Compatibility
- Modern browsers with ES6+ support
- GSAP handles cross-browser compatibility
- Graceful degradation for older browsers

## Why GSAP?
- **Professional Grade**: Industry standard animation library
- **Performance**: Optimized for smooth animations
- **Flexibility**: Easy to modify and extend
- **Reliability**: Battle-tested in production environments

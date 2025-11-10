/**
 * PostCSS Configuration for Gabriel Family Clinic
 * Integrates Mantine UI and Tailwind CSS processing
 */

module.exports = {
  plugins: {
    // Tailwind CSS
    'tailwindcss': {},
    
    // Autoprefixer for browser compatibility
    'autoprefixer': {},
    
    // Mantine PostCSS preset for component styles
    'postcss-preset-mantine': {
      autoRem: true, // Convert px to rem for better accessibility
      mantineBreakpoints: {
        xs: '36em',   // 576px
        sm: '48em',   // 768px
        md: '62em',   // 992px
        lg: '75em',   // 1200px
        xl: '88em',   // 1408px
      },
    },
    
    // Simple variables for consistent theming
    'postcss-simple-vars': {
      variables: {
        // Colors aligned with clinic branding
        'primary-color': '#3B82F6',     // Blue
        'secondary-color': '#10B981',   // Green
        'error-color': '#EF4444',       // Red
        'warning-color': '#F59E0B',     // Amber
        'info-color': '#0EA5E9',        // Sky
        
        // Spacing for consistency
        'spacing-xs': '0.5rem',
        'spacing-sm': '1rem',
        'spacing-md': '1.5rem',
        'spacing-lg': '2rem',
        'spacing-xl': '3rem',
        
        // Typography
        'font-primary': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-mono': '"JetBrains Mono", "SF Mono", monospace',
        
        // Shadows for depth
        'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        
        // Border radius for consistency
        'radius-sm': '0.25rem',
        'radius-md': '0.5rem',
        'radius-lg': '0.75rem',
        'radius-xl': '1rem',
        'radius-full': '9999px',
        
        // Z-index layers
        'z-dropdown': '1000',
        'z-sticky': '1020',
        'z-fixed': '1030',
        'z-modal-backdrop': '1040',
        'z-modal': '1050',
        'z-popover': '1060',
        'z-tooltip': '1070',
        
        // Transition timing
        'transition-fast': '150ms',
        'transition-base': '250ms',
        'transition-slow': '350ms',
        
        // Breakpoints (matching Mantine)
        'breakpoint-xs': '576px',
        'breakpoint-sm': '768px',
        'breakpoint-md': '992px',
        'breakpoint-lg': '1200px',
        'breakpoint-xl': '1408px',
      },
    },
    
    // CSS Nano for production optimization (conditionally)
    ...(process.env.NODE_ENV === 'production' && {
      'cssnano': {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: true,
            colormin: true,
            convertValues: true,
            calc: true,
            svgo: false, // Let Next.js handle SVG optimization
          },
        ],
      },
    }),
  },
};

# Development Rules: DeePhysio Clinic

## Code Standards
- Use functional React components.
- Use TailwindCSS for styling; avoid inline CSS.
- Maintain a clean folder structure as defined in `STRUCTURE.md`.

## Naming Conventions
- **Components**: PascalCase (e.g., `PatientProfile.jsx`).
- **Variables/Functions**: camelCase (e.g., `patientList`, `handleBooking`).
- **Folders**: lowercase (e.g., `components`, `pages`).

## UI/UX Guidelines
- **Mobile-first**: Ensure all layouts work on small screens first.
- **Shadows**: Use the specific project shadow for consistency.
- **Icons**: Use `react-icons` (FontAwesome/Heroicons).
- **Colors**: Follow the DeePhysio branding (Teal/Dark blue).

## State Management
- Use React Core Hooks (`useState`, `useEffect`, `useContext`, `useReducer`) where appropriate.

## Performance
- Lazy load pages using `React.lazy` and `Suspense`.
- Optimize images and assets.

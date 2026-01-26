# Contributing to AURA

Thank you for your interest in contributing to AURA! This document provides guidelines for contributing to the project.

---

## 🚧 Current Status

**AURA is currently a private project.** Contributions are accepted by **invitation only**.

If you have been invited to contribute, please follow the guidelines below.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Standards

- **Be Respectful**: Treat all contributors with respect and kindness
- **Be Collaborative**: Work together to improve the project
- **Be Professional**: Keep discussions focused and constructive
- **Be Inclusive**: Welcome diverse perspectives and experiences

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling, insulting, or derogatory comments
- Publishing others' private information
- Any conduct inappropriate in a professional setting

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- [x] Node.js 18+ installed
- [x] Git configured
- [x] Access to the private repository
- [x] Firebase project access (if working on backend)
- [x] Read the [README.md](README.md) and [docs/](docs/)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/aura.git
cd aura

# Install dependencies
cd web
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Run development server
npm run dev
```

---

## Development Workflow

### Branch Strategy

We use **Git Flow** model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to remote
git push origin feature/your-feature-name
```

---

## Code Standards

### TypeScript

- **Strict Mode**: Always use TypeScript strict mode
- **No `any`**: Avoid `any` type; use proper typing
- **Interfaces**: Define interfaces for all data structures
- **Naming**: Use descriptive, PascalCase for types/interfaces

```typescript
// ✅ Good
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
}

// ❌ Bad
const data: any = { ... };
```

### React/Next.js

- **Functional Components**: Use function components with hooks
- **File Naming**: PascalCase for components (`UserProfile.tsx`)
- **Props Destructuring**: Destructure props in function signature
- **Hooks Rules**: Follow Rules of Hooks

```tsx
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export default function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### CSS/Tailwind

- **Tailwind First**: Use Tailwind utility classes
- **Custom CSS**: Only when necessary, in component-scoped files
- **Responsive**: Mobile-first approach with `md:`, `lg:` breakpoints
- **Dark Mode**: Support dark theme (already implemented)

### File Organization

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── Modal.tsx
│   └── dashboard/       # Dashboard-specific components
├── context/             # React Context providers
├── services/            # Firestore service functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

---

## Commit Guidelines

We follow **Conventional Commits** specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(tasks): add recurring tasks functionality"

# Bug fix
git commit -m "fix(auth): resolve Google OAuth redirect issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple lines
git commit -m "feat(family): implement soft delete for family groups

- Add deletedAt timestamp
- Create restore functionality
- Update UI with archive button

Closes #123"
```

---

## Pull Request Process

### Before Submitting PR

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Updated documentation (if needed)
- [ ] No console errors or warnings
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests (if applicable)
```

### Review Process

1. Create PR from your feature branch to `develop`
2. Request review from at least one team member
3. Address all review comments
4. Ensure CI passes (if configured)
5. Merge after approval

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- UserProfile.test.tsx

# Generate coverage report
npm test -- --coverage
```

### Writing Tests

```typescript
// Example: Component test
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} />);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Documentation

### When to Update Docs

Update documentation when you:

- Add a new feature
- Change existing functionality
- Add/modify APIs or services
- Update environment variables
- Change build/deployment process

### Documentation Files

- **README.md**: Project overview, getting started
- **docs/API_Documentation.md**: Service functions and APIs
- **docs/Technical_Architecture.md**: System architecture
- **docs/Deployment_Guide.md**: Deployment instructions
- **Code Comments**: Document complex logic inline

### JSDoc Comments

```typescript
/**
 * Creates a new task for the specified user
 * @param userId - The user's unique identifier
 * @param taskData - Task details including title, priority, date
 * @returns Promise resolving to the created task ID
 * @throws Error if user is not authenticated
 */
export async function createTask(
  userId: string,
  taskData: Partial<Task>
): Promise<string> {
  // Implementation...
}
```

---

## Code Review Checklist

### For Reviewers

- [ ] Code follows project conventions
- [ ] Logic is clear and well-commented
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Tests are comprehensive
- [ ] Documentation updated
- [ ] No unnecessary dependencies added
- [ ] Error handling is proper

### For Contributors

- [ ] Responded to all review comments
- [ ] Made requested changes
- [ ] Re-tested after changes
- [ ] Resolved merge conflicts (if any)

---

## Questions?

If you have questions about contributing:

1. Check [documentation](docs/)
2. Ask in team discussions
3. Contact the project maintainer

---

## Recognition

Contributors will be recognized in:

- README.md (Contributors section)
- Release notes
- Project credits

Thank you for contributing to AURA! 🎉

---

**Last Updated:** January 15, 2026

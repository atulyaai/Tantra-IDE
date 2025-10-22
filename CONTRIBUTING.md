# Contributing to Tantra IDE

Thank you for your interest in contributing to Tantra IDE! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

Be respectful, collaborative, and constructive. We welcome contributions from everyone!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Tantra-IDE`
3. Add upstream remote: `git remote add upstream https://github.com/atulyaai/Tantra-IDE`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

See [SETUP.md](./SETUP.md) for detailed setup instructions.

Quick start:
```bash
npm install
npm run dev
```

## Project Structure

```
tantra-ide/
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API and WebSocket services
│   │   ├── stores/        # Zustand state management
│   │   ├── types/         # TypeScript type definitions
│   │   └── hooks/         # Custom React hooks
│   └── package.json
├── backend/               # Express + TypeScript backend
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── tools/        # AI tool implementations
│   │   ├── db/           # Database schemas
│   │   └── prompts/      # AI system prompts
│   └── package.json
└── package.json          # Workspace root
```

## How to Contribute

### Reporting Bugs

1. Check if the bug is already reported in [Issues](https://github.com/atulyaai/Tantra-IDE/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check [ROADMAP.md](./ROADMAP.md) to see if it's already planned
2. Open a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Code Contributions

Areas where you can help:

1. **Core Features**: Implement features from the roadmap
2. **AI Tools**: Add new AI capabilities
3. **Integrations**: Connect to more services (APIs, platforms)
4. **Documentation**: Improve docs and tutorials
5. **Testing**: Add tests for existing features
6. **UI/UX**: Improve design and user experience
7. **Performance**: Optimize code and reduce bundle size
8. **Bug Fixes**: Fix reported bugs

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Export types from `frontend/src/types/index.ts`

### React

- Use functional components with hooks
- Keep components small and focused
- Use Zustand for global state
- Use React Query for server state

### Code Style

- Use Prettier for formatting (automatic)
- Use ESLint rules (automatic)
- Follow existing code patterns
- Add comments for complex logic

### Naming Conventions

- Files: `camelCase.ts` or `PascalCase.tsx` for components
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

### Git Commits

Follow conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi colons, etc
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

Examples:
```
feat(editor): add inline code completion
fix(terminal): resolve terminal resize issue
docs(readme): update installation instructions
```

## Testing

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## Submitting Changes

1. **Ensure code quality**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Pull latest changes**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**:
   - Go to GitHub and create a PR
   - Fill in the template
   - Link related issues
   - Wait for review

### PR Guidelines

- **Title**: Clear, descriptive title
- **Description**: Explain what and why
- **Screenshots**: If UI changes
- **Tests**: Add tests if applicable
- **Documentation**: Update docs if needed
- **Breaking Changes**: Clearly note if any

### PR Review Process

1. Automated checks must pass (linting, tests)
2. At least one maintainer approval required
3. Address review comments
4. Squash commits if requested
5. Maintainer will merge when ready

## Development Workflow

### Adding a New Feature

1. **Plan**: Check roadmap, discuss in issues
2. **Branch**: Create feature branch
3. **Code**: Implement feature
4. **Test**: Add tests
5. **Document**: Update docs
6. **Submit**: Create PR

### Adding a New AI Tool

1. **Backend**: Create tool in `backend/src/tools/`
2. **Type**: Add type definition
3. **Register**: Add to tool list
4. **Frontend**: Update UI if needed
5. **Test**: Test tool execution

### Adding a New Route

1. **Backend**: Create route in `backend/src/routes/`
2. **Service**: Implement logic in `backend/src/services/`
3. **Frontend**: Add API call in `frontend/src/services/api.ts`
4. **Type**: Define request/response types
5. **Test**: Test the endpoint

## Resources

- **Documentation**: [README.md](./README.md)
- **Setup Guide**: [SETUP.md](./SETUP.md)
- **Roadmap**: [ROADMAP.md](./ROADMAP.md)
- **Issues**: https://github.com/atulyaai/Tantra-IDE/issues
- **Discussions**: https://github.com/atulyaai/Tantra-IDE/discussions

## Questions?

- **GitHub Discussions**: Ask questions
- **Issues**: Report bugs or request features
- **Email**: contact@tantra-ide.dev

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Tantra IDE! 🙏**


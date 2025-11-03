# Contributing to FanPulse

Thank you for your interest in contributing to FanPulse! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/FanPulse.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Setup

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup instructions.

## Code Style

### Backend (Python)
- Follow PEP 8 guidelines
- Use type hints
- Use Black for formatting: `make lint-backend`
- Maximum line length: 100 characters

### Frontend (TypeScript)
- Follow TypeScript best practices
- Use ESLint: `make lint-frontend`
- Use meaningful component and variable names
- Keep components small and focused

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Maintain or improve code coverage

```bash
# Run backend tests
make test-backend

# Run frontend tests
make test-frontend
```

## Commit Messages

Use clear and meaningful commit messages:

- `feat: Add momentum index calculation`
- `fix: Resolve authentication bug`
- `docs: Update API documentation`
- `test: Add superfan algorithm tests`
- `refactor: Simplify database queries`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update the README.md if needed
5. Request review from maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Questions?

If you have questions, please open an issue or contact the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

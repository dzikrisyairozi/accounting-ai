# AI Slack Bot Research

An intelligent Slack bot that provides AI-powered financial analysis and insights by integrating with QuickBooks data.

## Tech Stack

### Core Technologies
- **Backend**: Node.js with TypeScript
- **Framework**: NestJS (for robust enterprise-grade architecture)
- **Database**: 
  - PostgreSQL (primary database)
  - Redis (caching and rate limiting)
- **ORM**: Prisma (type-safe database access)

### AI & ML Components
- **LLM Hosting**: Fireworks.ai
- **Vector Database**: Pinecone (for RAG implementation)
- **Embeddings**: OpenAI's text-embedding-3-small

### Integrations
- **Slack**: Slack Bolt Framework
- **QuickBooks**: QuickBooks Online API
- **Authentication**: Clerk (for user management and OAuth)

### Infrastructure
- **Hosting**: [TBD]
- **Monitoring**: Sentry
- **CI/CD**: GitHub Actions

## Key Features

- 🤖 AI-powered financial analysis
- 📊 QuickBooks data integration
- 💬 Natural language interaction via Slack
- 📈 P&L analysis and insights
- 🔍 RAG-powered knowledge retrieval
- 🔒 Secure authentication and data handling

## Project Structure

```
src/
├── config/           # Configuration management
├── modules/          # Feature modules
│   ├── slack/       # Slack bot implementation
│   ├── quickbooks/  # QuickBooks integration
│   ├── ai/          # AI/ML components
│   └── analysis/    # Financial analysis logic
├── common/          # Shared utilities and types
└── database/        # Database models and migrations
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Environment Variables

```env
# Slack
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=

# QuickBooks
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=

# AI
FIREWORKS_API_KEY=
OPENAI_API_KEY=

# Database
DATABASE_URL=
REDIS_URL=

# Vector Database
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
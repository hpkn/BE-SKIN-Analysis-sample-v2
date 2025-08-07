# BE-SKIN-Analysis-sample-v2

A high-performance skin analysis backend service built with NestJS, providing comprehensive image analysis capabilities for skin health assessment.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This backend service provides advanced skin analysis functionality through REST APIs. It processes skin images and generates detailed analysis reports covering multiple skin health metrics including moisture levels, sebum, pores, sensitivity, skin tone, wrinkles, and more.

## ✨ Features

### Core Analysis Capabilities
- **Moisture Analysis** - T-zone and U-zone moisture level detection
- **Sebum Analysis** - Oil level measurement for T-zone and U-zone
- **Pore Detection** - Pore size and visibility analysis
- **Skin Tone Analysis** - Including Fitzpatrick scale and Dior tone matching
- **Wrinkle Detection** - Fine lines and wrinkle depth analysis
- **Sensitivity Assessment** - Redness, scaling, and scabs detection
- **Spot Analysis** - Dark spots and pigmentation detection
- **Porphyrin Detection** - Bacterial activity indicators
- **Keratin Analysis** - Dead skin cell accumulation
- **Shine Detection** - Oiliness and shine levels

### Technical Features
- **Batch Processing** - Analyze multiple images simultaneously
- **Async Processing** - Queue-based analysis with Bull/Redis
- **File Upload Support** - AWS S3 integration for image storage
- **Customer History** - Track analysis history per customer
- **API Key Authentication** - Secure API access control
- **Comprehensive Logging** - Winston-based logging with rotation
- **Error Handling** - Robust exception handling and recovery
- **API Documentation** - Interactive Swagger UI

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v9.0
- **Runtime**: Node.js v18+
- **Language**: TypeScript v4.7
- **Database**: PostgreSQL with TypeORM
- **Queue**: Bull with Redis
- **Message Broker**: Celery integration
- **Storage**: AWS S3
- **Authentication**: Passport.js with API Key strategy
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston with daily rotation
- **Testing**: Jest

## 📦 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 13
- Redis >= 6.x
- AWS Account (for S3 storage)
- Python >= 3.8 (for Celery workers)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chowis-Co-BE/BE-SKIN-Analysis-sample-v2.git
   cd BE-SKIN-Analysis-sample-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Run migrations
   node run-migration.cjs
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=skin_analysis

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=skin-analysis-images

# API Security
API_KEY=your_api_key

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

## 🏃 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Debug Mode
```bash
npm run start:debug
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Using PM2 (Production)
```bash
pm2 start dist/main.js --name skin-analysis
```

## 📚 API Documentation

Once the application is running, access the interactive API documentation:

- Swagger UI: `http://localhost:3000/api`
- API Details: `http://localhost:3000/api-details.html`

### Key Endpoints

- `POST /analysis/algo` - Submit image for analysis
- `GET /analysis/web-result/:id` - Get analysis results
- `POST /analysis/batch` - Batch analysis submission
- `GET /customer/history` - Get customer analysis history
- `GET /images/:id` - Retrieve processed images

## 📁 Project Structure

```
src/
├── app.module.ts           # Root application module
├── main.ts                 # Application entry point
├── common/                 # Shared resources
│   ├── Dto/               # Data transfer objects
│   ├── FileUpload/        # File upload utilities
│   ├── exceptions/        # Exception handlers
│   ├── interfaces/        # TypeScript interfaces
│   └── middleWare/        # Custom middleware
├── config/                 # Configuration modules
│   ├── Logger/            # Logger configuration
│   └── swagger/           # Swagger setup
├── database/              # Database configuration
├── modules/               # Feature modules
│   ├── algorithms/        # Analysis algorithms
│   │   ├── moistureT/
│   │   ├── moistureU/
│   │   ├── sebumT/
│   │   ├── sebumU/
│   │   ├── pores/
│   │   ├── spots/
│   │   ├── wrinkles/
│   │   ├── skinTone/
│   │   └── ...
│   ├── analysis/          # Analysis processing
│   ├── customer/          # Customer management
│   ├── history/           # History tracking
│   └── images/            # Image management
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the application |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint and fix code issues |
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with hot reload |
| `npm run start:debug` | Start with debugger attached |
| `npm run start:prod` | Start production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Generate test coverage report |

## 🚢 Deployment

### Heroku Deployment

The project includes a `Procfile` for Heroku deployment:

```bash
git push heroku main
```

### Docker Deployment

```bash
# Build Docker image
docker build -t skin-analysis .

# Run container
docker run -p 3000:3000 skin-analysis
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `npm run format` before committing
- Ensure all tests pass
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Chowis Co. Backend Team

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Skin analysis algorithms powered by proprietary technology

---

For more information, please contact the development team.
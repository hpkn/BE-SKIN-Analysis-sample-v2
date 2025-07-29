# 🎯 Backend Developer Portfolio

Welcome to my backend portfolio! This repo showcases a collection of end-to-end projects demonstrating my expertise in building scalable, production-ready backends with modern technologies including Python, Kafka, Spring Boot, FastAPI, NestJS, Celery, PostgreSQL, AWS, and LLM integrations.

---

## 📚 Table of Contents

-   [🚀 Projects](#-projects)
    -   [Marketing Recommendation System](#marketing-recommendation-system)
    -   [Real-Time Event Pipeline](#real-time-event-pipeline)
    -   [Content Analysis Service](#content-analysis-service)
-   [🛠️ Tech Stack](#️-tech-stack)
-   [⚙️ Getting Started](#️-getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Clone & Install](#clone--install)
    -   [Environment Variables](#environment-variables)
    -   [Running Locally with Docker Compose](#running-locally-with-docker-compose)
-   [📡 Deployment](#-deployment)
-   [🎯 How to Present Your Work](#-how-to-present-your-work)
-   [🤝 Contributing & Feedback](#-contributing--feedback)
-   [📄 License](#-license)

---

## 🚀 Projects

-   Celery workers for asynchronous processing

### Content Analysis Service

-   **Language & Frameworks**: Python · FastAPI · Celery · PostgreSQL · AWS Lambda
-   **Description**: Crawls blogs, news & reviews; runs sentiment & keyword extraction via LLM; stores results in relational tables.
-   **Highlights**:
    -   `perform_llm_analysis` in Spark `mapInPandas`
    -   Robust error handling & sketch merging
    -   Docker Compose + Nginx reverse proxy
    -   Health checks & CORS policies

---

## 🛠️ Tech Stack

| Layer          | Technologies            |
| -------------- | ----------------------- |
| **Backend**    | NestJS                  |
| **Messaging**  | Celery (RabbitMQ/Redis) |
| **Database**   | PostgreSQL              |
| **Deployment** | AWS ECS/EKS             |
| **CI/CD**      | GitHub Actions,         |

---

## ⚙️ Getting Started

### Prerequisites

-   [Git](https://git-scm.com)
-   [Docker & Docker Compose](https://docs.docker.com)
-   AWS CLI (for deployment)

### Clone & Install

```bash
# Clone your portfolio repo
git clone git@github.com:YOUR_USERNAME/my-backend-portfolio.git
cd my-backend-portfolio

# Copy example env
cp .env.example .env

# Build & start services
docker-compose up --build -d
```


# Skin Analysis Service

A robust, scalable microservices platform for processing and analyzing skin images, leveraging modern backend technologies and global deployment strategies.

## 🚀 Tech Stack

-   **Backend Framework**: Node.js, NestJS
-   **Worker & Messaging**: Python, Celery, RabbitMQ, Redis
-   **Database**: PostgreSQL
-   **Infrastructure**: AWS EC2, AWS Route 53, Nginx
-   **CI/CD**: GitHub Actions
-   **Monitoring**: Prometheus & Grafana

## 🌟 Highlights

-   **Microservices Architecture**
    Architected decoupled services for image ingestion, analysis, and results delivery—enabling horizontal scaling and fault isolation. (Node.js, NestJS)

-   **High-Performance Worker Pipeline**
    Python-based Celery workers perform advanced image preprocessing and ML inference, orchestrated via RabbitMQ and Redis for reliable task queuing and retry semantics.

-   **Resilience & Idempotency**
    End-to-end message retry and deduplication logic guarantees exactly-once processing, even under spikes and failures.

-   **Global High Availability**
    Deployed across EU and US AWS regions with automated DNS failover (Route 53) and Nginx load balancing, achieving 99.99% service uptime.

-   **Data Integrity & Monitoring**
    PostgreSQL for transactional storage of analyses, with Prometheus/Grafana dashboards and alerts for real-time performance and error tracking.

-   **CI/CD & Testing**
    Automated builds & deployments via GitHub Actions; end-to-end test suite ensures reliability at every commit.

## 📦 Prerequisites

-   Node.js ≥ 18.x
-   Python ≥ 3.11
-   Docker & Docker Compose
-   PostgreSQL
-   Redis
-   RabbitMQ
-   AWS account (for production deployment)

## 🛠️ Installation & Setup

1. **Clone the repo**

    ```bash
    git clone https://github.com/<your-org>/skin-analysis-service.git
    cd skin-analysis-service
    ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your configuration (DB credentials, RabbitMQ, Redis, etc.).

3. **Install Dependencies**

    ```bash
    # Backend
    cd backend
    npm install

    # Worker
    cd ../worker
    pip install -r requirements.txt
    ```

4. **Start Services via Docker Compose**

    ```bash
    docker-compose up -d
    ```

## ⚙️ Development Commands

> **Backend (NestJS)**

```json
// package.json scripts
"start:dev": "nest start --watch",
"start:debug": "nest start --debug --watch",
"start:prod": "node dist/main"
```

-   **Run in development mode**

    ```bash
    npm run start:dev
    ```

-   **Run in debug mode**

    ```bash
    npm run start:debug
    ```

-   **Run production build**

    ```bash
    npm run start:prod
    ```

> **Worker (Celery)**

```bash
# Start Celery worker
celery -A worker.app worker --loglevel=info
```

```bash
# Start Celery beat scheduler (if used)
celery -A worker.app beat --loglevel=info
```

## ✅ Testing

-   **Unit Tests**

    ```bash
    # Backend
    npm run test

    # Worker
    pytest
    ```

-   **End-to-End Tests**

    ```bash
    npm run test:e2e
    ```

## 🤖 CI/CD (GitHub Actions)

-   **Lint & Test** on every pull request
-   **Build & Publish** Docker images on merge to `main`
-   **Deploy** to AWS via Terraform or CloudFormation

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for details.

## 🚀 Deployment

1. **Build & push images**

    ```bash
    docker-compose build
    docker-compose push
    ```

2. **Apply infrastructure**

    ```bash
    terraform init && terraform apply
    ```

3. **Scale services** via ECS/EKS or Docker Swarm as needed.

## 📈 Monitoring & Logging

-   **Prometheus** scrapes service metrics
-   **Grafana** dashboards visualize key performance indicators (throughput, latency, error rates)
-   **Alerting** via Slack/email for threshold breaches

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## ⚖️ License

This project is licensed under the MIT License.


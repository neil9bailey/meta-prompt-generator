FROM python:3.12-slim

LABEL org.opencontainers.image.title="VendorLogic DIIaC API"
LABEL org.opencontainers.image.description="Decision Intelligence Infrastructure as Code – MPG Engine"
LABEL org.opencontainers.image.vendor="VendorLogic"
LABEL org.opencontainers.image.component="mpg-engine"

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PYTHONPATH=/app
ENV APP_ENV=production

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

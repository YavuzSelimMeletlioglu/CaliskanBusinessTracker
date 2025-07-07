FROM python:3.12.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install --no-cache-dir \
    flask \
    torch \
    torchvision \
    pillow \
    mysql-connector-python \
    numpy \
    scikit-learn \
    pandas \
    gunicorn \
    python-dotenv \
    flask-cors \
    requests

EXPOSE 5001

CMD ["gunicorn", "--reload", "-b", "0.0.0.0:5001", "app:app"]
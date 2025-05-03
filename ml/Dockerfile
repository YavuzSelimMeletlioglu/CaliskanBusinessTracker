FROM python:3.12.9-slim

WORKDIR /app

COPY . .

RUN pip install flask torch torchvision pillow

EXPOSE 5000

CMD ["python", "app.py"]
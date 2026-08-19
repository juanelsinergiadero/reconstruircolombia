# Servicio interno de embeddings (RAG, Fase 1). Modelo local, sin API externa.
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# El modelo (~470MB) se descarga la primera vez que arranca el contenedor y
# se cachea en HF_HOME, que se monta como volumen en docker-compose para no
# volver a descargarlo en cada reinicio.
ENV HF_HOME=/root/.cache/huggingface

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

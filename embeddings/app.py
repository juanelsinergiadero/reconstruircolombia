"""
Servicio interno de embeddings para el modulo RAG (Fase 1).

Modelo: intfloat/multilingual-e5-small (384 dimensiones). Se eligio por su
objetivo de entrenamiento orientado a recuperacion (contrastive retrieval),
a diferencia de los modelos "paraphrase-*" de sentence-transformers que se
entrenan para similitud textual generica (STS). Soporta espanol nativamente
y es liviano (~470MB, 118M parametros), apto para el host compartido de 2
vCPU donde corre este contenedor junto a otros proyectos.

Los modelos e5 requieren prefijar el texto segun su rol:
  - "query: "   para preguntas/consultas de busqueda
  - "passage: " para fragmentos de documento que se indexan

No expuesto a internet: solo alcanzable desde 127.0.0.1 (dev) o la red
interna del compose (otros contenedores del proyecto).
"""

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

MODELO = "intfloat/multilingual-e5-small"

app = FastAPI(title="reconstruircolombia — embeddings")
modelo = SentenceTransformer(MODELO)
dimensiones = modelo.get_sentence_embedding_dimension()

PREFIJOS = {
    "query": "query: ",
    "passage": "passage: ",
}


class PeticionEmbed(BaseModel):
    textos: list[str]
    tipo: str = "passage"  # "query" o "passage"


@app.get("/health")
def health():
    return {"status": "ok", "modelo": MODELO, "dimensiones": dimensiones}


@app.post("/embed")
def embed(peticion: PeticionEmbed):
    prefijo = PREFIJOS.get(peticion.tipo, PREFIJOS["passage"])
    entradas = [prefijo + t for t in peticion.textos]
    vectores = modelo.encode(entradas, normalize_embeddings=True)
    return {
        "embeddings": vectores.tolist(),
        "dimensiones": dimensiones,
        "modelo": MODELO,
    }

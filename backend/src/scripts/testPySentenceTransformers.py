from sentence_transformers import SentenceTransformer
import time

print("Loading SentenceTransformer('all-MiniLM-L6-v2')...", flush=True)
start = time.time()
model = SentenceTransformer('all-MiniLM-L6-v2')
print(f"Model loaded in {time.time() - start:.2f} seconds!", flush=True)

embeddings = model.encode(["Testing AI embedding pipeline", "Kaggle GitHub repository dataset"], normalize_embeddings=True)
print("Embeddings shape:", embeddings.shape)
print("Sample values:", embeddings[0][:5])

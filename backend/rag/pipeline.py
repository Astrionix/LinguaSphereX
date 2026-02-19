import os
import time
try:
    from services import ai_service
    from config import settings
except ImportError:
    from backend.services import ai_service
    from backend.config import settings

class RAGPipeline:
    def __init__(self):
        self.index = None
        self.pc = None
        self.index_name = "linguasphere"
    
    def connect(self):
        if self.index: return
        
        if not settings.PINECONE_API_KEY:
            print("Pinecone API Key missing. RAG disabled.")
            return

        try:
            from pinecone import Pinecone, ServerlessSpec
            self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            
            if settings.PINECONE_INDEX_HOST:
                 print(f"Connecting to Pinecone Host: {settings.PINECONE_INDEX_HOST}")
                 self.index = self.pc.Index(host=settings.PINECONE_INDEX_HOST)
            else:
                # Check if index exists
                try:
                    existing_indexes = [i.name for i in self.pc.list_indexes()]
                    if self.index_name not in existing_indexes:
                        print(f"Creating Pinecone index: {self.index_name}")
                        self.pc.create_index(
                            name=self.index_name,
                            dimension=1024, # multilingual-e5-large output dimension
                            metric="cosine",
                            spec=ServerlessSpec(cloud="aws", region=settings.PINECONE_ENV or "us-east-1")
                        )
                        time.sleep(20) # Wait for initialization
                except Exception as e:
                    print(f"Index check/creation warning: {e}")

                self.index = self.pc.Index(self.index_name)
        except Exception as e:
            print(f"Failed to connect to index: {e}")
            self.index = None

    def chunk_text(self, text, chunk_size=400):
        words = text.split()
        return [
            " ".join(words[i:i+chunk_size])
            for i in range(0, len(words), chunk_size)
        ]

    def upsert_document(self, doc_id, text, metadata=None):
        self.connect()
        if not self.index: return False
        
        chunks = self.chunk_text(text)
        vectors = []
        
        for i, chunk in enumerate(chunks):
            # Prepend "passage: " for E5 models
            embedding_text = f"passage: {chunk}"
            embedding = ai_service.get_embeddings(embedding_text)
            
            # Determine if embedding is list of list or list of float
            if embedding and isinstance(embedding, list):
                if isinstance(embedding[0], list):
                    vector = embedding[0]
                else:
                    vector = embedding
                
                chunk_metadata = metadata.copy() if metadata else {}
                chunk_metadata["text"] = chunk
                chunk_metadata["chunk_index"] = i
                chunk_metadata["parent_id"] = doc_id
                
                # Create unique ID for chunk
                chunk_id = f"{doc_id}_{i}"
                vectors.append((chunk_id, vector, chunk_metadata))
        
        if vectors:
            try:
                # Upsert in batches of 100 if needed, but for now simple upsert
                self.index.upsert(vectors=vectors)
                return True
            except Exception as e:
                print(f"Upsert error: {e}")
                return False
        return False

    def query_context(self, query_text, top_k=3):
        self.connect()
        if not self.index: return []
        
        embedding_text = f"query: {query_text}"
        embedding = ai_service.get_embeddings(embedding_text)
        
        if embedding and isinstance(embedding, list):
            if isinstance(embedding[0], list):
                vector = embedding[0]
            else:
                vector = embedding
                
            results = self.index.query(vector=vector, top_k=top_k, include_metadata=True)
            return [match['metadata']['text'] for match in results['matches'] if 'metadata' in match and 'text' in match['metadata']]
        return []

# Singleton instance
rag = RAGPipeline()

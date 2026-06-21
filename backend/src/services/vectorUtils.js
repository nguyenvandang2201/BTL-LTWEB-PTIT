export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    throw new Error('Hai vector phai la array va co cung so chieu');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function findTopKChunks(queryEmbedding, chunks, k = 3) {
  return chunks
    .map((chunk) => {
      const chunkEmbedding = Array.isArray(chunk.embedding)
        ? chunk.embedding
        : JSON.parse(chunk.embedding);

      return {
        chunk,
        score: cosineSimilarity(queryEmbedding, chunkEmbedding),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

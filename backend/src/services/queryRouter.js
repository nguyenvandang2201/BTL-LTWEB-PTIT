const LCP_THRESHOLD = parseInt(process.env.ROUTER_LCP_THRESHOLD, 10) || 3;

const COMPLEX_KEYWORDS = [
  'so sanh', 'so sánh', 'phan tich', 'phân tích', 'tong hop', 'tổng hợp',
  'danh gia', 'đánh giá', 'giai thich tai sao', 'giải thích tại sao',
  'moi quan he', 'mối quan hệ', 'lien he', 'liên hệ',
  'khac nhau nhu the nao', 'khác nhau như thế nào', 'giong va khac',
  'su khac nhau', 'sự khác nhau', 'khac nhau', 'khác nhau',
  'ưu điểm và nhược điểm', 'uu diem va nhuoc diem', 'tai sao lai', 'tại sao lại',
  'nhu the nao', 'như thế nào', 'trinh bay', 'trình bày', 'co che', 'cơ chế',
  'nguyen ly', 'nguyên lý', 'tong quat', 'tổng quát',
  'compare', 'contrast', 'analyze', 'analyse', 'synthesize', 'evaluate',
  'explain why', 'how does', 'relationship between', 'difference between',
  'advantages and disadvantages', 'pros and cons', 'mechanism', 'overview',
];

const FACTUAL_KEYWORDS = [
  'la gi', 'là gì', 'dinh nghia', 'định nghĩa', 'khai niem', 'khái niệm',
  'khi nao', 'khi nào', 'ai la', 'ai là', 'o dau', 'ở đâu', 'bao nhieu',
  'bao nhiêu', 'co nghia la', 'có nghĩa là', 'thuat ngu', 'thuật ngữ',
  'ky hieu', 'ký hiệu', 'viet tat', 'viết tắt',
  'what is', 'define', 'definition', 'when was', 'who is', 'where is',
  'what does', 'stands for', 'abbreviation', 'notation',
];

export function routeQuery(query) {
  const normalized = String(query || '').toLowerCase().trim();
  let score = 0;

  for (const keyword of COMPLEX_KEYWORDS) {
    if (normalized.includes(keyword)) score += 2;
  }

  for (const keyword of FACTUAL_KEYWORDS) {
    if (normalized.includes(keyword)) score -= 1;
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount > 20) score += 1;
  if (wordCount > 40) score += 1;

  const commaCount = (normalized.match(/,/g) || []).length;
  const conjunctionCount = (normalized.match(/\b(và|va|với|voi|or|and)\b/g) || []).length;
  if (commaCount + conjunctionCount >= 2) score += 1;

  const multiPartSignals = ['ngoai ra', 'ngoài ra', 'ben canh do', 'bên cạnh đó', 'additionally', 'furthermore', 'moreover'];
  for (const signal of multiPartSignals) {
    if (normalized.includes(signal)) score += 1;
  }

  return {
    strategy: score >= LCP_THRESHOLD ? 'LCP' : 'RAG',
    score,
    confidence: Math.abs(score) >= 3 ? 'high' : 'low',
  };
}

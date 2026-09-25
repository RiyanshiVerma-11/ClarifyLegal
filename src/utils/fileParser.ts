/**
 * ClarifyLegal File Ingestion Utility
 * Parses .txt, .md, .rtf, .pdf, and .docx files directly in the browser.
 */

export interface ParsedFileResult {
  fileName: string;
  extension: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  characterCount: number;
  wordCount: number;
  text: string;
  previewSnippet: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parses dropped or uploaded files into clean readable contract text.
 */
export async function parseDocumentFile(file: File): Promise<ParsedFileResult> {
  const fileName = file.name;
  const fileSizeBytes = file.size;
  const fileSizeFormatted = formatFileSize(fileSizeBytes);
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

  let extractedText = '';

  if (ext === '.pdf') {
    extractedText = await parsePdfFile(file);
  } else if (ext === '.docx' || ext === '.doc') {
    extractedText = await parseDocxFile(file);
  } else {
    // Standard text formats (.txt, .md, .rtf, .json, etc.)
    extractedText = await file.text();
  }

  // Clean and sanitize whitespace
  const sanitizedText = sanitizeContractText(extractedText);
  const characterCount = sanitizedText.length;
  const wordCount = sanitizedText.trim() ? sanitizedText.trim().split(/\s+/).length : 0;
  const previewSnippet = sanitizedText.slice(0, 300).trim() + (sanitizedText.length > 300 ? '...' : '');

  return {
    fileName,
    extension: ext.replace('.', '') || 'txt',
    fileSizeFormatted,
    fileSizeBytes,
    characterCount,
    wordCount,
    text: sanitizedText,
    previewSnippet,
  };
}

/**
 * Extracts human-readable text streams from PDF files in browser.
 */
async function parsePdfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Convert binary to string safely in chunks
  let binaryStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binaryStr += String.fromCharCode.apply(null, Array.from(chunk));
  }

  const textChunks: string[] = [];

  // 1. Match standard PDF text operators: (Text) Tj, (Text)' , (Text)"
  const textOperatorRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = textOperatorRegex.exec(binaryStr)) !== null) {
    const chunk = match[1]
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\r/g, ' ')
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ');
    if (chunk.trim().length > 1) {
      textChunks.push(chunk);
    }
  }

  // 2. Match array text operators: [(T) 10 (e) 20 (x) (t)] TJ
  const arrayOperatorRegex = /\[((?:\([^)]*\)|-?\d+)+)\]\s*TJ/g;
  while ((match = arrayOperatorRegex.exec(binaryStr)) !== null) {
    const inner = match[1];
    const itemRegex = /\(([^)]*)\)/g;
    let itemMatch: RegExpExecArray | null;
    let combined = '';
    while ((itemMatch = itemRegex.exec(inner)) !== null) {
      combined += itemMatch[1].replace(/\\([()\\])/g, '$1');
    }
    if (combined.trim().length > 1) {
      textChunks.push(combined);
    }
  }

  // If text operators extracted meaningful content
  if (textChunks.length > 5) {
    return textChunks.join(' ');
  }

  // 3. Fallback: extract continuous ASCII / printable UTF-8 sequences (min 4 chars)
  const printableRegex = /[A-Za-z0-9,.:;'"$%\-–—/()#&]{4,}(?:\s+[A-Za-z0-9,.:;'"$%\-–—/()#&]{2,})*/g;
  const rawMatches = binaryStr.match(printableRegex);
  const fallbackMatches: string[] = rawMatches ? Array.from(rawMatches) : [];
  
  // Filter out PDF internal dictionary keywords
  const filtered = fallbackMatches.filter((chunk: string) => 
    !chunk.startsWith('obj') && 
    !chunk.startsWith('endobj') && 
    !chunk.startsWith('/Font') && 
    !chunk.startsWith('/Type') && 
    !chunk.startsWith('/Page') && 
    chunk.length > 8
  );

  if (filtered.length > 0) {
    return filtered.join('\n\n');
  }

  return `[Extracted from ${file.name}]\n\nUnable to extract raw text stream from this encrypted or scanned PDF. Please paste the document text directly or upload a .txt file.`;
}

/**
 * Extracts text from DOCX (OpenXML) or raw text doc files.
 */
async function parseDocxFile(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Convert to binary string
    let binaryStr = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binaryStr += String.fromCharCode.apply(null, Array.from(chunk));
    }

    // Look for XML text nodes <w:t>...</w:t> from word/document.xml
    const xmlTextRegex = /<w:t(?:\s+[^>]*)?>([^<]+)<\/w:t>/g;
    const words: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = xmlTextRegex.exec(binaryStr)) !== null) {
      if (match[1]) {
        words.push(match[1]);
      }
    }

    if (words.length > 5) {
      return words.join(' ');
    }

    // Fallback: extract printable strings
    const printableRegex = /[A-Za-z0-9,.:;'"$%\-–—/()#&]{4,}(?:\s+[A-Za-z0-9,.:;'"$%\-–—/()#&]{2,})*/g;
    const rawMatches = binaryStr.match(printableRegex);
    const matches: string[] = rawMatches ? Array.from(rawMatches) : [];
    const filtered = matches.filter((w: string) => !w.startsWith('word/') && !w.startsWith('docProps/') && w.length > 5);

    if (filtered.length > 0) {
      return filtered.join(' ');
    }

    return await file.text();
  } catch (err) {
    console.error('Failed to parse docx:', err);
    return await file.text();
  }
}

/**
 * Cleans excessive whitespace, null bytes, and non-printable control characters.
 */
export function sanitizeContractText(raw: string): string {
  return raw
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

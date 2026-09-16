export interface DocumentChunk {
  id: string;
  docId: string;
  vaultId: string;
  filename: string;
  chunkIndex: number;
  text: string;
  heading?: string;
  startOffset: number;
  endOffset: number;
  metadata?: Record<string, string>;
  embedding?: number[];
}

export class ContentExtractor {
  private static CHUNK_SIZE = 450;
  private static CHUNK_OVERLAP = 60;

  /**
   * Split a raw document string into clean semantic chunks
   */
  public static extractChunks(
    docId: string,
    vaultId: string,
    filename: string,
    content: string
  ): DocumentChunk[] {
    const cleanContent = content.trim();
    if (!cleanContent) return [];

    // Check if it's markdown with headings
    const lines = cleanContent.split('\n');
    let currentHeading = filename;
    const sections: { heading: string; text: string; start: number }[] = [];
    let currentSectionLines: string[] = [];
    let sectionStart = 0;
    let charTracker = 0;

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
      if (headingMatch) {
        if (currentSectionLines.length > 0) {
          sections.push({
            heading: currentHeading,
            text: currentSectionLines.join('\n'),
            start: sectionStart,
          });
          currentSectionLines = [];
        }
        currentHeading = headingMatch[1];
        sectionStart = charTracker;
      }
      currentSectionLines.push(line);
      charTracker += line.length + 1;
    }

    if (currentSectionLines.length > 0) {
      sections.push({
        heading: currentHeading,
        text: currentSectionLines.join('\n'),
        start: sectionStart,
      });
    }

    const chunks: DocumentChunk[] = [];
    let globalIndex = 0;

    for (const section of sections) {
      const sectionText = section.text.trim();
      if (sectionText.length <= this.CHUNK_SIZE) {
        chunks.push({
          id: `${docId}-chk-${globalIndex}`,
          docId,
          vaultId,
          filename,
          chunkIndex: globalIndex,
          text: sectionText,
          heading: section.heading,
          startOffset: section.start,
          endOffset: section.start + sectionText.length,
          metadata: {
            vaultId,
            filename,
            heading: section.heading,
          },
        });
        globalIndex++;
      } else {
        // Sliding window over section
        let i = 0;
        while (i < sectionText.length) {
          let end = Math.min(i + this.CHUNK_SIZE, sectionText.length);
          // Try to break on sentence or word boundary
          if (end < sectionText.length) {
            const lastPeriod = sectionText.lastIndexOf('. ', end);
            const lastNewline = sectionText.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > i + this.CHUNK_SIZE / 2) {
              end = breakPoint + 1;
            }
          }
          const chunkStr = sectionText.substring(i, end).trim();
          if (chunkStr.length > 15) {
            chunks.push({
              id: `${docId}-chk-${globalIndex}`,
              docId,
              vaultId,
              filename,
              chunkIndex: globalIndex,
              text: chunkStr,
              heading: section.heading,
              startOffset: section.start + i,
              endOffset: section.start + end,
              metadata: {
                vaultId,
                filename,
                heading: section.heading,
              },
            });
            globalIndex++;
          }
          i += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
        }
      }
    }

    return chunks;
  }
}

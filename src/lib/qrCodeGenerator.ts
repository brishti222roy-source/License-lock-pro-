export const generateQRCodeSVG = (data: string, size: number = 200): string => {
  // Simple QR code generation using SVG
  // In production, use a proper QR code library like qrcode or qr-code-styling
  
  const modules = generateQRMatrix(data);
  const moduleSize = size / modules.length;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  for (let row = 0; row < modules.length; row++) {
    for (let col = 0; col < modules[row].length; col++) {
      if (modules[row][col]) {
        const x = col * moduleSize;
        const y = row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
};

// Simplified QR matrix generation (mock implementation)
const generateQRMatrix = (data: string): boolean[][] => {
  const size = 25; // QR code size
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Add finder patterns (corners)
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, size - 7, 0);
  addFinderPattern(matrix, 0, size - 7);
  
  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  
  // Encode data (simplified - just create a pattern based on data)
  const hash = simpleHash(data);
  for (let i = 8; i < size - 8; i++) {
    for (let j = 8; j < size - 8; j++) {
      matrix[i][j] = ((hash >> ((i * size + j) % 32)) & 1) === 1;
    }
  }
  
  return matrix;
};

const addFinderPattern = (matrix: boolean[][], row: number, col: number) => {
  // 7x7 finder pattern
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const isEdge = i === 0 || i === 6 || j === 0 || j === 6;
      const isCenter = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      matrix[row + i][col + j] = isEdge || isCenter;
    }
  }
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const generateQRCodeDataURL = (data: string, size: number = 200): string => {
  const svg = generateQRCodeSVG(data, size);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
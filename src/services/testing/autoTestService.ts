/**
 * Auto Test Service — Validates generated documents for completeness and integrity.
 * Fast checks without external dependencies (no full parsing — just format validation).
 */

export interface TestCase {
  name: string;
  passed: boolean;
  message?: string;
}

export interface TestResult {
  passed: boolean;
  score: string; // e.g. "8/8 tests"
  tests: TestCase[];
  format: 'excel' | 'ppt' | 'word' | 'pdf';
}

/**
 * Test an Excel buffer (xlsx format).
 * Checks:
 * - Buffer is not empty
 * - Has ZIP signature (xlsx is ZIP-based)
 * - Size > 1KB (indicates actual content)
 */
export function testExcel(buffer: Uint8Array): TestResult {
  const tests: TestCase[] = [];

  // Test 1: Buffer exists and not empty
  tests.push({
    name: 'Buffer no está vacío',
    passed: buffer && buffer.length > 0,
    message: buffer && buffer.length > 0 ? '' : 'El archivo está vacío',
  });

  // Test 2: Has ZIP signature (xlsx is ZIP)
  const hasZipSignature =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  tests.push({
    name: 'Formato XLSX válido (firma ZIP)',
    passed: hasZipSignature,
    message: hasZipSignature ? '' : 'El archivo no tiene firma ZIP válida',
  });

  // Test 3: Minimum size
  const sizeOk = buffer.length > 1024;
  tests.push({
    name: 'Tamaño mínimo (>1KB)',
    passed: sizeOk,
    message: sizeOk ? '' : `Archivo muy pequeño: ${buffer.length} bytes`,
  });

  // Test 4: Not a compressed empty structure
  const notTooSmall = buffer.length > 5000; // Real spreadsheets typically > 5KB
  tests.push({
    name: 'Contiene contenido sustancial (>5KB)',
    passed: notTooSmall,
    message: notTooSmall ? '' : `Archivo pequeño, puede estar incompleto: ${buffer.length} bytes`,
  });

  const passed = tests.every((t) => t.passed);
  const count = tests.filter((t) => t.passed).length;

  return {
    passed,
    score: `${count}/${tests.length} tests`,
    tests,
    format: 'excel',
  };
}

/**
 * Test a PowerPoint buffer (pptx format).
 * Checks:
 * - Buffer is not empty
 * - Has ZIP signature (pptx is ZIP-based)
 * - Size > 5KB (indicates slides present)
 */
export function testPPT(buffer: Uint8Array): TestResult {
  const tests: TestCase[] = [];

  // Test 1: Buffer exists and not empty
  tests.push({
    name: 'Buffer no está vacío',
    passed: buffer && buffer.length > 0,
    message: buffer && buffer.length > 0 ? '' : 'El archivo está vacío',
  });

  // Test 2: Has ZIP signature (pptx is ZIP)
  const hasZipSignature =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  tests.push({
    name: 'Formato PPTX válido (firma ZIP)',
    passed: hasZipSignature,
    message: hasZipSignature ? '' : 'El archivo no tiene firma ZIP válida',
  });

  // Test 3: Minimum size (indicates slides exist)
  const sizeOk = buffer.length > 5000;
  tests.push({
    name: 'Contiene slides (>5KB)',
    passed: sizeOk,
    message: sizeOk ? '' : `Archivo muy pequeño, puede estar sin slides: ${buffer.length} bytes`,
  });

  // Test 4: Not a minimal template
  const hasContent = buffer.length > 8000;
  tests.push({
    name: 'Contiene contenido sustancial (>8KB)',
    passed: hasContent,
    message: hasContent ? '' : 'Archivo pequeño, puede tener pocas slides',
  });

  const passed = tests.every((t) => t.passed);
  const count = tests.filter((t) => t.passed).length;

  return {
    passed,
    score: `${count}/${tests.length} tests`,
    tests,
    format: 'ppt',
  };
}

/**
 * Test a Word buffer (docx format).
 * Checks:
 * - Buffer is not empty
 * - Has ZIP signature (docx is ZIP-based)
 * - Size > 5KB (indicates actual content)
 */
export function testWord(buffer: Uint8Array): TestResult {
  const tests: TestCase[] = [];

  // Test 1: Buffer exists and not empty
  tests.push({
    name: 'Buffer no está vacío',
    passed: buffer && buffer.length > 0,
    message: buffer && buffer.length > 0 ? '' : 'El archivo está vacío',
  });

  // Test 2: Has ZIP signature (docx is ZIP)
  const hasZipSignature =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  tests.push({
    name: 'Formato DOCX válido (firma ZIP)',
    passed: hasZipSignature,
    message: hasZipSignature ? '' : 'El archivo no tiene firma ZIP válida',
  });

  // Test 3: Minimum size
  const sizeOk = buffer.length > 5000;
  tests.push({
    name: 'Contiene contenido (>5KB)',
    passed: sizeOk,
    message: sizeOk ? '' : `Archivo muy pequeño: ${buffer.length} bytes`,
  });

  // Test 4: Not a template
  const hasSubstantialContent = buffer.length > 10000;
  tests.push({
    name: 'Contenido sustancial (>10KB)',
    passed: hasSubstantialContent,
    message: hasSubstantialContent ? '' : 'Documento puede estar incompleto',
  });

  const passed = tests.every((t) => t.passed);
  const count = tests.filter((t) => t.passed).length;

  return {
    passed,
    score: `${count}/${tests.length} tests`,
    tests,
    format: 'word',
  };
}

/**
 * Test a PDF buffer.
 * Checks:
 * - Buffer starts with "%PDF" signature
 * - Buffer ends with "%%EOF" (PDF terminator)
 * - Size > 3KB (indicates actual content)
 */
export function testPDF(buffer: Uint8Array): TestResult {
  const tests: TestCase[] = [];

  // Test 1: Starts with %PDF signature
  const pdfSignature = '%PDF';
  const signatureBytes = new TextEncoder().encode(pdfSignature);
  const hasPDFSignature =
    buffer.length >= signatureBytes.length &&
    Array.from(buffer.slice(0, signatureBytes.length)).every(
      (byte, idx) => byte === signatureBytes[idx]
    );

  tests.push({
    name: 'Firma PDF válida (%PDF)',
    passed: hasPDFSignature,
    message: hasPDFSignature ? '' : 'El archivo no tiene firma PDF válida',
  });

  // Test 2: Contains EOF marker
  const eofSignature = '%%EOF';
  const eofBytes = new TextEncoder().encode(eofSignature);
  const bufferStr = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  const hasEOF = bufferStr.includes(eofSignature);

  tests.push({
    name: 'Marcador EOF presente',
    passed: hasEOF,
    message: hasEOF ? '' : 'El archivo no tiene marcador EOF válido',
  });

  // Test 3: Minimum size
  const sizeOk = buffer.length > 3000;
  tests.push({
    name: 'Tamaño mínimo (>3KB)',
    passed: sizeOk,
    message: sizeOk ? '' : `Archivo muy pequeño: ${buffer.length} bytes`,
  });

  // Test 4: Reasonable size (not enormous)
  const sizeNotExcessive = buffer.length < 100 * 1024 * 1024; // < 100MB
  tests.push({
    name: 'Tamaño razonable (<100MB)',
    passed: sizeNotExcessive,
    message: sizeNotExcessive ? '' : 'Archivo muy grande',
  });

  const passed = tests.every((t) => t.passed);
  const count = tests.filter((t) => t.passed).length;

  return {
    passed,
    score: `${count}/${tests.length} tests`,
    tests,
    format: 'pdf',
  };
}

/**
 * Run all tests on multiple buffers.
 * Example:
 *   const results = autoTestService.runAll({ excel: buf1, ppt: buf2, pdf: buf3 });
 */
export function runAll(buffers: {
  excel?: Uint8Array;
  ppt?: Uint8Array;
  word?: Uint8Array;
  pdf?: Uint8Array;
}): Record<string, TestResult> {
  const results: Record<string, TestResult> = {};

  if (buffers.excel) {
    results.excel = testExcel(buffers.excel);
  }
  if (buffers.ppt) {
    results.ppt = testPPT(buffers.ppt);
  }
  if (buffers.word) {
    results.word = testWord(buffers.word);
  }
  if (buffers.pdf) {
    results.pdf = testPDF(buffers.pdf);
  }

  return results;
}

export const autoTestService = {
  testExcel,
  testPPT,
  testWord,
  testPDF,
  runAll,
};

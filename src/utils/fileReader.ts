
export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error("File reading error"));
    reader.readAsText(file);
  });
}

export function isCodeFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith('.js') || 
         lowerName.endsWith('.jsx') || 
         lowerName.endsWith('.ts') || 
         lowerName.endsWith('.tsx');
}

export function isApiFile(fileName: string): boolean {
  return (fileName.includes('/api/') || fileName.includes('\\api\\')) && 
         (fileName.endsWith('.ts') || fileName.endsWith('.js'));
}

export function isMiddlewareFile(fileName: string): boolean {
  return fileName.includes('middleware') && 
         (fileName.endsWith('.ts') || fileName.endsWith('.js'));
}

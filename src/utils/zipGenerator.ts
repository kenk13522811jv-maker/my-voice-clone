import JSZip from 'jszip';
import { PROJECT_FILES } from '../data/projectFiles';

/**
 * Packs all project files into a downloadable .zip archive.
 */
export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Root files
  for (const file of PROJECT_FILES) {
    // Strip leading slash if any
    const relativePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    zip.file(relativePath, file.content);
  }

  // Create empty placeholder directories so git tracks them
  zip.file('uploads/speakers/.gitkeep', '');
  zip.file('outputs/.gitkeep', '');

  // Generate blob
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'bengali-voice-cloning-flask.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

import { isNative, isAndroid } from '../platform';
import { ShareService } from '../share/ShareService';

export class FileService {
  /**
   * Safe file download for Web, PWA, and Android WebView
   */
  static downloadFile(data, filename, mimeType = 'application/octet-stream') {
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = filename;

      // Append to body for Android WebView compatibility
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 2000);

      return true;
    } catch (err) {
      console.error('[FileService] File download error:', err);
      return false;
    }
  }

  /**
   * Mobile-safe PDF opener / printer
   */
  static openOrPrintPdf(pdfBlobUrl, title = 'Document') {
    if (isNative) {
      // In Android WebView, window.open or print often fails; use native share or direct view
      ShareService.share({
        title,
        text: `Medical document: ${title}`,
        url: pdfBlobUrl
      });
      return;
    }

    const win = window.open(pdfBlobUrl, '_blank');
    if (win) {
      win.focus();
    }
  }
}

export default FileService;

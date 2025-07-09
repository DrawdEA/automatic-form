import React, { useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires
let pdfjsLib: any = null;
if (typeof window !== "undefined") {
  //pdfjsLib = require("pdfjs-dist/legacy/build/pdf");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PdfPreviewerProps {
  pdfBlobs: Blob[];
}

const PdfPreviewer: React.FC<PdfPreviewerProps> = ({ pdfBlobs }) => {
  const [previewPngs, setPreviewPngs] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const renderAllPngs = async () => {
      if (!pdfjsLib || pdfBlobs.length === 0) return;
      setLoading(true);
      const allPngs: string[][] = [];
      for (const blob of pdfBlobs) {
        const pdfData = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const pageImages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          await page.render({ canvasContext: context, viewport }).promise;
          pageImages.push(canvas.toDataURL("image/png"));
        }
        allPngs.push(pageImages);
      }
      setPreviewPngs(allPngs);
      setLoading(false);
    };
    if (pdfBlobs.length > 0) {
      renderAllPngs();
    }
  }, [pdfBlobs]);

  if (loading) {
    return <div className="text-gray-500 py-12">Generating previews...</div>;
  }

  return (
    <div className="flex flex-col gap-8 items-center">
      {previewPngs.map((pngs, i) => (
        <div key={i} className="w-full flex flex-col gap-2 items-center">
          {pngs.map((src, j) => (
            <img key={j} src={src} alt={`Preview page ${j + 1}`} className="w-full max-w-lg border rounded shadow" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default PdfPreviewer; 
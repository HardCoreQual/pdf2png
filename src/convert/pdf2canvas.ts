type ObjectURL = string;

export async function* pdf2png(url: ObjectURL) {
  const PDFJS = (window as any).pdfjsLib;

  const loadingTask = await PDFJS.getDocument({url}).promise;

  const pdfDocument = loadingTask;
  const numPages = pdfDocument.numPages;

  const canvasNode = document.createElement("canvas");
  canvasNode.setAttribute('id', 'pdf-canvas');
  canvasNode.setAttribute('style', 'display:none');

  document.body.appendChild(canvasNode);

  for (let pageIndex = 1; pageIndex <= numPages; pageIndex++) {
    const page = await pdfDocument.getPage(pageIndex);

    const viewport = page.getViewport({scale: 3.0});

    canvasNode.setAttribute('width', viewport.width);
    canvasNode.setAttribute('height', viewport.height);

    const render_context = {
      canvasContext: (document.querySelector("#pdf-canvas") as any).getContext("2d"),
      viewport: viewport
    };
    await page.render(render_context).promise;

    yield canvasNode.toDataURL('image/png');
  }

  canvasNode.remove();
}

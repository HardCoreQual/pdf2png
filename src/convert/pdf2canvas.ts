import {strict as assert} from "assert";
import Canvas from "canvas";


type CanvasAndContext =  { canvas: Canvas.Canvas | null, context: null };

export class NodeCanvasFactory {
  create(width: number, height: number) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext("2d");
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext: CanvasAndContext, width: number, height: number) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: CanvasAndContext) {
    assert(canvasAndContext.canvas, "Canvas is not specified");

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

type ObjectURL = string

async function* pdf2canvas(url: ObjectURL) {
  const PDFJS = (window as any).pdfjsLib;

  const loadingTask = await PDFJS.getDocument({url});

  const pdfDocument = loadingTask;
  const numPages = pdfDocument.numPages;

  for (let pageIndex = 1; pageIndex <= numPages; pageIndex++) {
    const page = await pdfDocument.getPage(pageIndex);

    // Render the page on a Node canvas with 100% scale.
    const viewport = page.getViewport({scale: 1.0});
    const canvasFactory = new NodeCanvasFactory();
    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height
    );
    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
      canvasFactory,
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;
    yield canvasAndContext.canvas;
  }
}

export async function* pdf2png(url: ObjectURL) {
  for await (let canvas of pdf2canvas(url)) {
    yield canvas.toDataURL('image/png');
  }
}
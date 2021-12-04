import axios from "axios";
import React, {useState} from "react";
import {strict as assert} from "assert";
import Head from "next/head";
import Canvas from "canvas";



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

  reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
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
async function pdf2png(url: ObjectURL) {
  const PDFJS = (window as any).pdfjsLib;

  const loadingTask = await PDFJS.getDocument({ url });

  const pdfDocument = loadingTask;
  const numPages = pdfDocument.numPages;

  const result : string[] = [];

  for (let pageIndex = 1; pageIndex <= numPages; pageIndex++) {
    const page = await pdfDocument.getPage(pageIndex);

    // Render the page on a Node canvas with 100% scale.
    const viewport = page.getViewport({ scale: 1.0 });
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
    const image = canvasAndContext.canvas.toDataURL('image/png');
    result.push(image);
  }

  return result;
}

export interface IProps {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  label: string;
  uploadFileName: string;
}

export const UiFileInputButton: React.FC<IProps> = (props) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [pngs, setPngs] = useState<string[]>([]);

  const onClickHandler = () => {
    fileInputRef.current?.click();
  };

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    Array.from(event.target.files).forEach(async (file) => {
      const pngs = await pdf2png(URL.createObjectURL(file));
      setPngs(pngs);
    });


    formRef.current?.reset();
  };

  return (
    <>
      <form ref={formRef}>
        <button type="button" onClick={onClickHandler}>
          {props.label}
        </button>
        <input
          accept={props.acceptedFileTypes}
          multiple={props.allowMultipleFiles}
          name={props.uploadFileName}
          onChange={onChangeHandler}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />
      </form>
      {pngs.map(png => <img src={png} alt=""/>)}
    </>
  );
};

UiFileInputButton.defaultProps = {
  acceptedFileTypes: '',
  allowMultipleFiles: false,
};

export default function () {
  return <>
    <Head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.js"></script>
      <script src="https://cdnjs.com/libraries/pdf.js"></script>
      <script src="https://cdn.dwolla.com/1/dwolla.js"></script>
    </Head>
    <UiFileInputButton
      label="Upload Single File"
      uploadFileName="theFiles"
    />
  </>
};

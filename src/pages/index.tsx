import React, {useState} from "react";
import Head from "next/head";
import {pdf2img} from "../convert/pdf2canvas";
import JSZip from 'jszip';
// @ts-ignore
import JSZipUtils from 'jszip-utils';


export const UiFileInputButton: React.FC<{label: string}> = (props) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [images, setImages] = useState<string[]>([]);

  const onClickHandler = () => {
    fileInputRef.current?.click();
  };

  const onChangeHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    for (let file of event.target.files) {
      for await(let img of pdf2img(URL.createObjectURL(file))) {
        setImages((images) => [
          ...images,
          img,
        ]);
      }
    }

    formRef.current?.reset();
  };

  return (
    <>
      <form ref={formRef}>
        <button type="button" onClick={onClickHandler}>
          {props.label}
        </button>
        <button type="button" onClick={() => downloadZip(images.map((img, index) => ({
          url: img,
          format: 'webp',
          name: index.toString()
        })), 'images', (e) => console.log(Math.round(e * 100)))}>
          Download Rendered Images
        </button>
        <input
          multiple={true}
          onChange={onChangeHandler}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />
      </form>
      {images.map((png, index) => <img src={png} key={index} alt="" />)}
    </>
  );
};

export default function () {
  return <>
    <Head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.js"></script>
      <script src="https://cdnjs.com/libraries/pdf.js"></script>
      <script src="https://cdn.dwolla.com/1/dwolla.js"></script>
    </Head>
    <UiFileInputButton label="Upload PDF for convert to images" />
  </>
};


async function downloadZip(files: {
  url: string,
  name: string,
  format: string,
}[], zipName: string, progress?: (e: number) => void) {
  var zip = new JSZip();
  var zipFilename = zipName + ".zip";

  const getBinaryContent = (url: string) : Promise<string> => new Promise((resolve, reject) => {
    JSZipUtils.getBinaryContent(url, function (err: Error | null, data: string) {
      if (err) {
        reject(err);
      } else {
        resolve(data)
      }
    });
  });

  let doneCount = 0;

  const addedImages = files
    .map(async ({url, name, format}, index) => {
      const content = await getBinaryContent(url);
      zip.file(name + '.' + format, content, {binary:true});

      doneCount++;
      progress && progress(doneCount / files.length);
    });

  await Promise.all(addedImages);

  zip.generateAsync({type:'blob'}).then(function(content) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(content);
    link.download = zipFilename;
    console.log( link.href );
    link.click();
  });
}

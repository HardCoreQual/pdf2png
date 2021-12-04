import React, {useState} from "react";
import Head from "next/head";
import {pdf2png} from "../convert/pdf2canvas";


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
      for await(let png of pdf2png(URL.createObjectURL(file))) {
        setPngs((pngs) => [
          ...pngs,
          png,
        ]);
      }
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

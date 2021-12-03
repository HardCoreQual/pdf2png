import axios from "axios";
import React from "react";


const UploadPage = () => {
  return (
    <UiFileInputButton
      label="Upload Single File"
      uploadFileName="theFiles"
      onChange={async (formData) => {
        const response = await axios.post('/api/pdf2img', formData, {
          headers: { 'content-type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            console.log(`Current progress:`, Math.round((event.loaded * 100) / event.total));
          },
        });

        console.log('response', response.data);
      }}
    />
  );
};

export interface IProps {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  label: string;
  onChange: (formData: FormData) => void;
  uploadFileName: string;
}

export const UiFileInputButton: React.FC<IProps> = (props) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const onClickHandler = () => {
    fileInputRef.current?.click();
  };

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    const formData = new FormData();

    Array.from(event.target.files).forEach((file) => {
      formData.append(event.target.name, file);
    });

    props.onChange(formData);

    formRef.current?.reset();
  };

  return (
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
  );
};

UiFileInputButton.defaultProps = {
  acceptedFileTypes: '',
  allowMultipleFiles: false,
};

export default UploadPage;

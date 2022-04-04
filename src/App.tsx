import axios from 'axios';
import CryptoJS from 'crypto-js';
import React, { useEffect, useState } from 'react';
import { ProgressBar, Card, Form, Container } from 'react-bootstrap';

import './App.css';

const chunkSize = 1024 * 1024 * 6; // 6MB

function App() {
  const [showProgress, setShowProgress] = useState(false)
  const [chunkCount, setChunkCount] = useState(0);
  const [filename, setFilename] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileToBeUpload, setFileToBeUpload] = useState({} as File);
  const [counter, setCounter] = useState(1);
  const [chunks, setChunks] = useState([] as string[]);
  const [uploadId, setUploadId] = useState("");

  const progressInstance = <ProgressBar animated now={counter * 100 / chunkCount} label={`${(counter * 100 / chunkCount).toFixed(3)}%`} />;

  useEffect(() => {
    if (fileSize > 0) { // 上传 0B 的文件没有什么意义
      setShowProgress(true);
      handler(counter);
    }
  }, [fileToBeUpload, counter]);

  useEffect(() => {
    if (chunks.length !== 0 && chunks.length === chunkCount) {
      completeMultipartUpload();
    }
  }, [chunks]);

  const handler = (counter: number) => {
    if (counter <= chunkCount) {
      let blob = fileToBeUpload.slice(chunkSize * (counter - 1), chunkSize * counter);
      uploadPart(blob);
    }
  }

  const uploadHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (e) => {
      let buffer = (e.target as FileReader).result as ArrayBuffer;
      const byteArray = new Uint8Array(buffer);
      const hash = CryptoJS.SHA256(byteArray2WordArray(byteArray)).toString();
      let uploaded = await createMultipartUpload(hash, file.name);
      if (!uploaded.Exist) {
        setFilename(file.name);
        setUploadId(uploaded.UploadId);
        setCounter(1);
        setChunks([]);
        setChunkCount(file.size % chunkSize === 0 ? file.size / chunkSize : Math.floor(file.size / chunkSize) + 1);
        setFileSize(file.size);
        setFileToBeUpload(file);
      }
    }
  }

  const byteArray2WordArray = (byteArray: Uint8Array) => {
    var wordArray: number[] = [], i;
    for (i = 0; i < byteArray.length; i++) {
      wordArray[(i / 4) | 0] |= byteArray[i] << (24 - 8 * i);
    }
    return CryptoJS.lib.WordArray.create(wordArray, byteArray.length);
  }

  const uploadPart = async (chunk: Blob) => {
    const byteArray = new Uint8Array(await chunk.arrayBuffer());
    const hash = CryptoJS.SHA256(byteArray2WordArray(byteArray)).toString();
    const response = await axios.post("http://localhost:8080/UploadPart", chunk, {
      params: {
        Id: counter,
        Filename: filename,
      },
      headers: {
        'Content-Type': 'application/json',
        "Content-Sha256": hash,
      }
    });
    if (response.status === 200) {
      console.log("upload chunk success");
      setChunks([...chunks, hash]);
      if (counter < chunkCount) {
        setCounter(counter + 1);
      }
    }
  }

  const createMultipartUpload = async (hash: string, filename: string) => {
    const response = await axios.get("http://localhost:8080/CreateMultipartUpload", {
      params: {
        Filename: filename,
      },
      headers: {
        'Content-Type': 'application/json',
        "Content-Sha256": hash,
      }
    });
    if (response.status === 200) {
      if (!response.data.Exist) {
        return response.data;
      }
      return response.data;
    }
  }

  const completeMultipartUpload = async () => {
    const response = await axios.post("http://localhost:8080/CompleteMultipartUpload", {
      Chunks: chunks,
    }, {
      params: {
        Filename: filename,
      },
      headers: {
        'Content-Type': 'application/json',
      }
    })
    if (response.status === 200) {
      console.log("upload complete");
    }
  }

  return (
    <Container className="App">
      <Card>
        <Card.Header as="h5">Upload file demo</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Control type="file" size="lg" onChange={uploadHandler} />
            </Form.Group>
            <Form.Group style={{ display: showProgress ? "block" : "none" }}>
              {progressInstance}
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default App;

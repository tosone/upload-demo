import React, { useEffect, useState } from 'react';
import './App.css';
import { ProgressBar, Card, Form, Container } from 'react-bootstrap';
import CryptoJS from 'crypto-js';

function App() {
  const uploadHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    console.log(file);
    reader.onload = function (evt: any) {
      const arrayBuffer = evt.target.result as ArrayBuffer;
      const byteArray = new Uint8Array(arrayBuffer);
      var hash = CryptoJS.SHA256(byteArray2WordArray(byteArray)).toString();
      console.log(hash);
    };
  }
  const byteArray2WordArray = (byteArray: Uint8Array) => {
    var wordArray: number[] = [], i;
    for (i = 0; i < byteArray.length; i++) {
      wordArray[(i / 4) | 0] |= byteArray[i] << (24 - 8 * i);
    }
    return CryptoJS.lib.WordArray.create(wordArray, byteArray.length);
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
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default App;

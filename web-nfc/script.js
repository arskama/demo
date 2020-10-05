if (!NDEFReader) {
  pre.innerHTML += `<font color="red">Error: ${error}</font>\n`;
}

const r = new NDEFReader();

r.onerror = event => {
  pre.innerHTML += "<font color='red'>Error: " + event.error + "</font>\n";
};

r.onreading = ({ message }) => {
  pre.innerHTML += `<br>> <font color='green'>Reading from ${event.serialNumber}</font>\n`;
  pre.innerHTML += `> <font color='green'>Records:</font>\n`;

  if (message.records.length === 0) {
    pre.innerHTML += `  > <font color='green'>No WebNFC records</font>\n`;
    return;
  }

  for (const record of message.records) {
    pre.innerHTML += `  > <font color='green'>recordType: ${record.recordType}</font>\n`;
    pre.innerHTML += `  > <font color='green'>mediaType: ${record.mediaType}</font>\n`;
    pre.innerHTML += `  > <font color='green'>id: ${record.id}</font>\n`;
    switch (record.recordType) {
      case "empty":
        pre.innerHTML += `  > <font color='green'>data: Empty record</font>\n`;
        break;
      case "text":
        pre.innerHTML += `  > <font color='green'>data: ${record.toText()}</font>\n`;
        break;
      case "url":
        pre.innerHTML += `  > <font color='green'>data: ${record.toText()}</font>\n`;
        break;
      case "json":
        pre.innerHTML += `  > <font color='green'>data: ${JSON.stringify(record.toJSON())}</font>\n`;
        break;
      case "opaque":
        const blob = new Blob([record.toArrayBuffer()], {type: record.mediaType});

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.style.paddingLeft = "15px";

        pre.innerHTML += `  > <font color='green'>data:</font>\n`;
        pre.appendChild(img);

        const br = document.createElement("br");
        pre.appendChild(br);
        break;
    }
  }
};

/* Scan signal */
const abortController = new AbortController();
abortController.signal.addEventListener("abort", _ => {
  pre.innerHTML += "> <font color='green'>Scan operation aborted.</font>\n";
});
pre.innerHTML += `<b>Note: Click "scan" button to start reading.</b>\n`;

abortButton.addEventListener("click", _ => {
  abortController.abort();
});

scanButton.addEventListener("click", _ => {
  pre.innerHTML += "<b>Start scanning...</b>\n";
  if (recordType.value === "---") {
    r.scan({
      signal: abortController.signal,
      id: scanId.value,
      mediaType: mediaType.value
    });
  } else {
    r.scan({
      signal: abortController.signal,
      id: scanId.value,
      recordType: recordType.value,
      mediaType: mediaType.value
    });
  }
});

/* Push signal */
const abortPushController = new AbortController();
abortPushController.signal.addEventListener("abort", _ => {
  pre.innerHTML += "> <font color='green'>Push operation aborted.</font>\n";
});

abortPushButton.addEventListener("click", _ => {
  abortPushController.abort();
});

/* Push Message */
pushMessage.value = 'Hello web-nfc';
NDEFMessageInit.style.display="none";

NDEFMessageSource.onchange = () => {
  pushMessage.disabled = false;
  NDEFMessageInit.style.display="none";
  switch (NDEFMessageSource.value) {
    case "DOMString":
      pushMessage.value = 'Hello web-nfc';
      break;
    case "ArrayBuffer":
      pushMessage.value = 'fetch("./red.png").arrayBuffer()';
      pushMessage.disabled = true;
      break;
    case "NDEFMessageInit":
      pushRecordType.value = "text";
      pushMessage.value = '{ "records": [{ "recordType": "text", "data": "hello", \
"mediaType": "text/plain", "id": "http://www.intel.com" }] }';
      NDEFMessageInit.style.display="";
      break;
  }
}

const opaque_data = new ArrayBuffer(15);
pushRecordType.onchange = () => {
  pushMessage.disabled = false;
  switch (pushRecordType.value) {
    case "empty":
      pushMessage.value = '{ "records": [{ "recordType": "empty" }] }';
      break;
    case "text":
      pushMessage.value = '{ "records": [{ "recordType": "text", \
"data": "hello", "mediaType": "text/plain", "id": "http://www.intel.com" }] }';
      break;
    case "url":
      pushMessage.value = '{ "records": [{ "recordType": "url", "data": \
"http://www.intel.com", "mediaType": "text/plain", "id": "http://www.intel.com" }] }';
      break;
    case "json":
      pushMessage.value = '{ "records": [{ "recordType": "json", \
"data": { "key1": "value1", "key2": "value2" }, \
"mediaType": "application/json", "id": "http://www.intel.com" }] }';
      break;
    case "opaque":
      pushMessage.value = '{ "records": [{ "recordType": "opaque", \
"data": fetch("./green.png").arrayBuffer(), "mediaType": "application/octet-stream"\
, "id": "http://www.intel.com" }] }';
      pushMessage.disabled = true;
      break;
  }
}

/* Write */

writeButton.addEventListener("click", async _ => {
  pre.innerHTML += "<b>Start writing...</b>\n";
  const w = new NDEFWriter();
  let newMessage = null;
  if (NDEFMessageSource.value ===  "DOMString") {
    newMessage = pushMessage.value;
  } else if (NDEFMessageSource.value === "ArrayBuffer") {
    const response = await fetch("./red.png");
    const test_buffer_data = await response.arrayBuffer();

    newMessage = test_buffer_data;
  } else if (NDEFMessageSource.value === "NDEFMessageInit" && pushRecordType.value ===  "opaque") {
    const response = await fetch("./green.png");
    const test_buffer_data = await response.arrayBuffer();

    newMessage = { records: [{ recordType: "opaque", data: test_buffer_data,
        mediaType: "application/octet-stream", id: "http://www.intel.com" }] };
  } else {
    newMessage = JSON.parse(pushMessage.value);
  }
  try {
    await w.write(
      newMessage,
      {
        target: target.value,
        timeout: timeout.value === "Infinity" ? "Infinity" : parseFloat(timeout.value),
        ignoreRead: ignoreRead.value === "false" ? false : true,
        signal: abortPushController.signal
      }
    );
    pre.innerHTML += "> <font color='green'>Writing data successfully.</font>\n";
  } catch(e) {
    pre.innerHTML += `> <font color='red'>${e}</font>\n`;
  }
});


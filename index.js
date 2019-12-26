const express = require("express");
const fetch = require("node-fetch");
const iconv = require("iconv-lite");
const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

const merchant_id = process.env.NODE_ENV === "production" ? "" : "INIpayTest";

server.use("/", async (req, res) => {
  const { P_STATUS, P_REQ_URL, P_TID } = req.body;

  if (P_STATUS === "00") {
    console.log(
      "결제 승인을 요청합니다.\n",
      `tid:${P_TID}\n`,
      `url:${P_REQ_URL}\n`
    );
  } else {
    const failResponse = getResponse(P_STATUS === "01", false, P_TID, req.body);
    return res.send(getRNWebViewHTML(failResponse));
  }

  const params = [];
  params.push("P_TID=" + P_TID);
  params.push("P_MID=" + merchant_id);

  fetch(`${P_REQ_URL}?` + params.join("&"))
    .then(response => response.buffer())
    .then(result => {
      const responseString = iconv.decode(result, "euc-kr").toString();
      const results = makeObject(responseString);

      const webViewResponse = getResponse(
        false,
        P_STATUS === "00" ? true : false,
        P_TID,
        results
      );

      if (results.P_STATUS === "00") {
        res.send(getRNWebViewHTML(webViewResponse));
      } else {
        res.send(getRNWebViewHTML(webViewResponse));
      }
    });
});

function getRNWebViewHTML(response) {
  const stringifiedResponse = encodeURIComponent(JSON.stringify(response));
  return `
    <html>
      <head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <script> 
          window.ReactNativeWebView.postMessage('${stringifiedResponse}');
      </script>
      <body></body>
    </html>
`;
}

function getResponse(cancelled, success, tid, original) {
  return {
    cancelled,
    success,
    tid,
    original
  };
}

function makeObject(paramString) {
  const result = {};

  paramString.split("&").forEach(param => {
    const [key, value] = param.split("=");
    result[key] = value;
  });

  return result;
}

server.listen(8080, () => {
  console.log("server started");
});

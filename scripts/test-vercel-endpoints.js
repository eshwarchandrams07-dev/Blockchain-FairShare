/**
 * Automated Test Suite for FairShare Vercel Serverless Functions
 * Validates /api/ipfs, /api/upload-receipt, /api/lan-ip, and /api/ledger-state
 */
import uploadHandler from '../api/upload-receipt.js';
import ipfsHandler from '../api/ipfs.js';
import lanIpHandler from '../api/lan-ip.js';
import ledgerHandler from '../api/ledger-state.js';

console.log('====================================================');
console.log('⚡ VERCEL SERVERLESS FUNCTIONS INTEGRITY TEST');
console.log('====================================================\n');

let total = 0;
let passed = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

function createMockRes() {
  const headers = {};
  let statusCode = 200;
  let body = null;

  return {
    statusCode,
    headers,
    setHeader(key, value) {
      headers[key.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      body = data;
      return this;
    },
    send(data) {
      body = data;
      return this;
    },
    end(data) {
      body = data;
      return this;
    },
    getBody() {
      return body;
    },
  };
}

async function runTests() {
  // --- 1. Test LAN IP Endpoint ---
  console.log('--- 1. /api/lan-ip Endpoint ---');
  {
    const req = {
      method: 'GET',
      headers: { host: 'fairshare-app.vercel.app' },
    };
    const res = createMockRes();
    await lanIpHandler(req, res);

    assert(res.statusCode === 200, 'lan-ip returns HTTP 200');
    assert(res.getBody()?.ip === 'fairshare-app.vercel.app', 'lan-ip returns host from headers');
    assert(res.headers['access-control-allow-origin'] === '*', 'lan-ip sets CORS header');
  }

  // --- 2. Test Upload Receipt Endpoint ---
  console.log('\n--- 2. /api/upload-receipt Endpoint ---');
  const samplePdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const samplePdfDataUrl = `data:application/pdf;base64,${samplePdfBytes.toString('base64')}`;
  const testCid = 'bafkreitestcidforvercelexpenserun1234567890abcdefghijklm';

  {
    const req = {
      method: 'POST',
      body: {
        cid: testCid,
        fileName: 'rent-receipt.pdf',
        dataUrl: samplePdfDataUrl,
      },
    };
    const res = createMockRes();
    await uploadHandler(req, res);

    assert(res.statusCode === 200, 'upload-receipt returns HTTP 200');
    assert(res.getBody()?.success === true, 'upload-receipt returns success: true');
    assert(res.getBody()?.cid === testCid, 'upload-receipt returns confirmed CID');
  }

  // --- 3. Test IPFS Serverless Handler (Serving PDF) ---
  console.log('\n--- 3. /api/ipfs Serverless Endpoint (PDF Delivery) ---');
  {
    const req = {
      method: 'GET',
      query: { cid: testCid },
      url: `/api/ipfs?cid=${testCid}`,
    };
    const res = createMockRes();
    await ipfsHandler(req, res);

    assert(res.statusCode === 200, 'ipfs handler returns HTTP 200 for uploaded CID');
    assert(res.headers['content-type'] === 'application/pdf', 'ipfs handler sets Content-Type: application/pdf');
    assert(res.headers['content-disposition'].includes('inline'), 'ipfs handler sets Content-Disposition: inline');
    assert(res.headers['x-ipfs-path'] === `/ipfs/${testCid}`, 'ipfs handler sets X-Ipfs-Path header');
    const returnedBuffer = res.getBody();
    assert(Buffer.isBuffer(returnedBuffer), 'ipfs handler returns raw binary Buffer');
    assert(returnedBuffer.toString().startsWith('%PDF-1.4'), 'ipfs buffer content matches original PDF');
  }

  // --- 4. Test IPFS Serverless Handler (Serving Image) ---
  console.log('\n--- 4. /api/ipfs Serverless Endpoint (Image Delivery) ---');
  const samplePngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const samplePngDataUrl = `data:image/png;base64,${samplePngBytes.toString('base64')}`;
  const imageCid = 'bafkreiimagecidforvercelexpense9876543210zyxwvutsrqpon';

  {
    const uploadReq = {
      method: 'POST',
      body: {
        cid: imageCid,
        fileName: 'groceries.png',
        dataUrl: samplePngDataUrl,
      },
    };
    const uploadRes = createMockRes();
    await uploadHandler(uploadReq, uploadRes);
    assert(uploadRes.statusCode === 200, 'Uploaded PNG receipt successfully');

    const getReq = {
      method: 'GET',
      query: { cid: imageCid },
      url: `/api/ipfs?cid=${imageCid}`,
    };
    const getRes = createMockRes();
    await ipfsHandler(getReq, getRes);

    assert(getRes.statusCode === 200, 'ipfs handler returns HTTP 200 for PNG image');
    assert(getRes.headers['content-type'] === 'image/png', 'ipfs handler sets Content-Type: image/png');
    assert(getRes.headers['content-disposition'].includes('inline'), 'ipfs handler sets Content-Disposition: inline');
  }

  // --- 5. Test IPFS Error & Missing Cases ---
  console.log('\n--- 5. /api/ipfs Missing and Non-Existent CIDs ---');
  {
    const reqEmpty = { method: 'GET', query: {}, url: '/api/ipfs' };
    const resEmpty = createMockRes();
    await ipfsHandler(reqEmpty, resEmpty);
    assert(resEmpty.statusCode === 400, 'Returns 400 when cid query is missing');

    const reqMissing = { method: 'GET', query: { cid: 'bafkreinonexistentcid0000000000' }, url: '/api/ipfs?cid=bafkreinonexistentcid0000000000' };
    const resMissing = createMockRes();
    await ipfsHandler(reqMissing, resMissing);
    assert(resMissing.statusCode === 404, 'Returns 404 when CID is not found');
  }

  // --- 6. Test Ledger State Handler ---
  console.log('\n--- 6. /api/ledger-state Endpoint ---');
  {
    const reqGet = { method: 'GET' };
    const resGet = createMockRes();
    await ledgerHandler(reqGet, resGet);
    assert(resGet.statusCode === 200, 'ledger-state returns HTTP 200 on GET');
    assert(resGet.getBody()?.persistence !== undefined, 'ledger-state returns persistence metadata');

    const testExpenseCid = 'bafkreiledgerexpensereceiptcid9999999999';
    const reqPost = {
      method: 'POST',
      body: {
        groups: [{ id: 1, name: 'Public Ledger', isPrivate: false, members: [] }],
        expenses: [{
          id: 'exp-test-vercel-1',
          title: 'Vercel Test Expense',
          totalAmount: 5000,
          ipfsCid: testExpenseCid,
          receiptFileName: 'test.pdf',
          receiptDataUrl: samplePdfDataUrl,
        }],
      },
    };
    const resPost = createMockRes();
    await ledgerHandler(reqPost, resPost);
    assert(resPost.statusCode === 200, 'ledger-state accepts POST state update');

    // Verify ipfsHandler can resolve receipt directly from ledger expense
    const reqFromLedger = { method: 'GET', query: { cid: testExpenseCid }, url: `/api/ipfs?cid=${testExpenseCid}` };
    const resFromLedger = createMockRes();
    await ipfsHandler(reqFromLedger, resFromLedger);
    assert(resFromLedger.statusCode === 200, 'ipfs handler resolves receipt directly from ledger-state expenses');
    assert(resFromLedger.headers['content-type'] === 'application/pdf', 'resolved receipt has Content-Type: application/pdf');
  }

  console.log('\n====================================================');
  console.log(`🎉 VERCEL ENDPOINTS TEST SUMMARY: ${passed} / ${total} passed!`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

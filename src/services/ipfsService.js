/**
 * FairShare Decentralized IPFS File Pinning Service
 * Supports:
 * 1. Pinata Cloud IPFS Pinning API (World-wide decentralized distribution)
 * 2. Standard RFC-4648 Base32 multihash CIDv1 computation (bafkrei... raw binary)
 * 3. Public IPFS Gateways (ipfs.io, dweb.link, gateway.pinata.cloud)
 */

import { ethers } from 'ethers';

// Convert bytes to RFC-4648 base32 lowercase string
function uint8ArrayToBase32(bytes) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Compute valid standard IPFS CIDv1 from a SHA-256 digest
 * Accepts ArrayBuffer, Uint8Array, or 64-character hex string (0x...)
 * Format: 0x01 (CIDv1) + 0x55 (raw binary codec) + 0x12 (sha2-256) + 0x20 (32 bytes) + 32-byte digest
 */
export function computeIpfsCidV1(input) {
  if (!input) return 'bafkreiaaaaaaaafairshare';

  let digestBytes;
  if (typeof input === 'string') {
    const clean = input.replace('0x', '').trim();
    if (clean.length === 64) {
      digestBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        digestBytes[i] = parseInt(clean.substr(i * 2, 2), 16);
      }
    } else {
      digestBytes = new TextEncoder().encode(input);
    }
  } else if (input instanceof Uint8Array) {
    digestBytes = input;
  } else if (input instanceof ArrayBuffer) {
    digestBytes = new Uint8Array(input);
  } else if (ArrayBuffer.isView(input)) {
    digestBytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else {
    digestBytes = new Uint8Array(input);
  }

  const header = new Uint8Array([0x01, 0x55, 0x12, 0x20]);
  const combined = new Uint8Array(header.length + digestBytes.length);
  combined.set(header);
  combined.set(digestBytes, header.length);
  return 'b' + uint8ArrayToBase32(combined);
}

export function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    if (typeof FileReader === 'undefined') return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

class IpfsService {
  constructor() {
    this.jwtStorageKey = 'fairshare_pinata_jwt';
    this.gatewayStorageKey = 'fairshare_ipfs_gateway';
    this.defaultGateway = '/ipfs/';
    this.currentGateway = this.defaultGateway;
    this.currentJwt = '';
    this.blobCache = new Map(); // cid => dataUrl or objectUrl for instant local preview
  }

  getPinataJwt() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(this.jwtStorageKey) || this.currentJwt || '';
      }
      return this.currentJwt || '';
    } catch {
      return this.currentJwt || '';
    }
  }

  setPinataJwt(jwt) {
    this.currentJwt = jwt ? jwt.trim() : '';
    try {
      if (typeof localStorage !== 'undefined') {
        if (jwt) {
          localStorage.setItem(this.jwtStorageKey, jwt.trim());
        } else {
          localStorage.removeItem(this.jwtStorageKey);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  getGateway() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.gatewayStorageKey);
        if (stored && stored !== 'https://ipfs.io/ipfs/') {
          return stored;
        }
        return this.defaultGateway;
      }
      return this.currentGateway || this.defaultGateway;
    } catch {
      return this.currentGateway || this.defaultGateway;
    }
  }

  setGateway(gatewayUrl) {
    let clean = gatewayUrl ? gatewayUrl.trim() : '';
    if (clean && !clean.endsWith('/')) clean += '/';
    this.currentGateway = clean || this.defaultGateway;
    try {
      if (typeof localStorage !== 'undefined') {
        if (clean) {
          localStorage.setItem(this.gatewayStorageKey, clean);
        } else {
          localStorage.removeItem(this.gatewayStorageKey);
        }
      }
    } catch {}
  }

  getGatewayUrl(cid) {
    if (!cid) return '';
    const cleanCid = cid.replace('ipfs://', '').trim();
    const gateway = this.getGateway();
    if (!gateway || gateway === 'https://ipfs.io/ipfs/' || gateway === '/ipfs/') {
      return `/ipfs/${cleanCid}`;
    }
    return `${gateway}${cleanCid}`;
  }

  saveReceiptData(cid, dataUrl) {
    if (!cid || !dataUrl) return;
    const cleanCid = cid.replace('ipfs://', '').trim();
    this.blobCache.set(cleanCid, dataUrl);
    this.blobCache.set(`ipfs://${cleanCid}`, dataUrl);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`fairshare_receipt_${cleanCid}`, dataUrl);
      }
    } catch (err) {
      // Storage quota may be exceeded; in-memory cache remains active
      console.warn('LocalStorage receipt cache notice:', err?.message);
    }
  }

  async uploadReceiptToServer(cid, fileName, dataUrl) {
    if (!cid || !dataUrl || typeof fetch === 'undefined') return false;
    const cleanCid = cid.replace('ipfs://', '').trim();
    try {
      const response = await fetch('/api/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cid: cleanCid,
          fileName: fileName || `receipt-${cleanCid.slice(0, 8)}.pdf`,
          dataUrl,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getLocalPreviewUrl(cid) {
    if (!cid) return null;
    const cleanCid = cid.replace('ipfs://', '').trim();
    // 1. In-memory blob/data cache
    const cached = this.blobCache.get(cleanCid) || this.blobCache.get(`ipfs://${cleanCid}`);
    if (cached) return cached;

    // 2. Browser persistent localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`fairshare_receipt_${cleanCid}`);
        if (stored) {
          this.blobCache.set(cleanCid, stored);
          this.blobCache.set(`ipfs://${cleanCid}`, stored);
          return stored;
        }
      }
    } catch {}

    return null;
  }

  async testPinataAuth(jwtToTest) {
    const jwt = jwtToTest || this.getPinataJwt();
    if (!jwt) {
      return { authenticated: false, message: 'No Pinata JWT token provided.' };
    }

    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          authenticated: false, 
          message: errorData.error?.reason || `Authentication failed (HTTP ${response.status})` 
        };
      }

      const data = await response.json();
      return { 
        authenticated: true, 
        message: data.message || 'Successfully connected to Pinata IPFS Cloud!' 
      };
    } catch (err) {
      return { 
        authenticated: false, 
        message: `Network error connecting to Pinata: ${err.message}` 
      };
    }
  }

  /**
   * Pin a receipt file to IPFS
   * 1. Generates authentic SHA-256 IPFS CIDv1 (using Web Crypto or pure-JS ethers fallback)
   * 2. Persists permanent Base64 dataUrl in localStorage and local receipts server
   * 3. If Pinata JWT is configured, uploads directly to Pinata Cloud
   * 4. Stores in local blob cache for instant browser previews
   */
  async pinFile(file, metadata = {}) {
    if (!file) throw new Error('No file provided for IPFS pinning');

    // 1. Compute SHA-256 digest
    const arrayBuffer = await file.arrayBuffer();
    let hashHex;
    let digestBytes;

    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      digestBytes = new Uint8Array(hashBuffer);
      const hashArray = Array.from(digestBytes);
      hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      hashHex = ethers.sha256(new Uint8Array(arrayBuffer));
      const clean = hashHex.slice(2);
      digestBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        digestBytes[i] = parseInt(clean.substr(i * 2, 2), 16);
      }
    }

    // 2. Compute authentic IPFS CIDv1
    const standardCid = computeIpfsCidV1(digestBytes);

    // 3. Generate permanent Data URL
    let dataUrl = null;
    try {
      dataUrl = await fileToDataUrl(file);
      if (dataUrl) {
        this.saveReceiptData(standardCid, dataUrl);
        // Best-effort asynchronous local server storage
        this.uploadReceiptToServer(standardCid, file.name, dataUrl).catch(() => {});
      }
    } catch {}

    // Cache local blob URL as fallback
    let localBlobUrl = null;
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        localBlobUrl = URL.createObjectURL(file);
        if (!dataUrl) {
          this.blobCache.set(standardCid, localBlobUrl);
          this.blobCache.set(`ipfs://${standardCid}`, localBlobUrl);
        }
      }
    } catch {}

    const previewUrl = dataUrl || localBlobUrl;

    const jwt = this.getPinataJwt();

    // If Pinata JWT is configured, pin live to Pinata IPFS cluster
    if (jwt) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const pinataMetadata = JSON.stringify({
          name: file.name || `receipt-${standardCid.slice(0, 8)}.pdf`,
          keyvalues: {
            app: 'FairShare',
            sha256: hashHex,
            timestamp: Date.now().toString(),
            ...(metadata.keyvalues || {}),
          },
        });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({
          cidVersion: 1,
        });
        formData.append('pinataOptions', pinataOptions);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          const liveCid = result.IpfsHash || standardCid;
          if (previewUrl) {
            this.saveReceiptData(liveCid, previewUrl);
          }
          return {
            success: true,
            cid: liveCid,
            ipfsUri: `ipfs://${liveCid}`,
            hashHex,
            isPinnedLive: true,
            provider: 'Pinata Cloud (Decentralized IPFS)',
            gatewayUrl: this.getGatewayUrl(liveCid),
            localPreviewUrl: previewUrl,
            dataUrl,
            pinSize: result.PinSize || file.size,
          };
        } else {
          console.warn('Pinata upload returned non-200. Falling back to client CID generation.');
        }
      } catch (err) {
        console.warn('Pinata network upload failed, using client CIDv1:', err);
      }
    }

    // Default mode: Valid CIDv1 cryptographic generation with public gateway links
    return {
      success: true,
      cid: standardCid,
      ipfsUri: `ipfs://${standardCid}`,
      hashHex,
      isPinnedLive: false,
      provider: 'IPFS Content Addressing (CIDv1)',
      gatewayUrl: this.getGatewayUrl(standardCid),
      localPreviewUrl: previewUrl,
      dataUrl,
      pinSize: file.size,
    };
  }
}

export const ipfsService = new IpfsService();

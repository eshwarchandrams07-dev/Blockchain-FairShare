/**
 * FairShare Decentralized IPFS File Pinning Service
 * Supports:
 * 1. Pinata Cloud IPFS Pinning API (World-wide decentralized distribution)
 * 2. Standard RFC-4648 Base32 multihash CIDv1 computation (bafkrei... raw binary)
 * 3. Public IPFS Gateways (ipfs.io, dweb.link, gateway.pinata.cloud)
 */

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
 * Format: 0x01 (CIDv1) + 0x55 (raw binary codec) + 0x12 (sha2-256) + 0x20 (32 bytes) + 32-byte digest
 */
export function computeIpfsCidV1(sha256ArrayBuffer) {
  const digestBytes = new Uint8Array(sha256ArrayBuffer);
  const header = new Uint8Array([0x01, 0x55, 0x12, 0x20]);
  const combined = new Uint8Array(header.length + digestBytes.length);
  combined.set(header);
  combined.set(digestBytes, header.length);
  return 'b' + uint8ArrayToBase32(combined);
}

class IpfsService {
  constructor() {
    this.jwtStorageKey = 'fairshare_pinata_jwt';
    this.gatewayStorageKey = 'fairshare_ipfs_gateway';
    this.defaultGateway = 'https://ipfs.io/ipfs/';
    this.blobCache = new Map(); // cid => objectUrl for instant local preview
  }

  getPinataJwt() {
    try {
      return localStorage.getItem(this.jwtStorageKey) || '';
    } catch {
      return '';
    }
  }

  setPinataJwt(jwt) {
    try {
      if (jwt) {
        localStorage.setItem(this.jwtStorageKey, jwt.trim());
      } else {
        localStorage.removeItem(this.jwtStorageKey);
      }
      return true;
    } catch {
      return false;
    }
  }

  getGateway() {
    try {
      return localStorage.getItem(this.gatewayStorageKey) || this.defaultGateway;
    } catch {
      return this.defaultGateway;
    }
  }

  setGateway(gatewayUrl) {
    try {
      if (gatewayUrl) {
        let clean = gatewayUrl.trim();
        if (!clean.endsWith('/')) clean += '/';
        localStorage.setItem(this.gatewayStorageKey, clean);
      } else {
        localStorage.removeItem(this.gatewayStorageKey);
      }
    } catch {}
  }

  getGatewayUrl(cid) {
    if (!cid) return '';
    const cleanCid = cid.replace('ipfs://', '').trim();
    // If we have a cached local blob URL for instant preview, fallback gracefully
    const gateway = this.getGateway();
    return `${gateway}${cleanCid}`;
  }

  getLocalPreviewUrl(cid) {
    if (!cid) return null;
    const cleanCid = cid.replace('ipfs://', '').trim();
    return this.blobCache.get(cleanCid) || null;
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
   * 1. Generates authentic SHA-256 IPFS CIDv1
   * 2. If Pinata JWT is configured, uploads directly to Pinata Cloud
   * 3. Stores in local blob cache for instant browser previews
   */
  async pinFile(file, metadata = {}) {
    if (!file) throw new Error('No file provided for IPFS pinning');

    // 1. Compute SHA-256 arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Compute authentic IPFS CIDv1
    const standardCid = computeIpfsCidV1(hashBuffer);

    // Cache local blob URL
    try {
      const blobUrl = URL.createObjectURL(file);
      this.blobCache.set(standardCid, blobUrl);
    } catch {}

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
          return {
            success: true,
            cid: liveCid,
            ipfsUri: `ipfs://${liveCid}`,
            hashHex,
            isPinnedLive: true,
            provider: 'Pinata Cloud (Decentralized IPFS)',
            gatewayUrl: this.getGatewayUrl(liveCid),
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
      pinSize: file.size,
    };
  }
}

export const ipfsService = new IpfsService();

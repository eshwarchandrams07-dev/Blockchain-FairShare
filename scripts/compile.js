import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractsDir = path.resolve(__dirname, '../contracts');
const outDir = path.resolve(__dirname, '../src/contracts');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sources = {
  'FairShare.sol': {
    content: fs.readFileSync(path.join(contractsDir, 'FairShare.sol'), 'utf8'),
  },
  'MockERC20.sol': {
    content: fs.readFileSync(path.join(contractsDir, 'MockERC20.sol'), 'utf8'),
  },
};

const input = {
  language: 'Solidity',
  sources,
  settings: {
    viaIR: true,
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

console.log('Compiling Solidity contracts...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

let hasErrors = false;
if (output.errors) {
  for (const err of output.errors) {
    if (err.severity === 'error') {
      console.error('COMPILE ERROR:', err.formattedMessage);
      hasErrors = true;
    } else {
      console.warn('COMPILE WARNING:', err.formattedMessage);
    }
  }
}

if (hasErrors) {
  console.error('Compilation failed due to errors.');
  process.exit(1);
}

for (const sourceFile in output.contracts) {
  for (const contractName in output.contracts[sourceFile]) {
    const contract = output.contracts[sourceFile][contractName];
    const contractData = {
      contractName,
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
    };
    const outFile = path.join(outDir, `${contractName}.json`);
    fs.writeFileSync(outFile, JSON.stringify(contractData, null, 2));
    console.log(`Successfully compiled and exported: ${contractName} -> ${outFile}`);
  }
}

console.log('Solidity compilation complete!');

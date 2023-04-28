const {
  Client,
  AccountId,
  PrivateKey,
  ContractUpdateTransaction,
  Timestamp,
} = require("@hashgraph/sdk");
const axios = require("axios");
require("dotenv").config();

console.clear();

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

// See README.md for more info
const pools = [
  {
    pairName: "HBARX SOF LP",
    pairAddress: "0xA06127077BC963c17160cDA03aa00082e88806A0",
  },
  {
    pairName: "Wrapped Hbar Lucky Token LP",
    pairAddress: "0x549b5ccE7eeBD38CC09F6547CB981Bf3825b9d06",
  },
  {
    pairName: "USD Coin rUSD LP",
    pairAddress: "0xba35d9fC4C0B422C680Ee8d628c2CCf44ee65f50",
  },
  {
    pairName: "DOVU Wrapped Hbar LP",
    pairAddress: "0x9DdA110649FB2969c705E23B338f6Ab093027AC9",
  },
  {
    pairName: "USD Coin HBARX LP",
    pairAddress: "0x6b15d05f55a60341D738250F78774cB395EcF05A",
  },
  {
    pairName: "USD Coin HeadStarter LP",
    pairAddress: "0x7E4e0a89ce690E6F5D4c9237A54E96dcc866065D",
  },
  {
    pairName: "Wrapped Hbar SOF LP",
    pairAddress: "0x9D87DfFB6b4c9D01F9545b49642ff6b0bBBFc3A4",
  },
  {
    pairName: "USD Coin Wrapped Hbar LP",
    pairAddress: "0x442AF81EaAD6C27D4c7e029C935603bAE96c66E8",
  },
  {
    pairName: "Wrapped Hbar LIL LP",
    pairAddress: "0xc8d4829279f50bF982433b4c850C5c3fBF1A9Bcc",
  },
  {
    pairName: "HBARX Calaxy Tokens LP",
    pairAddress: "0x8CB5bE7CCda89b4f1b2014a0b75D9cdf31c94E4b",
  },
  {
    pairName: "USD Coin MANTRA DAO LP",
    pairAddress: "0xe001dDE8f149a96B658ED8C6875a74C445927cdC",
  },
  {
    pairName: "USD Coin Dai Stablecoin LP",
    pairAddress: "0x6E38eCaBAbbA37FfB94150bd53c4593f72E1f920",
  },
  {
    pairName: "Calaxy Tokens Wrapped Hbar LP",
    pairAddress: "0x189079f6Bac1F07c99308Faaa380Ec0D14e62ee1",
  },
  {
    pairName: "Reuben Wrapped Hbar LP",
    pairAddress: "0x2296620dE98cB02A48DaDB339Bb11a1C9Fa92f43",
  },
  {
    pairName: "Wrapped Hbar Wrapped BTC LP",
    pairAddress: "0x9a41DE1112a920D491e064519D83Edee4Eb90703",
  },
  {
    pairName: "HBARX Wrapped Hbar LP",
    pairAddress: "0xD18f1922CFFA8f4BBc47793A6D198120447AD8E4",
  },
  {
    pairName: "HeadStarter Wrapped Hbar LP",
    pairAddress: "0x581f8294B4A0779d723bb4e289a1f4Ee4C196B6a",
  },
  {
    pairName: "USD Coin USD Coin LP",
    pairAddress: "0xf4D8e05ce43BEC2179A7bdc1313DC56B16Edd96A",
  },
  {
    pairName: "USD Coin Tether USD LP",
    pairAddress: "0x0a7A675861F1686dcb9E33dCfbe9Cc2F196eB9B2",
  },
  {
    pairName: "CREAM Wrapped Hbar LP",
    pairAddress: "0x49483A71140894D2381feD43F9dD3b6462FDe657",
  },
  {
    pairName: "Wrapped Hbar NoatyBlowsBC LP",
    pairAddress: "0x11C5BA23E7CfA42a999163242e86b9253284054e",
  },
  {
    pairName: "Wrapped Hbar PutinGrow LP",
    pairAddress: "0x9c4f289e3365986293379a2f07a437420985bdDf",
  },
  {
    pairName: "Wrapped Hbar BRAINS LP",
    pairAddress: "0xf7FBEd0CAbFa839Faaab2676fD6D37c189593CBc",
  },
  {
    pairName: "Wrapped Hbar HASHTREE LP",
    pairAddress: "0x6E6cdeBE922662464D20E0Df15636A28FB874a97",
  },
  {
    pairName: "SAUCE SOF LP",
    pairAddress: "0x2a4164F81aE882BF7a0A958622E22005e20A915a",
  },
  {
    pairName: "Wrapped Hbar Hedera Holdings LP",
    pairAddress: "0x31CE1372027A82171Fc1b15F18871fD56d17f81A",
  },
  {
    pairName: "Energy Trade Token MANTRA LP",
    pairAddress: "0xf981FA7D5db3Cf311E46D5E42EF052cEdB850234",
  },
  {
    pairName: "Wrapped Hbar Fish Coin LP",
    pairAddress: "0x27a5Fc7D40533e53245C4793ca985447E4374D74",
  },
  {
    pairName: "USD Coin SOF LP",
    pairAddress: "0x54fA7533012B4a1373fcFBadDE33a6dA6653e24f",
  },
  {
    pairName: "Tether USD rUSD LP",
    pairAddress: "0x07390065BbFEf3562A97C86C9B97b494DD9C06A7",
  },
  {
    pairName: "Hedera Holdings MC'sMessageMemeo LP",
    pairAddress: "0x906De1dE8412924986fc3c6F6496d4DaA1d2980a",
  },
  {
    pairName: "Wrapped Hbar NFTGodz LP",
    pairAddress: "0x70FBd57EF58b8Ad87046274342bf7aFeCe7DB246",
  },
  {
    pairName: "Wrapped Hbar GRAMZ LP",
    pairAddress: "0xA05C62f195D508E013A09f4Fa7CE7dDCb9B1C937",
  },
  {
    pairName: "USD Coin MANTRA LP",
    pairAddress: "0xd416A437F588762A1171056827925eaD246dA04b",
  },
  {
    pairName: "HBARX MANTRA LP",
    pairAddress: "0x362606Dc8ccAF2805d2E898da22156F353A2906E",
  },
  {
    pairName: "SAUCE Wrapped Hbar LP",
    pairAddress: "0x7a6153eEF8626819534e50b6a9A9b11D992ed6dD",
  },
  {
    pairName: "Energy Trade Token HbarSuite LP",
    pairAddress: "0x74c83727ED85b52B5b7f463F2425cDf1468a9205",
  },
  {
    pairName: "Wrapped Hbar WHALE LP",
    pairAddress: "0xfa65dD60f176B3Fb88EDDFad511706796a9Eb900",
  },
  {
    pairName: "Wrapped Hbar USD Coin LP",
    pairAddress: "0x88E1E76f39032a936CF80185f50e335e669aCa53",
  },
  {
    pairName: "Wrapped Hbar QUACK LP",
    pairAddress: "0xF68a4d27bac7E83F1867e35f46Eb16A633A7D0A0",
  },
  {
    pairName: "Energy Trade Token HBARX LP",
    pairAddress: "0x27b3B74d3E371901cc5b579B07E89f1cc0dBf4A7",
  },
  {
    pairName: "Wrapped Hbar MC'sMessageMemeo LP",
    pairAddress: "0xE6C16E3B4E86E0C5B93ae3C126FCD682DdBB30EC",
  },
  {
    pairName: "Wrapped Hbar Decentralized Hedge Fund Token LP",
    pairAddress: "0x387972AA050266bF329fFF2a7e530f60377FC5dC",
  },
  {
    pairName: "USD Coin Wrapped Ether[hts] LP",
    pairAddress: "0x92393d5e469B5E3ef5DDcE2EED2E002E1ebc3254",
  },
  {
    pairName: "BUDZ GRAMZ LP",
    pairAddress: "0xE97418354E8C4c2961F186fa9824461261ad62e2",
  },
  {
    pairName: "Wrapped Hbar MC's PEPE LP",
    pairAddress: "0x9a5aD85EaC8f3D176750b9D25ECf0e6930DE5556",
  },
  {
    pairName: "Wrapped Hbar BUDZ LP",
    pairAddress: "0x591699dB7A7112bfc0bd6d7A913B88ebc26bB220",
  },
  {
    pairName: "Tether USD Decentralized Hedge Fund Token LP",
    pairAddress: "0x2F3e71864178a93887E11bBee849d16D288C5B60",
  },
  {
    pairName: "Wrapped Hbar VIBEZ LP",
    pairAddress: "0x103e48D35781A7Ce56564dBb4553d169a959C130",
  },
  {
    pairName: "Wrapped Hbar Petal LP",
    pairAddress: "0xB50D35e59d06fAA546b92b9FbfA667B40AA4f734",
  },
  {
    pairName: "Wrapped Ether[hts] Tether USD LP",
    pairAddress: "0xdddCD22e0dA3D7982be87C0c3C5D2dAe95E384E7",
  },
  {
    pairName: "USD Coin Tether USD LP",
    pairAddress: "0x0D6515Faa00808c819435D9972C79b2748281bC8",
  },
  {
    pairName: "Wrapped Hbar Hedera Protocol LP",
    pairAddress: "0xe247e7c561276Ce5EA976cd2d483990498c7F5bD",
  },
  {
    pairName: "Wrapped BNB[hts] Decentralized Hedge Fund Token LP",
    pairAddress: "0xE6af53332246219551F90115a7702E10986C4cb3",
  },
  {
    pairName: "SAUCE HbarSuite LP",
    pairAddress: "0x9da6B937470432DA0523FCAAA007D69612067F69",
  },
  {
    pairName: "Wrapped Hbar Bonkerz LP",
    pairAddress: "0x130b90E3233b42A4d6B8084B48008bfc0ef01dF3",
  },
  {
    pairName: "USD Coin Wrapped BTC LP",
    pairAddress: "0x744488530bc80275e7e6854E031c99f994991891",
  },
  {
    pairName: "Wrapped Hbar Xoge LP",
    pairAddress: "0xDfFDC4c3A8554FEF34414a690D96053CFee42EaC",
  },
  {
    pairName: "Wrapped Hbar Tether USD LP",
    pairAddress: "0x6D0A18de90ea79c2f75Ac519861E0662f15E39B1",
  },
  {
    pairName: "HBARX Decentralized Hedge Fund Token LP",
    pairAddress: "0xa1e5428607468f2586A6442180071b9462D465Dd",
  },
  {
    pairName: "Tether USD Wrapped BTC LP",
    pairAddress: "0x069eE99943aA052a8FFA48A4d34EFA0E58b923c7",
  },
  {
    pairName: "Wrapped Hbar HASHTREE LP",
    pairAddress: "0x791940F4cFe9309B9766E2C3818145CAF8791E68",
  },
  {
    pairName: "Wrapped BTC Decentralized Hedge Fund Token LP",
    pairAddress: "0xA007436DF285216A4f6051B5Ee116b36B806DBc5",
  },
  {
    pairName: "ChainLink Token Decentralized Hedge Fund Token LP",
    pairAddress: "0x6cF5C072d71d29e7Ee57Be8B421A3246A408E088",
  },
  {
    pairName: "CREAM Decentralized Hedge Fund Token LP",
    pairAddress: "0x11e4C75c824AEe0B5d5302DfB044676C7cEE2561",
  },
  {
    pairName: "USD Coin Decentralized Hedge Fund Token LP",
    pairAddress: "0x5c5A02B5C059ef7a9408b24eCc070b346196b981",
  },
  {
    pairName: "SAUCE Decentralized Hedge Fund Token LP",
    pairAddress: "0x5172391FDE0D6eC5789aA003bE49D21AeD6cEb50",
  },
  {
    pairName: "Wrapped Ether[hts] Decentralized Hedge Fund Token LP",
    pairAddress: "0x23B8c670442d9a5Efbf62A669Fe8eb2EE13506D0",
  },
  {
    pairName: "Dai Stablecoin Decentralized Hedge Fund Token LP",
    pairAddress: "0x53E09a52D766CCbC11899d8c99b742945b6Eb765",
  },
  {
    pairName: "USD Coin Decentralized Hedge Fund Token LP",
    pairAddress: "0xc13d17Ff0366be91ee802Cbb2d4fcE0083707a06",
  },
  {
    pairName: "Wrapped Hbar MANTRA LP",
    pairAddress: "0xB62DC6E5f021Dc2E1Acc61F9fdd66b768F59622e",
  },
  {
    pairName: "USD Coin KHK LP",
    pairAddress: "0x90959684aBD6013Ed1A2C2822d36a4CE2a740BF0",
  },
  {
    pairName: "Tether USD KHK LP",
    pairAddress: "0x71E02B4f214B168798d90174d3EF7F7CBb542af1",
  },
  {
    pairName: "MANTRA KHK LP",
    pairAddress: "0xcd8d7bAf1eEdCA9C48bfD903141669d25E5Ae617",
  },
  {
    pairName: "HbarSuite Wrapped Hbar LP",
    pairAddress: "0x0bA07d52B1894593FA3270e88728AD2D37021bE4",
  },
  {
    pairName: "USD Coin KHK LP",
    pairAddress: "0x47835939062Bc475490ADd35FAE5fcdEC6DaBf95",
  },
  {
    pairName: "HbarSuite Decentralized Hedge Fund Token LP",
    pairAddress: "0xBbF0DE872084501b9eFCAC7ab62faA21D02f6D8a",
  },
  {
    pairName: "Wrapped Hbar KHK LP",
    pairAddress: "0x37522f48Cad2aB403e391Dd0B7Daa5D8EA2c0F79",
  },
  {
    pairName: "HBARX KHK LP",
    pairAddress: "0x9283e675003008004973461715fEA181a8164E6d",
  },
  {
    pairName: "Dai Stablecoin KHK LP",
    pairAddress: "0x72214678d1d984cd76aC8DAF29Ab60e9364b7E4B",
  },
  {
    pairName: "Wrapped Matic[hts] Decentralized Hedge Fund Token LP",
    pairAddress: "0x5AcA0ce5d24417d0E097a20f1e12D11b069c6de9",
  },
  {
    pairName: "MANTRA Decentralized Hedge Fund Token LP",
    pairAddress: "0x90e948717E509e9af7Ffae4996fE5cd6A4c89388",
  },
  {
    pairName: "Wrapped Hbar Spoiled LP",
    pairAddress: "0xf00b8e6C6C6372f5f63a6c875002c12eE0e4F0d0",
  },
  {
    pairName: "Wrapped Hbar PBAR LP",
    pairAddress: "0x961147B21D222312e2fa8C41e9BbF2126Eb89fa6",
  },
  {
    pairName: "Wrapped Hbar Salt LP",
    pairAddress: "0xCf617b80319eB859F96f197989de70c7Da44E926",
  },
  {
    pairName: "Wrapped Hbar HeliSwap LP",
    pairAddress: "0x3904ad0E5c86c9C3Ac452cD61afE1776BF92Cecd",
  },
  {
    pairName: "TRIPPY APE COIN 🐵 Trippy Punk Coin  LP",
    pairAddress: "0xFbc8DF7a950556413485Af86097B10Fd9a8d9A1A",
  },
  {
    pairName: "TRIPPY APE COIN 🐵 Wrapped Hbar LP",
    pairAddress: "0xF9eEC4F1B074a2c1de32a34f9f99564985799C7a",
  },
  {
    pairName: "HeadStarter USD Coin LP",
    pairAddress: "0x781F2a3818245043C97679690D34DB2ca275D7E6",
  },
  {
    pairName: "USD Coin HeliSwap LP",
    pairAddress: "0x657194d752Cb399Cfc7Ed0550FC3c23c3ac4e773",
  },
  {
    pairName: "JAM Wrapped Hbar LP",
    pairAddress: "0x5cb7F7164df83557C791374d4F474149D2117C41",
  },
  {
    pairName: "Energy Trade Token Wrapped Hbar LP",
    pairAddress: "0xB1EAF5bbb341Ffb676f49Ab8bA2714C398d8b164",
  },
  {
    pairName: "DICK COIN 🍆 CUM COIN 💦 LP",
    pairAddress: "0x7f76A37B7915210FF21c039c12154f8884128A48",
  },
  {
    pairName: "USD Coin Xoge LP",
    pairAddress: "0x40fBA927aeF76F5F6e6bc4263B9b98De302B883C",
  },
  {
    pairName: "Wrapped Ether[hts] Wrapped Hbar LP",
    pairAddress: "0x8164516Ca825293c46E5EEFE3Cff44B38B9227ab",
  },
  {
    pairName: "USD Coin Xoge LP",
    pairAddress: "0x9DDf6CFB825ADB4458fEaEe71142c2e1d5D9477E",
  },
  {
    pairName: "DICK COIN 🍆 PUSSY COIN 🌸 LP",
    pairAddress: "0x02298b30C2aA641ec2Ed642125e3BF962C0637d5",
  },
  {
    pairName: "DICK COIN 🍆 Wrapped Hbar LP",
    pairAddress: "0xD36b6f37B825A22b0c4552C7807AE7663E68F810",
  },
  {
    pairName: "DICK COIN 🍆 Calaxy Tokens LP",
    pairAddress: "0x606854f6dBA29caf562D5671550987DD7E159aea",
  },
  {
    pairName: "MANTRA HeliSwap LP",
    pairAddress: "0x58B9c4815f8F3D46928E1765BD2b024b82A9c77e",
  },
  {
    pairName: "TRIPPY APE COIN 🐵 Calaxy Tokens LP",
    pairAddress: "0x17B86812b12ff4bbaaaB99C508b889B4e8eBd90A",
  },
  {
    pairName: "HeadStarter MANTRA LP",
    pairAddress: "0x04e10493D0A4724f1B9A11516270175321762fC4",
  },
  {
    pairName: "SOF HeliSwap LP",
    pairAddress: "0x0aA81a482DA9A402063B5E48066620f7F46ea171",
  },
  {
    pairName: "QUACK HeliSwap LP",
    pairAddress: "0x095CC0bF1e0482599DD565CB3543c307DD788e6a",
  },
  {
    pairName: "MemeCity HeliSwap LP",
    pairAddress: "0x3e294197feB7bA7C9F738D6b8020741250AB5940",
  },
  {
    pairName: "HeadStarter HeliSwap LP",
    pairAddress: "0xa501B838Ce05670a7fc59062E90B78dd0631Bef7",
  },
  {
    pairName: "HeadStarter GRELF LP",
    pairAddress: "0xa4aAa1a2B2cA0a34d2039e970edD231b3b8d416a",
  },
  {
    pairName: "JAM HeliSwap LP",
    pairAddress: "0x9df76CaeEbdA5C7f7E13769c49e7CDc809FD3fFa",
  },
  {
    pairName: "HeadStarter WHALE LP",
    pairAddress: "0x42ab31dC14de6787F82e236c7b17F22C29892BAd",
  },
  {
    pairName: "USD Coin HeliSwap LP",
    pairAddress: "0xEc9396Fd1019a6644534Ce7905183F495bC86baf",
  },
  {
    pairName: "KHK WHALE LP",
    pairAddress: "0x9869aD7Ee5E503b37daCDb072a1a2d96a6874e41",
  },
  {
    pairName: "SAUCE KHK LP",
    pairAddress: "0xA07B79793e6Eb105d88d82d249E5B41603f4976a",
  },
  {
    pairName: "HbarSuite HeliSwap LP",
    pairAddress: "0xf81434b0924C1fE8E4558d263Fc77A2c3e0c7ecd",
  },
  {
    pairName: "Wrapped Hbar Love LP",
    pairAddress: "0xc332A4132C3aE48142860b7639C1F43105910B5B",
  },
  {
    pairName: "KHK HeliSwap LP",
    pairAddress: "0xF142200F5195E5802EBAD1e13788ec806F57C0c8",
  },
  {
    pairName: "MANTRA GRELF LP",
    pairAddress: "0xde7FAFF219bb968a09B0d4aec043D14F63925550",
  },
  {
    pairName: "SAUCE MANTRA LP",
    pairAddress: "0xED26482532593309B929cd484D3bC94d51A0d391",
  },
  {
    pairName: "Calaxy Tokens HeliSwap LP",
    pairAddress: "0x7eA5C6153aFC2Dd1B9503c02D6eA344eBb9C6D28",
  },
  {
    pairName: "KHK GRELF LP",
    pairAddress: "0xCA6e6938159fA4B0f6B6c34a63e4EC6DeecBbB9d",
  },
  {
    pairName: "WHALE HeliSwap LP",
    pairAddress: "0xBeD14f5e8dCf9fDcFD9f487884e5A899BCE48c03",
  },
  {
    pairName: "LIL HeliSwap LP",
    pairAddress: "0xB552a6C5D6Cb3602aE34b83EEd22Df13E037Adb0",
  },
  {
    pairName: "DOVU HeliSwap LP",
    pairAddress: "0xeFbB5200f3aD0209e84bE08B40127C1D8Fd9Ca70",
  },
  {
    pairName: "CREAM HeliSwap LP",
    pairAddress: "0x5c93f5Dbb67da372CC1790cfd450Ad9D083BF166",
  },
  {
    pairName: "Shibar Love LP",
    pairAddress: "0xE2223075e6fC2a438933d2a026D6162F97838696",
  },
  {
    pairName: "HbarSuite Love LP",
    pairAddress: "0x9549d5469314061960E8B630A5B15f0f5a2C172e",
  },
  {
    pairName: "HeliSwap RARE LP",
    pairAddress: "0xF2E5868582287636fcAD1f76e855DEddE3Ee404D",
  },
  {
    pairName: "Wrapped Hbar Sweasel LP",
    pairAddress: "0x27bfD16619A097a8eFDf3834d1f3f01892743B58",
  },
  {
    pairName: "Tether USD TrueUSD LP",
    pairAddress: "0x6E96D2D7250fB9a648f4f2Ea2d10F2fDCC9D3581",
  },
];

const farms = [
  {
    address: "0x0000000000000000000000000000000000202107",
  },
  {
    address: "0x000000000000000000000000000000000016a987",
  },
  {
    address: "0x0000000000000000000000000000000000151255",
  },
  {
    address: "0x000000000000000000000000000000000014371f",
  },
  {
    address: "0x00000000000000000000000000000000002020Ff",
  },
  {
    address: "0x000000000000000000000000000000000014372C",
  },
  {
    address: "0x000000000000000000000000000000000014372b",
  },
  {
    address: "0x00000000000000000000000000000000002020Fc",
  },
  {
    address: "0x0000000000000000000000000000000000159b13",
  },
  {
    address: "0x0000000000000000000000000000000000143717",
  },
  {
    address: "0x000000000000000000000000000000000014371D",
  },
  {
    address: "0x00000000000000000000000000000000001eDB9E",
  },
  {
    address: "0x00000000000000000000000000000000001e7033",
  },
  {
    address: "0x000000000000000000000000000000000014371C",
  },
  {
    address: "0x0000000000000000000000000000000000161eeF",
  },
  {
    address: "0x0000000000000000000000000000000000143725",
  },
  {
    address: "0x000000000000000000000000000000000020210D",
  },
  {
    address: "0x0000000000000000000000000000000000143702",
  },
  {
    address: "0x0000000000000000000000000000000000159b09",
  },
  {
    address: "0x000000000000000000000000000000000020210A",
  },
  {
    address: "0x00000000000000000000000000000000001E4E4F",
  },
  {
    address: "0x0000000000000000000000000000000000143719",
  },
  {
    address: "0x000000000000000000000000000000000014372d",
  },
  {
    address: "0x0000000000000000000000000000000000143706",
  },
  {
    address: "0x0000000000000000000000000000000000143721",
  },
  {
    address: "0x000000000000000000000000000000000016a142",
  },
  {
    address: "0x0000000000000000000000000000000000143715",
  },
  {
    address: "0x00000000000000000000000000000000001593De",
  },
  {
    address: "0x0000000000000000000000000000000000143728",
  },
  {
    address: "0x0000000000000000000000000000000000143731",
  },
  {
    address: "0x000000000000000000000000000000000014371e",
  },
  {
    address: "0x00000000000000000000000000000000002020f2",
  },
  {
    address: "0x0000000000000000000000000000000000202103",
  },
  {
    address: "0x00000000000000000000000000000000001f0ECE",
  },
  {
    address: "0x00000000000000000000000000000000002020f7",
  },
  {
    address: "0x00000000000000000000000000000000002020f4",
  },
  {
    address: "0x00000000000000000000000000000000001EDba3",
  },
  {
    address: "0x0000000000000000000000000000000000202105",
  },
];

// Init client
const client = Client.forMainnet().setOperator(operatorId, operatorKey);

async function updateContractExpiry(contractId: string, days: number) {
  //Create the transaction
  const transaction = await new ContractUpdateTransaction()
    .setContractId(contractId)
    .setExpirationTime(
      Timestamp.generate().plusNanos(days * 24 * 60 * 60 * 1000000000)
    )
    .freezeWith(client);

  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txResponse = await transaction.execute(client);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the consensus status of the transaction
  const transactionStatus = receipt.status;

  console.log(
    "The consensus status of the transaction is " + transactionStatus
  );
}

async function getHederaIds(dataToExtract: any, addressProp: any) {
  const extractedData = [];
  for (let i = 0; i < dataToExtract.length; i++) {
    const response = await axios(
      `https://mainnet-public.mirrornode.hedera.com/api/v1/contracts/${dataToExtract[i][addressProp]}`
    );
    const { data } = response;
    const { contract_id } = data;

    extractedData.push(contract_id);
  }

  return extractedData;
}

async function main() {
  // Mainnet ids for Factories and Router
  const dexFactory = "0.0.1262116";
  const dexRouter = "0.0.1262126";
  const yfFactory = "0.0.1262136";
  const lockdrop = "0.0.1937789";
  const whbar = "0.0.1015433";

  const claimdrop1 = "0.0.2016834";
  const claimdrop2 = "0.0.2030127";
  const claimdrop3 = "0.0.2035362";
  const claimdrop4 = "0.0.2080670";

  const multisig1 = "0.0.1933574";
  const multisig2 = "0.0.1933606";
  const multisig3 = "0.0.1933614";

  const transferContract1 = "0.0.1993684";
  const transferContract2 = "0.0.2023712";

  // const poolIds = await getHederaIds(pools, "pairAddress");
  // const farmIds = await getHederaIds(farms, "address");

  // console.log('poolIds', poolIds);
  // console.log('farmIds', farmIds);

  const days = 91;

  // Extend one by one contracts
  const contractId = whbar;
  console.log(`Extending contract for id ${contractId}...`);
  await updateContractExpiry(contractId, days);
  console.log("✅ Contract extended!");

  // Extend all pool contracts
  /*
  for (let i = 0; i < poolIds.length; i++) {
    console.log(`Extending contract for id ${poolIds[i]}...`);
    await updateContractExpiry(poolIds[i], days);
    console.log("✅ Contract extended!");
  }
  */

  // Extend all farms contracts
  /*
  for (let i = 0; i < farmIds.length; i++) {
    console.log(`Extending contract for id ${farmIds[i]}...`);
    await updateContractExpiry(farmIds[i], days);
    console.log("✅ Contract extended!");
  }
  */
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

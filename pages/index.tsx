import Head from "next/head";
import Image from "next/image";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ColorMode,
  DAppClient,
  Network,
  NetworkType,
  TezosOperationType,
} from "@airgap/beacon-sdk";
import {
  faArrowUpRightFromSquare,
  faEllipsis,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";
import { SyntheticEvent, useState } from "react";
import {
  Button,
  createTheme,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
} from "@mui/material";

import Stats from "../components/Stats";
import fetcher from "../fetcher/fetcher";
import FAIcon from "../components/FAIcon";
import Sex from "../components/Sex";

import styles from "../styles/Home.module.css";

export interface SeriesFilter {
  minId: number;
  maxId: number;
  supply: number;
}

const RevealRequestTime = ({ tokenId }) => {
  const queryUrl = `https://api.tzkt.io/v1/accounts/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?type=transaction&entrypoint=assignMetadata&limit=100&parameter=${tokenId}`;
  const { data } = useSWR(queryUrl, fetcher);

  if (!data) {
    return null;
  }

  const operationUnboxing = data.find(
    ({ parameter }) => parameter.value === tokenId
  );

  if (!operationUnboxing) {
    console.log("Operation unboxing not found");
    return null;
  }
  // const ownerAddress = operationUnboxing.sender.address;
  const unboxingTime = new Date(operationUnboxing.timestamp).toLocaleString();
  return <>{unboxingTime}</>;
};

const Dog = ({ operation }) => {
  if (!operation) {
    return (
      <div className={styles.cardLoading}>
        <FAIcon icon={faEllipsis} size={32} />
      </div>
    );
  }

  const parameter = operation.parameter;
  const revealDateTime = new Date(operation.timestamp).toLocaleString();
  const metadata = parameter.value.metadata;

  const tokenId = parameter.value.token_id;
  const dogUrlMarketplace = `https://marketplace.dogami.com/dog/${tokenId}`;

  const attributes = metadata.attributes;
  const rarityScore = attributes.n;
  const sexe = attributes.h;
  const race = attributes.c;

  const artifactUri = hex_to_ascii(metadata.thumbnailUri);
  const hashIpfs = artifactUri.replace("ipfs://", "");
  const displayArtifactUri = `https://nft-zzz.mypinata.cloud/ipfs/${hashIpfs}`;

  return (
    <div className={styles.card}>
      <Image src={displayArtifactUri} alt="" width={350} height={350} />
      <div className={styles.tokenId}>#{tokenId}</div>
      <div className={styles.cardInfo}>
        <ul className={styles.infoList}>
          <li>
            <h3>
              {race} <Sex sex={sexe} />
            </h3>
          </li>
          <li>
            <strong>Rarity Score:</strong>
            <span>{rarityScore}</span>
          </li>
          <li>
            <strong>Reveal Request Time:</strong>
            <span>
              <RevealRequestTime tokenId={tokenId} />
            </span>
          </li>
          <li>
            <strong>Reveal Time:</strong>
            <span>{revealDateTime}</span>
          </li>
        </ul>
        <a
          className={styles.link}
          target="_blank"
          href={dogUrlMarketplace}
          rel="noreferrer"
        >
          Marketplace <FAIcon icon={faArrowUpRightFromSquare} size={16} />
        </a>
      </div>
    </div>
  );
};

const Dogs = ({ minId, maxId }: Pick<SeriesFilter, "minId" | "maxId">) => {
  const pageSize = 30;
  const [pageIndex, setPageIndex] = useState(0);

  const { data, size, setSize } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      // reached the end
      if (previousPageData && !previousPageData.length) {
        return null;
      }
      // first page, we don't have `previousPageData`
      if (pageIndex === 0)
        return `https://api.tzkt.io/v1/accounts/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?type=transaction&entrypoint=reveal&limit=${pageSize}&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}`;

      // add the cursor to the API endpoint
      return `https://api.tzkt.io/v1/accounts/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?type=transaction&entrypoint=reveal&limit=${pageSize}
        &parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}}&lastId=${
        previousPageData[previousPageData.length - 1].id
      }`;
    },
    fetcher
  );

  if (!data) {
    return null;
  }

  const operations = data?.flatMap((op) => op);
  const dogs = operations.map((op) => <Dog key={op.hash} operation={op} />);

  return (
    <>
      <div className={styles.grid}>{dogs}</div>
      <div className={styles.loadMore}>
        {dogs.length > 0 && (
          <Button variant="outlined" onClick={() => setSize(size + 1)}>
            Load More
          </Button>
        )}
      </div>
    </>
  );
};

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

const options = [
  {
    value: {
      minId: 1,
      maxId: 8000,
      supply: 8000,
    },
    label: "Serie 1",
  },
  {
    value: {
      minId: 8001,
      maxId: 12000,
      supply: 4000,
    },
    label: "Serie 2",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: SyntheticEvent, value: number) => {
    console.log("select serie", options[value].value);
    setActiveTab(value);
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={styles.container}>
          <Head>
            <title>Beware of poodle thieves</title>
            <meta
              name="description"
              content="Follow dogami reveal events in live"
            />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <SWRConfig
            value={{
              refreshInterval: 60000,
              fetcher: (resource, init) =>
                fetch(resource, init).then((res) => res.json()),
            }}
          >
            <main className={styles.main}>
              <h1 className={styles.title}>
                DogaReveal <small>by Dare</small>
              </h1>
              <Tabs
                className={styles.select}
                value={activeTab}
                onChange={handleTabChange}
                centered
              >
                {options.map(({ label }, index) => (
                  <Tab key={index} label={label} />
                ))}
              </Tabs>
              <div className={styles.stats}>
                <Stats {...options[activeTab].value} />
              </div>
              <Dogs {...options[activeTab].value} />
            </main>
          </SWRConfig>
          <footer className={styles.footer}>
            <a onClick={donate}>
              Donate to dogareveal.tez
              <FontAwesomeIcon
                width={16}
                height={16}
                icon={faHandHoldingHeart}
                className={styles.donate}
              />
            </a>
          </footer>
        </div>
      </ThemeProvider>
    </>
  );
}

const network: Network = { type: NetworkType.MAINNET };

function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

export async function donate() {
  // Create a new DAppClient instance
  const dAppClient = new DAppClient({
    name: "Dogareveal",
    preferredNetwork: network.type,
  });

  let myAddress: string | undefined;

  // OPTIONAL: Set the color mode
  // Read the current theme of the docs page from local storage. This depends on your dApp state
  const theme = localStorage.getItem("theme");
  await dAppClient.setColorMode(
    theme === "dark" ? ColorMode.DARK : ColorMode.LIGHT
  );
  // This code should be called every time the page is loaded or refreshed to see if the user has already connected to a wallet.
  const activeAccount = await dAppClient.getActiveAccount();
  if (activeAccount) {
    // If defined, the user is connected to a wallet.
    // You can now do an operation request, sign request, or send another permission request to switch wallet
    console.log("Already connected:", activeAccount.address);
  } else {
    // The user is NOT connected to a wallet.

    // The following permission request should not be called on pageload,
    // it should be triggered when the user clicks on a "connect" button on your page.
    // This will trigger the pairing alert UI where the user can select which wallet to pair.
    const permissions = await dAppClient.requestPermissions({
      network: network,
    });
    console.log("New connection: ", permissions.address);
  }

  // At this point we are connected to an account.
  // Let's send a simple transaction to the wallet that sends 1 mutez to ourselves.
  const response = await dAppClient.requestOperation({
    operationDetails: [
      {
        kind: TezosOperationType.TRANSACTION,
        destination: "tz1cHbBAVgPSaTZqL3PMBpDPqYg9EdzrWGEM", // Send to ourselves
        amount: "1000000", // Amount in mutez, the smallest unit in Tezos
      },
    ],
  });

  console.log("Operation Hash:", response.transactionHash);

  // Let's generate a link to see the transaction on a block explorer
  const explorerLink = await dAppClient.blockExplorer.getTransactionLink(
    response.transactionHash,
    network
  );

  console.log("Block Explorer:", explorerLink);

  // TODO: Remove temporary workaround in sandbox
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // If you want to "disconnect" a wallet, clear the active account.
  // This means the next time the active account is checked or a permission request is triggered, it will be like it's the users first interaction.
  await dAppClient.clearActiveAccount();
}

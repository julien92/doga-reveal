import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import Select from "react-select";
import makeAnimated from "react-select/animated";

import useSWR, { Fetcher, SWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ColorMode,
  DAppClient,
  Network,
  NetworkType,
  ParametersInvalidBeaconError,
  TezosOperationType,
} from "@airgap/beacon-sdk";
import {
  faArrowUpRightFromSquare,
  faEllipsis,
  faHandHoldingHeart,
  faMars,
  faVenus,
} from "@fortawesome/free-solid-svg-icons";
import React from "react";

const { encode, decode } = require("./");
interface FAIconProps {
  icon: IconDefinition;
  size?: number;
}

interface Series {
  minId: number;
  maxId: number;
  supply: number;
}

const FAIcon = ({ icon, size = 24 }: FAIconProps) => (
  <FontAwesomeIcon width={size} height={size} icon={icon} />
);

const fetcher: Fetcher<any, any> = (url) => fetch(url).then((r) => r.json());

const Sex = ({ sex }: { sex: "Male" | "Female" }) => {
  return sex === "Male" ? (
    <FAIcon size={16} icon={faMars} />
  ) : (
    <FAIcon size={16} icon={faVenus} />
  );
};

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

const Stats = ({ minId, maxId, supply }: Series) => {
  const initialSize = 9;

  const { data } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      console.log("pageIndex --", pageIndex);
      console.log("minId", maxId);
      console.log("maxId", maxId);
      // reached the end
      if (previousPageData && !previousPageData.length) {
        console.log("reached the end");
        return null;
      }
      console.log("previousPageData", previousPageData);
      // first page, we don't have `previousPageData`
      if (pageIndex === 0)
        return `https://api.tzkt.io/v1/accounts/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?type=transaction&entrypoint=reveal&limit=1000&sort=Ascending&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}`;

      // add the cursor to the API endpoint
      return `https://api.tzkt.io/v1/accounts/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?type=transaction&entrypoint=reveal&limit=1000&sort=Ascending
      &parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}}&lastId=${
        previousPageData[previousPageData.length - 1].id
      }`;
    },
    fetcher,
    { initialSize }
  );

  console.log(data);
  if (!data) {
    return null;
  }

  const operations = data.flatMap((op) => op).reverse();
  const totalRevealed = operations.length;
  console.log("Total already revealed", totalRevealed);

  let diamondCounter = 0;
  let goldCounter = 0;
  let silverCounter = 0;
  let bronzeCounter = 0;

  const totalDiams = (supply * 2) / 100;
  const totalGold = (supply * 8) / 100;
  const totalSilver = (supply * 30) / 100;
  const totalBronze = (supply * 60) / 100;

  operations.forEach(function (op) {
    const attributes = op.parameter.value.metadata.attributes;
    const rarity = attributes.o;
    switch (rarity) {
      case "Diamond": {
        diamondCounter++;
        break;
      }
      case "Gold": {
        goldCounter++;
        break;
      }
      case "Silver": {
        silverCounter++;
        break;
      }
      case "Bronze": {
        bronzeCounter++;
        break;
      }
    }
  });

  const arroundTwoDecimal = (value) => {
    return Math.floor(value * 100) / 100;
  };

  const diamsPourcentageRemaining = arroundTwoDecimal(
    ((totalDiams - diamondCounter) / (supply - totalRevealed)) * 100
  );

  const goldPourcentageRemaining = arroundTwoDecimal(
    ((totalGold - goldCounter) / (supply - totalRevealed)) * 100
  );

  const silverPourcentageRemaining = arroundTwoDecimal(
    ((totalSilver - silverCounter) / (supply - totalRevealed)) * 100
  );

  const bronzePourcentageRemaining = arroundTwoDecimal(
    ((totalBronze - bronzeCounter) / (supply - totalRevealed)) * 100
  );

  console.log();
  console.log("Diamond counter", diamondCounter);
  console.log("Diamond pourcentage", diamsPourcentageRemaining);
  console.log("Gold counter", goldCounter);
  console.log("Gold pourcentage", goldPourcentageRemaining);
  console.log("Silver counter", silverCounter);
  console.log("Silver pourcentage", silverPourcentageRemaining);
  console.log("Zronze counter", bronzeCounter);
  console.log("Silver pourcentage", bronzePourcentageRemaining);

  return (
    <div className={styles.stats}>
      <div>
        Bronze:
        <span
          style={{ color: bronzePourcentageRemaining >= 60 ? "red" : "green" }}
        >
          {bronzePourcentageRemaining}%
        </span>
      </div>
      <div>
        Silver:
        <span
          style={{ color: silverPourcentageRemaining > 30 ? "green" : "red" }}
        >
          {silverPourcentageRemaining}%
        </span>
      </div>
      <div>
        Gold:
        <span style={{ color: goldPourcentageRemaining > 8 ? "green" : "red" }}>
          {goldPourcentageRemaining}%
        </span>
      </div>
      <div>
        Diamond:
        <span
          style={{ color: diamsPourcentageRemaining > 2 ? "green" : "red" }}
        >
          {diamsPourcentageRemaining}%
        </span>
      </div>
    </div>
  );
};

const Dogs = ({ minId, maxId, supply }: Series) => {
  const nbDogs = 30;
  const url = `https://api.tzkt.io/v1/accounts/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?type=transaction&entrypoint=reveal&limit=${nbDogs}&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}`;
  const { data: operations } = useSWR(url, fetcher);

  if (!operations) {
    return null;
  }

  const dogs = operations.map((op) => <Dog key={op.hash} operation={op} />);

  return <>{dogs}</>;
};

export default function Home() {
  const serie1: Series = {
    minId: 1,
    maxId: 8000,
    supply: 8000,
  };

  const serie2: Series = {
    minId: 8001,
    maxId: 12000,
    supply: 4000,
  };

  const [serieSelected, setSerieSelected] = React.useState(serie1);

  const animatedComponents = makeAnimated();

  const handleChange = (e) => {
    console.log("select serie", e.value);
    setSerieSelected(e.value);
  };

  const options = [
    { value: serie1, label: "Serie 1" },
    { value: serie2, label: "Serie 2" },
  ];

  // TODO SELECT SERIE WITH A SELECTOR
  return (
    <>
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
            <div className={styles.select}>
              <Select
                components={animatedComponents}
                defaultValue={[options[0]]}
                onChange={handleChange}
                options={options}
              />
            </div>
            <div>
              <Stats {...serieSelected} />
            </div>
            <div className={styles.grid}>
              <Dogs {...serieSelected} />
            </div>
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

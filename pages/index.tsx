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
import Donation from "../components/Donation";

export const SMARTCONTRACT_ADDRESS_V1 = "KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe";
export const SMARTCONTRACT_ADDRESS_V2 = "KT1TjHyHTnL4VMQQyD75pr3ZTemyPvQxRPpA";
export const LAST_ID_SERIE1_V2 = 256620294;
const LAST_SILVER_SERIE1_V2_ID = 256620639;
const LAST_GOLD_SERIE1_V2_ID = 256655605;
// TODO Retrieve Diamond value
const LAST_DIAMOND_SERIE1_V2_ID = "unknow";

export interface SeriesFilter {
  serieId: number;
  minId: number;
  maxId: number;
  supply: number;
}

const RevealRequestTime = ({ tokenId, id }) => {
  const smartContractAddressToUse =
    id < LAST_ID_SERIE1_V2
      ? SMARTCONTRACT_ADDRESS_V1
      : SMARTCONTRACT_ADDRESS_V2;
  const queryUrl = `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=assignMetadata&limit=100&parameter=${tokenId}`;
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

  const id = operation.id;
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
              <RevealRequestTime tokenId={tokenId} id={id} />
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

const Dogs = ({ serieId, minId, maxId, tiersFilter }) => {
  const pageSize = 30;

  const tierAvaiable = ["Diamond", "Silver", "Bronze", "Gold"];
  console.log(tierAvaiable);
  console.log("tier filter", tiersFilter);
  let tierParamArray = ["Diamond", "Silver", "Bronze", "Gold"];
  console.log("before filter", tierParamArray);
  if (tiersFilter.length) {
    tierParamArray = tierAvaiable.filter((tier) => tiersFilter.includes(tier));
  }

  if (tierParamArray.length === 1) {
    tierParamArray.push(tierParamArray[0]);
  }

  console.log("after filter", tierParamArray);
  const tierParam = tierParamArray.join(",");

  const { data, size, setSize } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      // reached the end
      let smartContractAddressToUse = SMARTCONTRACT_ADDRESS_V2;
      if (
        serieId === 1 &&
        previousPageData &&
        previousPageData.length &&
        (previousPageData[previousPageData.length - 1].id <=
          LAST_ID_SERIE1_V2 ||
          (previousPageData[previousPageData.length - 1].id ==
            LAST_SILVER_SERIE1_V2_ID &&
            !tierParamArray.includes("Bronze")) ||
          (previousPageData[previousPageData.length - 1].id ==
            LAST_GOLD_SERIE1_V2_ID &&
            !tierParamArray.includes("Bronze") &&
            !tierParamArray.includes("Silver")) ||
          (previousPageData[previousPageData.length - 1].id ==
            LAST_DIAMOND_SERIE1_V2_ID &&
            !tierParamArray.includes("Bronze") &&
            !tierParamArray.includes("Silver") &&
            !tierParamArray.includes("Gold")))
      ) {
        smartContractAddressToUse = SMARTCONTRACT_ADDRESS_V1;
      }

      // Delete when Diamond ID is know
      if (serieId === 1 && pageIndex === 0 && tierParam === "Diamond,Diamond") {
        smartContractAddressToUse = SMARTCONTRACT_ADDRESS_V1;
      }
      if (previousPageData && !previousPageData.length) {
        return null;
      }
      // first page, we don't have `previousPageData`
      if (pageIndex === 0)
        return `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=reveal&limit=${pageSize}&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}&parameter.metadata.attributes.o.in=${tierParam}`;

      // add the cursor to the API endpoint
      return `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=reveal&limit=${pageSize}
        &parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}}&parameter.metadata.attributes.o.in=${tierParam}&lastId=${
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
  const displayLoadMore = dogs.length > 0 || serieId == 1;

  return (
    <>
      <div className={styles.grid}>{dogs}</div>
      <div className={styles.loadMore}>
        {displayLoadMore && (
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
      serieId: 1,
      minId: 1,
      maxId: 8000,
      supply: 8000,
    },
    label: "Serie 1",
  },
  {
    value: {
      serieId: 2,
      minId: 8001,
      maxId: 12000,
      supply: 4000,
    },
    label: "Serie 2",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [tierFilter, setTierFilter] = useState([]);

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
                <Stats
                  {...options[activeTab].value}
                  tierFilter={tierFilter}
                  onTierFilterChange={setTierFilter}
                />
              </div>
              <Dogs {...options[activeTab].value} tiersFilter={tierFilter} />
            </main>
          </SWRConfig>
          <footer className={styles.footer}>
            <Donation />
          </footer>
        </div>
      </ThemeProvider>
    </>
  );
}

function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

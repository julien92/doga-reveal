import { Button } from "@mui/material";
import {
  hex_to_ascii,
  FIRST_DIAMOND_SERIE1_V2_ID,
  FIRST_GOLD_SERIE1_V2_ID,
  FIRST_ID_SERIE1_V2,
  FIRST_SILVER_SERIE1_V2_ID,
  SMARTCONTRACT_ADDRESS_V1,
  SMARTCONTRACT_ADDRESS_V2,
  unique_element,
  LAST_DIAMOND_SERIE1_V1_ID,
  LAST_SILVER_SERIE1_V1_ID,
  LAST_GOLD_SERIE1_V1_ID,
} from "../../common/util";
import fetcher from "../../fetcher/fetcher";
import { RevealOperation } from "../../model/RevealOperation";
import useSWRInfinite from "swr/infinite";
import FAIcon from "../FAIcon";
import {
  faArrowUpRightFromSquare,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import styles from "./styles.module.css";
import Image from "next/image";
import Sex from "../Sex";

const Dogs = ({ serieId, minId, maxId, tiersFilter, order }) => {
  const pageSize = 30;

  const { data, size, setSize } = useSWRInfinite<RevealOperation[]>(
    (pageIndex, previousPageData) => {
      // reached the end
      let smartContractAddressToUse = "KT1VAEH1BujPVdgTdwDYda8x3LLmFU6PuK2T";

      if (previousPageData && !previousPageData.length) {
        return null;
      }
      // first page, we don't have `previousPageData`
      if (pageIndex === 0)
        return `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=reveal&limit=${pageSize}&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}&sort=${order}`;

      // add the cursor to the API endpoint
      return `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=reveal&limit=${pageSize}&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}&sort=${order}&lastId=${
        previousPageData[previousPageData.length - 1].id
      }`;
    },
    fetcher
  );

  if (!data) {
    return null;
  }

  const operations = unique_element(data?.flatMap((op) => op));

  console.log("data", data);
  console.log("size", size);
  const dogs = operations.map((op) => <Dog key={op.hash} operation={op} />);
  const displayLoadMore =
    operations[operations.length - 1].hash !==
    "oot2bGaDJnDjQUrMJPxaUp1BfEghNoSbm9gZ3rg1JasvWHKtMWP";

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
  const dogUrlMarketplace = `https://marketplace.dogami.com/swag/${tokenId}`;

  const attributes = metadata.attributes;
  let rarityScore = attributes.Rarity.string_1;
  let name = attributes.Name.string_1;
  const sexe = attributes.h;
  const race = attributes.c;

  const artifactUri = hex_to_ascii(metadata.thumbnailUri);
  const hashIpfs = artifactUri.replace("ipfs://", "");
  const displayArtifactUri = `https://nft-zzz.mypinata.cloud/ipfs/${hashIpfs}`;

  return (
    <div className={styles.card}>
      <Image
        src={displayArtifactUri}
        alt=""
        width={350}
        height={350}
        unoptimized
      />
      <div className={styles.tokenId}>#{tokenId}</div>
      <div className={styles.cardInfo}>
        <ul className={styles.infoList}>
          <li>
            <strong>Name:</strong>
            <span>{name}</span>
          </li>
          <li>
            <strong>Rarity:</strong>
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

const RevealRequestTime = ({ tokenId, id }) => {
  const smartContractAddressToUse = "KT1VAEH1BujPVdgTdwDYda8x3LLmFU6PuK2T";
  const queryUrl = `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=assignMetadata&limit=100&parameter.token_id=${tokenId}`;
  const { data } = useSWR(queryUrl, fetcher);

  if (!data) {
    return null;
  }

  const operationUnboxing = data.find(
    ({ parameter }) => parameter.value.token_id === tokenId
  );

  if (!operationUnboxing) {
    console.log("Operation unboxing not found");
    return null;
  }
  // const ownerAddress = operationUnboxing.sender.address;
  const unboxingTime = new Date(operationUnboxing.timestamp).toLocaleString();
  return <>{unboxingTime}</>;
};

export default Dogs;

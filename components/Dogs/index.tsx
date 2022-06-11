import { Button } from "@mui/material";
import {
  hex_to_ascii,
  LAST_DIAMOND_SERIE1_V2_ID,
  LAST_GOLD_SERIE1_V2_ID,
  LAST_ID_SERIE1_V2,
  LAST_SILVER_SERIE1_V2_ID,
  SMARTCONTRACT_ADDRESS_V1,
  SMARTCONTRACT_ADDRESS_V2,
  unique_element,
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

const Dogs = ({ serieId, minId, maxId, tiersFilter }) => {
  const pageSize = 30;

  const tierAvaiable = ["Diamond", "Silver", "Bronze", "Gold"];
  let tierParamArray = ["Diamond", "Silver", "Bronze", "Gold"];
  if (tiersFilter.length) {
    tierParamArray = tierAvaiable.filter((tier) => tiersFilter.includes(tier));
  }

  if (tierParamArray.length === 1) {
    tierParamArray.push(tierParamArray[0]);
  }

  console.log("Filter", tierParamArray);
  const tierParam = tierParamArray.join(",");

  const { data, size, setSize } = useSWRInfinite<RevealOperation[]>(
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
            tierParam === "Diamond,Diamond"))
      ) {
        smartContractAddressToUse = SMARTCONTRACT_ADDRESS_V1;
      }

      if (previousPageData && !previousPageData.length) {
        return null;
      }
      // first page, we don't have `previousPageData`
      if (pageIndex === 0)
        return `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=reveal&limit=${pageSize}&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}&parameter.metadata.attributes.o.in=${tierParam}`;

      // add the cursor to the API endpoint
      return `https://api.tzkt.io/v1/accounts/${smartContractAddressToUse}/operations?type=transaction&entrypoint=reveal&limit=${pageSize}&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}&parameter.metadata.attributes.o.in=${tierParam}&lastId=${
        previousPageData[previousPageData.length - 1].id
      }`;
    },
    fetcher
  );

  if (!data) {
    return null;
  }

  const operations = unique_element(data?.flatMap((op) => op));

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

export default Dogs;

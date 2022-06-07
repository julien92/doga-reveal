import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import useSWR, { Fetcher, SWRConfig } from "swr";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faEllipsis,
  faHandHoldingHeart,
  faHeart,
  faMars,
  faVenus,
} from "@fortawesome/free-solid-svg-icons";

interface FAIconProps {
  icon: IconDefinition;
  size?: number;
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
  const queryUrl = `https://api.tzkt.io/v1/accounts/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?type=transaction&entrypoint=assignMetadata`;
  const { data } = useSWR(queryUrl, fetcher);

  if (!data) {
    return null;
  }

  const operationUnboxing = data.find(
    ({ parameter }) => parameter.value === tokenId
  );
  // const ownerAddress = operationUnboxing.sender.address;
  const unboxingTime = new Date(operationUnboxing.timestamp).toLocaleString();
  return <>{unboxingTime}</>;
};

const Dog = ({ hash }) => {
  const url = `https://api.better-call.dev/v1/opg/${hash}?with_mempool=false`;
  const { data, error } = useSWR(url, fetcher);

  if (!data) {
    return (
      <div className={styles.cardLoading}>
        <FAIcon icon={faEllipsis} size={32} />
      </div>
    );
  }

  const reveal = data.find(({ entrypoint }) => entrypoint === "reveal");
  const parameters = reveal.parameters;
  const revealDateTime = new Date(reveal.timestamp).toLocaleString();
  const metadata = parameters[0].children.find(
    ({ name }) => name === "metadata"
  );
  const tokenId = parameters[0].children.find(
    ({ name }) => name === "token_id"
  ).value;
  const dogUrlMarketplace = `https://marketplace.dogami.com/dog/${tokenId}`;

  const attributes = metadata.children.find(
    ({ name }) => name === "attributes"
  ).children;
  const rarityScore = attributes.find(({ name }) => name === "n").value;
  const sexe = attributes.find(({ name }) => name === "h").value;
  const race = attributes.find(({ name }) => name === "c").value;

  const artifactUri = metadata.children.find(
    ({ name }) => name === "thumbnailUri"
  ).value;
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
        <a className={styles.link} href={dogUrlMarketplace}>
          Marketplace <FAIcon icon={faArrowUpRightFromSquare} size={16} />
        </a>
      </div>
    </div>
  );
};

const Dogs = () => {
  const url =
    "https://api.better-call.dev/v1/contract/mainnet/KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe/operations?entrypoints=reveal&with_storage_diff=false";
  const { data: page1 } = useSWR(url, fetcher);
  const { data: page2 } = useSWR(
    () => url + "&last_id=" + page1.last_id,
    fetcher
  );

  if (!page2) {
    return null;
  }

  const operations = [...page1.operations, ...page2.operations];

  const hashReveal = operations
    .filter((op) => op.entrypoint === "reveal")
    .map((op) => op.hash);

  const dogs = hashReveal.map((hash) => <Dog key={hash} hash={hash} />);

  return <>{dogs}</>;
};

export default function Home() {
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
            refreshInterval: 3000,
            fetcher: (resource, init) =>
              fetch(resource, init).then((res) => res.json()),
          }}
        >
          <main className={styles.main}>
            <h1 className={styles.title}>
              DogaReveal <small>by Dare</small>
            </h1>

            <div className={styles.grid}>
              <Dogs />
            </div>
          </main>
        </SWRConfig>
        <footer className={styles.footer}>
          <div>
            Donate to dogareveal.tez
            <FontAwesomeIcon
              width={16}
              height={16}
              icon={faHandHoldingHeart}
              className={styles.donate}
            />
          </div>
        </footer>
      </div>
    </>
  );
}

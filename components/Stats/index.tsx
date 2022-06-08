import { CircularProgress } from "@mui/material";
import useSWRInfinite from "swr/infinite";

import fetcher from "../../fetcher/fetcher";
import { SeriesFilter } from "../../pages";

import styles from "./styles.module.css";

interface PercentProps {
  label: string;
  show: boolean;
  percent: number;
  red: boolean;
}

const Percent = ({ label, show, percent, red }: PercentProps) => {
  return (
    <>
      {label}:
      {show ? (
        <strong className={red ? styles.red : styles.green}>{percent}%</strong>
      ) : (
        <CircularProgress size={16} color="secondary" thickness={6} />
      )}
    </>
  );
};

const Stats = ({ minId, maxId, supply }: SeriesFilter) => {
  const initialSize = 9;

  const { data } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      // reached the end
      if (previousPageData && !previousPageData.length) {
        return null;
      }
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

  const operations = data?.flatMap((op) => op).reverse() || [];
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

  console.log("Diamond counter", diamondCounter);
  console.log("Diamond pourcentage", diamsPourcentageRemaining);
  console.log("Gold counter", goldCounter);
  console.log("Gold pourcentage", goldPourcentageRemaining);
  console.log("Silver counter", silverCounter);
  console.log("Silver pourcentage", silverPourcentageRemaining);
  console.log("Zronze counter", bronzeCounter);
  console.log("Silver pourcentage", bronzePourcentageRemaining);

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.bronze}>
          <Percent
            label="Bronze"
            percent={bronzePourcentageRemaining}
            red={bronzePourcentageRemaining >= 60}
            show={!!data}
          />
        </div>
        <div className={styles.silver}>
          <Percent
            label="Silver"
            percent={silverPourcentageRemaining}
            red={silverPourcentageRemaining <= 30}
            show={!!data}
          />
        </div>
        <div className={styles.gold}>
          <Percent
            label="Gold"
            percent={goldPourcentageRemaining}
            red={goldPourcentageRemaining <= 8}
            show={!!data}
          />
        </div>
        <div className={styles.diamond}>
          <Percent
            label="Diamond"
            percent={diamsPourcentageRemaining}
            red={diamsPourcentageRemaining <= 2}
            show={!!data}
          />
        </div>
      </div>
    </>
  );
};

export default Stats;

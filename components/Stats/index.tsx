import { CircularProgress, Tooltip } from "@mui/material";
import useSWRInfinite from "swr/infinite";

import fetcher from "../../fetcher/fetcher";
import { SeriesFilter } from "../../pages";

import styles from "./styles.module.css";

interface PercentProps {
  label: string;
  show: boolean;
  percent: number;
  color?: "default" | "red" | "green";
  base: number;
  showDelta?: boolean;
}

const Percent = ({
  label,
  show,
  percent,
  color = "default",
  base,
  showDelta = false,
}: PercentProps) => {
  const delta = percent - base;

  const classMap = {
    default: "",
    red: styles.red,
    green: styles.green,
  };

  return (
    <Tooltip
      title={showDelta ? `${delta > 0 ? "+" : ""}${delta.toFixed(2)}%` : ""}
    >
      <div>
        {label}:
        {show ? (
          <strong className={classMap[color]}>{percent}%</strong>
        ) : (
          <CircularProgress size={16} color="secondary" thickness={6} />
        )}
      </div>
    </Tooltip>
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
        <Percent
          label="Bronze"
          percent={bronzePourcentageRemaining}
          color={bronzePourcentageRemaining <= 60 ? "red" : "green"}
          show={!!data}
          base={60}
          showDelta
        />
        <Percent
          label="Silver"
          percent={silverPourcentageRemaining}
          color={silverPourcentageRemaining <= 30 ? "red" : "green"}
          show={!!data}
          base={30}
          showDelta
        />
        <Percent
          label="Gold"
          percent={goldPourcentageRemaining}
          color={goldPourcentageRemaining <= 8 ? "red" : "green"}
          show={!!data}
          base={8}
          showDelta
        />
        <Percent
          label="Diamond"
          percent={diamsPourcentageRemaining}
          color={diamsPourcentageRemaining <= 2 ? "red" : "green"}
          show={!!data}
          base={2}
          showDelta
        />
      </div>
    </>
  );
};

export default Stats;

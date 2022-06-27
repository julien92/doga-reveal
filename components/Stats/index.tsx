import { recipientString } from "@airgap/beacon-sdk";
import { CircularProgress } from "@mui/material";
import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { SMARTCONTRACT_ADDRESS_V2, unique_element } from "../../common/util";

import fetcher from "../../fetcher/fetcher";
import { RevealOperation } from "../../model/RevealOperation";

import styles from "./styles.module.css";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PercentProps {
  label: string;
  show: boolean;
  percent: number;
  color?: "default" | "red" | "green";
  base: number;
  showDelta?: boolean;
  tierFilter: string[];
  onTierFilterChange: (tier: string[]) => {};
}

const Percent = ({
  label,
  show,
  percent,
  color = "default",
  base,
  tierFilter,
  onTierFilterChange,
}: PercentProps) => {
  const delta = percent - base;
  const [enabled, setEnabled] = useState(false);

  const classMap = {
    default: "",
    red: styles.red,
    green: styles.green,
  };

  const handleClick = () => {
    let newFilter;
    if (!enabled) {
      newFilter = [...tierFilter, label];
    } else {
      newFilter = tierFilter.filter((op) => op != label);
    }

    setEnabled(!enabled);
    onTierFilterChange(newFilter);
  };

  return (
    <button
      onClick={handleClick}
      className={`${styles.filterButton} ${enabled ? styles.active : ""}`}
    >
      {label}:
      {show ? (
        <strong className={classMap[color]}>{percent}%</strong>
      ) : (
        <CircularProgress size={16} color="secondary" thickness={6} />
      )}
    </button>
  );
};

const Stats = ({
  serieId,
  minId,
  maxId,
  supply,
  tierFilter,
  onTierFilterChange,
}) => {
  const initialSize = 9;

  const { data } = useSWRInfinite<RevealOperation[]>(
    (pageIndex, previousPageData) => {
      // reached the end
      if (previousPageData && !previousPageData.length) {
        return null;
      }
      // first page, we don't have `previousPageData`
      if (pageIndex === 0)
        return `https://api.tzkt.io/v1/accounts/${SMARTCONTRACT_ADDRESS_V2}/operations?type=transaction&entrypoint=reveal&limit=1000&sort=Descending&parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}`;

      // add the cursor to the API endpoint
      return `https://api.tzkt.io/v1/accounts/${SMARTCONTRACT_ADDRESS_V2}/operations?type=transaction&entrypoint=reveal&limit=1000&sort=Descending
        &parameter.token_id.le=${maxId}&parameter.token_id.ge=${minId}}&lastId=${
        previousPageData[previousPageData.length - 1].id
      }`;
    },
    fetcher,
    { initialSize }
  );

  const operations = unique_element(data?.flatMap((op) => op).reverse() || []);
  let totalRevealed = operations.length;
  console.log("Total already revealed", totalRevealed);

  let diamondCounter = 0;
  let goldCounter = 0;
  let silverCounter = 0;
  let bronzeCounter = 0;

  const totalDiams = (supply * 2) / 100;
  const totalGold = (supply * 8) / 100;
  const totalSilver = (supply * 30) / 100;
  const totalBronze = (supply * 60) / 100;

  let diamsOffset = 0;
  let goldOffset = 0;
  let silverOffset = 0;
  let bronzeOffset = 0;

  let mapDateRarity = new Map<any, any[]>();
  let offsetByRarity = new Map<any, any>();
  let offsetGoldByRarity = new Map<any, any>();

  operations.forEach(function (op) {
    const attributes = op.parameter.value.metadata.attributes;
    const date = attributes.a;
    if (!mapDateRarity.get(date)) {
      mapDateRarity.set(date, [0, 0, 0, 0]);
    }
    const rarity = attributes.o;
    switch (rarity) {
      case "Diamond": {
        goldOffset++;
        mapDateRarity.get(date)[3]++;
        diamondCounter++;
        offsetByRarity.set(diamondCounter, diamsOffset);
        diamsOffset = 0;
        break;
      }
      case "Gold": {
        diamsOffset++;
        mapDateRarity.get(date)[2]++;
        goldCounter++;
        offsetGoldByRarity.set(goldCounter, goldOffset);
        goldOffset = 0;
        break;
      }
      case "Silver": {
        goldOffset++;
        diamsOffset++;
        mapDateRarity.get(date)[1]++;
        silverCounter++;
        break;
      }
      case "Bronze": {
        goldOffset++;
        diamsOffset++;
        mapDateRarity.get(date)[0]++;
        bronzeCounter++;
        break;
      }
    }
  });

  console.log("mapDateRarity", mapDateRarity);

  if (serieId === 1) {
    diamondCounter += 142;
    goldCounter += 564;
    silverCounter += 2101;
    bronzeCounter += 4124;
    totalRevealed += 6931;
  }

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
  console.log("Bronze counter", bronzeCounter);
  console.log("Bronze pourcentage", bronzePourcentageRemaining);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Rarity level by day",
      },
    },
  };

  let tabDate = [];
  let tabBronze = [];
  let tabSilver = [];
  let tabGold = [];
  let tabDiamond = [];
  mapDateRarity.forEach((value, key) => {
    tabDate.push(key);
    tabBronze.push(value[0]);
    tabSilver.push(value[1]);
    tabGold.push(value[2]);
    tabDiamond.push(value[3]);
  });

  const xData = [];
  const yDiams = [];
  const yGold = [];
  const average = [];
  offsetByRarity.forEach((value, key) => {
    xData.push(key);
    yDiams.push(value);
    average.push(yDiams.reduce((a, b) => a + b, 0) / yDiams.length);
  });

  // offsetGoldByRarity.forEach((value, key) => {
  //   xData.push(key);
  //   yGold.push(value);
  //   average.push(yGold.reduce((a, b) => a + b, 0) / yGold.length);
  // });

  const dataGraph = {
    labels: tabDate,
    datasets: [
      {
        label: "Bronze",
        data: tabBronze,
        backgroundColor: "rgb(255,127,0)",
        borderColor: "rgb(192,146,70)",
      },
      {
        label: "Silver",
        data: tabSilver,
        backgroundColor: "rgb(187,219,235)",
        borderColor: "rgb(153,174,192)",
      },
      {
        label: "Gold",
        data: tabGold,
        backgroundColor: "rgb(228,235,0)",
        borderColor: "rgb(192,189,51)",
      },
      {
        label: "Diamond",
        data: tabDiamond,
        backgroundColor: "rgb(0,235,222)",
        borderColor: "rgb(75,192,192)",
      },
    ],
  };

  const dataOffsetGraph = {
    labels: xData,
    datasets: [
      {
        label: "Diamond",
        data: yDiams,
        backgroundColor: "rgb(0,235,222)",
        borderColor: "rgb(75,192,192)",
      },
      {
        label: "Average",
        data: average,
        backgroundColor: "rgb(187,219,235)",
        borderColor: "rgb(153,174,192)",
      },
    ],
  };

  return (
    <>
      <b>{Math.round(average[average.length - 1]) - diamsOffset}</b> reveal before Diamond
      <Line options={options} data={dataOffsetGraph} />
      <div className={styles.stats}>
        <Percent
          label="Bronze"
          percent={bronzePourcentageRemaining}
          color={bronzePourcentageRemaining <= 60 ? "red" : "green"}
          show={!!data}
          base={60}
          showDelta
          tierFilter={tierFilter}
          onTierFilterChange={onTierFilterChange}
        />
        <Percent
          label="Silver"
          percent={silverPourcentageRemaining}
          color={silverPourcentageRemaining <= 30 ? "red" : "green"}
          show={!!data}
          base={30}
          showDelta
          tierFilter={tierFilter}
          onTierFilterChange={onTierFilterChange}
        />
        <Percent
          label="Gold"
          percent={goldPourcentageRemaining}
          color={goldPourcentageRemaining <= 8 ? "red" : "green"}
          show={!!data}
          base={8}
          showDelta
          tierFilter={tierFilter}
          onTierFilterChange={onTierFilterChange}
        />
        <Percent
          label="Diamond"
          percent={diamsPourcentageRemaining}
          color={diamsPourcentageRemaining <= 2 ? "red" : "green"}
          show={!!data}
          base={2}
          showDelta
          tierFilter={tierFilter}
          onTierFilterChange={onTierFilterChange}
        />
      </div>
    </>
  );
};

// const MintAddress = () => {
//   const { data } = useSWRInfinite(
//     (pageIndex, previousPageData) => {
//       // reached the end
//       if (previousPageData && !previousPageData.length) {
//         return null;
//       }
//       // first page, we don't have `previousPageData`
//       if (pageIndex === 0)
//         return `https://api.tzkt.io/v1/accounts/KT1TjHyHTnL4VMQQyD75pr3ZTemyPvQxRPpA/operations?type=transaction&entrypoint=mint&limit=1000&status=applied`;

//       // add the cursor to the API endpoint
//       return `https://api.tzkt.io/v1/accounts/KT1TjHyHTnL4VMQQyD75pr3ZTemyPvQxRPpA/operations?type=transaction&entrypoint=mint&limit=1000&status=applied&lastId=${
//         previousPageData[previousPageData.length - 1].id
//       }`;
//     },
//     fetcher,
//     { initialSize: 8 }
//   );

//   if (!data) {
//     return null;
//   }

//   const mintCountByAddress = new Map<String, number>();
//   const operations = data?.flatMap((op) => op);
//   console.log(mintCountByAddress);

//   operations.forEach((op) => {
//     const address = op.initiator.address;
//     if (mintCountByAddress.has(address)) {
//       mintCountByAddress.set(address, mintCountByAddress.get(address) + 1);
//     } else {
//       mintCountByAddress.set(address, 1);
//     }
//   });
//   console.log(mintCountByAddress);
//   let maxMint = 0;
//   mintCountByAddress.forEach((numberMint: number, address: string) => {
//     if (numberMint == 2) {
//       console.log(address);
//     }
//     maxMint = numberMint > maxMint ? numberMint : maxMint;
//   });

//   console.log("Maxmint per wallet ", maxMint);
//   return null;
// };
export default Stats;

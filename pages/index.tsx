import Head from "next/head";
import { SWRConfig } from "swr";
import { SyntheticEvent, useState } from "react";
import {
  createTheme,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
} from "@mui/material";

import Stats from "../components/Stats";

import styles from "../styles/Home.module.css";
import Donation from "../components/Donation";

import Dogs from "../components/Dogs";

export interface SeriesFilter {
  serieId: number;
  minId: number;
  maxId: number;
  supply: number;
}

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

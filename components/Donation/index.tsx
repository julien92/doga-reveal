import {
  ColorMode,
  DAppClient,
  Network,
  NetworkType,
  TezosOperationType,
} from "@airgap/beacon-sdk";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faHandHoldingHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./styles.module.css";

const network: Network = { type: NetworkType.MAINNET };

const Donation = () => (
  <>
    <a onClick={donateOneXtz}>
      Donate to dogareveal.tez
      <FontAwesomeIcon
        width={16}
        height={16}
        icon={faHandHoldingHeart}
        className={styles.donate}
      />
    </a>
  </>
);

export default Donation;

export async function donateOneXtz() {
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

export async function donate22Doga() {}

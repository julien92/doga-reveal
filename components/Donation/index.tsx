import {
  ColorMode,
  DAppClient,
  Network,
  NetworkType,
  TezosOperationType,
} from "@airgap/beacon-sdk";
import { faHandHoldingHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { TezosToolkit } from "@taquito/taquito";
import styles from "./styles.module.css";

const network: Network = { type: NetworkType.MAINNET };

const DOGA_COUNT = 22;

const Donation = () => (
  <>
    <a onClick={() => donateDoga(DOGA_COUNT)}>
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

export async function donateXtz() {
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

export async function donateDoga(dogaCount: number) {
  const Tezos = new TezosToolkit("https://mainnet-tezos.giganode.io");
  const wallet = new BeaconWallet({ name: "DogaReveal" });

  Tezos.setWalletProvider(wallet);

  const activeAccount = await wallet.client.getActiveAccount();
  if (activeAccount) {
    // User already has account connected, everything is ready
    // You can now do an operation request, sign request, or send another permission request to switch wallet
    console.log("Already connected:", activeAccount.address);
  } else {
    const permissions = await wallet.client.requestPermissions();
    console.log("New connection:", permissions.address);
  }

  Tezos.setWalletProvider(wallet);

  const address = await wallet.getPKH();
  if (!address) {
    await wallet.requestPermissions();
  }

  // Connect to a specific contract on the tezos blockchain.
  // Make sure the contract is deployed on the network you requested permissions for.
  const contract = await Tezos.wallet.at(
    "KT1Ha4yFVeyzw6KRAdkzq6TxDHB97KG4pZe8" // For this example, we use the TZBTC contract on mainnet.
  );

  // Call a method on the contract. In this case, we use the transfer entrypoint.
  // Taquito will automatically check if the entrypoint exists and if we call it with the right parameters.
  // In this case the parameters are [from, to, amount].
  // This will prepare the contract call and send the request to the connected wallet.
  const result = await contract.methods
    .transfer(address, "tz1cHbBAVgPSaTZqL3PMBpDPqYg9EdzrWGEM", 2200000)
    .send();

  // As soon as the operation is broadcast, you will receive the operation hash
  return result.opHash;
}

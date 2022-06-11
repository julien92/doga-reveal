import { RevealOperation } from "../model/RevealOperation";

export const SMARTCONTRACT_ADDRESS_V1 = "KT1HTDtMBRCKoNHjfWEEvXneGQpCfPAt6BRe";
export const SMARTCONTRACT_ADDRESS_V2 = "KT1TjHyHTnL4VMQQyD75pr3ZTemyPvQxRPpA";

export const LAST_ID_SERIE1_V2 = 256620294;
export const LAST_SILVER_SERIE1_V2_ID = 256620639;
export const LAST_GOLD_SERIE1_V2_ID = 256655605;
export const LAST_DIAMOND_SERIE1_V2_ID = 258305575;

export function hex_to_ascii(str1): string {
  var hex = str1.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

export function unique_element(
  operations: RevealOperation[]
): RevealOperation[] {
  const uniqueOperations = operations.filter(
    (op, index, array) =>
      array.findIndex(
        (op2) => op2.parameter.value.token_id === op.parameter.value.token_id
      ) === index
  );

  if (operations.length != uniqueOperations.length) {
    debugger;
    console.warn(
      "Some duplicate reveal operation presente in the smartcontract",
      operations.length,
      uniqueOperations.length
    );
  }
  return uniqueOperations;
}

import { Fetcher } from "swr";

const fetcher: Fetcher<any, any> = (url) => fetch(url).then((r) => r.json());

export default fetcher;

export const formatIpfsLink = (ipfsLink: string): string => {
  if (ipfsLink.startsWith("ipfs://")) {
    return ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return ipfsLink;
};

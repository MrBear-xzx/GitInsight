export const maskToken = (token: string) => {
  if (!token || token.length <= 4) {
    return "****";
  }
  return `${token.slice(0, 2)}****${token.slice(-2)}`;
};

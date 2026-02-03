let SERVER_URL = "/api";
if (process.env.NEXT_PUBLIC_ENVIRONMENT === "DEV") {
  SERVER_URL = "https://pysraweb.saketlab.org/api";
}
export { SERVER_URL };

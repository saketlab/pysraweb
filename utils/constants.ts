const SERVER_URL =process.env.NEXT_PUBLIC_API_URL ?? "https://pysraweb.saketlab.org/api";
  
export { SERVER_URL };

// checks if SERVER_URL is valid URL, im using a check here in single line - to reduce the redundancy of creating .env file again and again. 
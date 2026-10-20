const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
  }
  return key;
}

type InitializeTransactionResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export async function initializeTransaction({
  email,
  amountKobo,
  reference,
  callbackUrl,
}: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
    }),
  });

  const json = (await response.json()) as InitializeTransactionResponse;

  if (!response.ok || !json.status) {
    throw new Error(json.message || "Failed to initialize transaction");
  }

  return json.data;
}

type VerifyTransactionResponse = {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    customer: { email: string };
  };
};

export async function verifyTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
      },
    }
  );

  const json = (await response.json()) as VerifyTransactionResponse;

  if (!response.ok || !json.status) {
    throw new Error(json.message || "Failed to verify transaction");
  }

  return json.data;
}
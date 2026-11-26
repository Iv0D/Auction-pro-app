import request from "./api";

export interface PaymentMethod {
  id: number;
  tipo:
    | "TARJETA_CREDITO"
    | "TARJETA_DEBITO"
    | "CUENTA_BANCARIA"
    | "CHEQUE_CERTIFICADO";

  verificado: boolean;

  // Comunes
  titular?: string;

  // Tarjetas
  marca?: string;
  ultimos4?: string;

  // Cuenta bancaria
  banco?: string;
  cbu?: string;

  // Cheque certificado
  montoGarantizado?: number;
  moneda?: string;
}

export interface PaymentMethodCreatePayload {
  tipo:
    | "TARJETA_CREDITO"
    | "TARJETA_DEBITO"
    | "CUENTA_BANCARIA"
    | "CHEQUE_CERTIFICADO";

  // Tarjeta
  titular?: string;
  numeroTarjeta?: string;
  fechaExpiracion?: string;
  cvv?: string;
  marca?: string;

  // Cuenta bancaria
  banco?: string;
  cbu?: string;
  pais?: string;

  // Cheque
  montoGarantizado?: number;
  moneda?: string;
}

export const getPaymentMethodsApi = () =>
  request<PaymentMethod[]>("/payment-methods", {
    method: "GET",
  });

export const addPaymentMethodApi = (
  payload: PaymentMethodCreatePayload
) =>
  request<{ message: string; estado: string }>(
    "/payment-methods",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

export const deletePaymentMethodApi = (id: number) =>
  request<{ message: string }>(
    `/payment-methods/${id}`,
    {
      method: "DELETE",
    }
  );
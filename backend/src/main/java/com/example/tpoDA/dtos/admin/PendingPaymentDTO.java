package com.example.tpoDA.dtos.admin;

import com.example.tpoDA.dtos.payment.PaymentMethodResponseDTO;

public record PendingPaymentDTO(String email, PaymentMethodResponseDTO method) {}

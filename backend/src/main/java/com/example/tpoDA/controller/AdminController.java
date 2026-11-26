package com.example.tpoDA.controller;

import com.example.tpoDA.dtos.admin.ApproveClientDTO;
import com.example.tpoDA.dtos.admin.ClientStatusResponseDTO;
import com.example.tpoDA.dtos.admin.RejectClientDTO;
import com.example.tpoDA.dtos.admin.PendingPaymentDTO;
import com.example.tpoDA.dtos.payment.PaymentMethodResponseDTO;
import com.example.tpoDA.services.AdminService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/clients/pending")
    public List<ClientStatusResponseDTO> pendingClients() {
        return adminService.getPendingClients();
    }

    @GetMapping("/payment-methods/pending")
    public List<PendingPaymentDTO> pendingPayments() {
        return adminService.getPendingPayments();
    }

    @PostMapping("/payment-methods/{id}/verify")
    public PaymentMethodResponseDTO verifyPayment(@PathVariable Integer id) {
        return adminService.verifyPayment(id);
    }

    // GET /admin/clients/{clientId}/status — ver estado actual
    @GetMapping("/clients/{clientId}/status")
    public ResponseEntity<ClientStatusResponseDTO> getStatus(
            @PathVariable Integer clientId
    ) {
        return ResponseEntity.ok(adminService.getClientStatus(clientId));
    }

    // POST /admin/clients/{clientId}/approve — aprobar y mandar mail con link
    @PostMapping("/clients/{clientId}/approve")
    public ResponseEntity<ClientStatusResponseDTO> approve(
            @PathVariable Integer clientId,
            @RequestBody(required = false) ApproveClientDTO dto
    ) {
        return ResponseEntity.ok(
                adminService.approveClient(clientId, dto != null ? dto : new ApproveClientDTO())
        );
    }

    // POST /admin/clients/{clientId}/reject — rechazar y mandar mail de rechazo
    @PostMapping("/clients/{clientId}/reject")
    public ResponseEntity<ClientStatusResponseDTO> reject(
            @PathVariable Integer clientId,
            @RequestBody(required = false) RejectClientDTO dto
    ) {
        return ResponseEntity.ok(
                adminService.rejectClient(clientId, dto != null ? dto : new RejectClientDTO())
        );
    }

   
}

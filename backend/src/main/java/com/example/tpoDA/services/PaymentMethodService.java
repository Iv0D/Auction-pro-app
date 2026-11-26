package com.example.tpoDA.services;

import com.example.tpoDA.dtos.payment.PaymentMethodCreateDTO;
import com.example.tpoDA.dtos.payment.PaymentMethodResponseDTO;
import com.example.tpoDA.entities.PaymentMethod;
import com.example.tpoDA.entities.User;
import com.example.tpoDA.exceptions.AppException;
import com.example.tpoDA.mappers.PaymentMethodMapper;
import com.example.tpoDA.repositories.CheckCommitmentRepository;
import com.example.tpoDA.repositories.PaymentMethodRepository;
import com.example.tpoDA.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;
    private final CheckCommitmentRepository checkCommitmentRepository;

    // =========================
    // GET: listar medios de pago del usuario autenticado
    // =========================
    public List<PaymentMethodResponseDTO> getAll(String email) {
        User user = getUserByEmail(email);
        return paymentMethodRepository.findByUser(user)
                .stream()
                .map(PaymentMethodMapper::toDTO)
                .collect(Collectors.toList());
    }

    // =========================
    // POST: agregar medio de pago
    // =========================
    public PaymentMethodResponseDTO add(PaymentMethodCreateDTO dto, String email) {
        User user = getUserByEmail(email);

        // Validar tipo
        try {
            Enum.valueOf(com.example.tpoDA.entities.PaymentMethodTipo.class, dto.getTipo());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Tipo de medio de pago inválido: " + dto.getTipo());
        }

        PaymentMethod entity = PaymentMethodMapper.toEntity(dto, user);
        return PaymentMethodMapper.toDTO(paymentMethodRepository.save(entity));
    }

    // =========================
    // DELETE: eliminar medio de pago
    // =========================
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void delete(Integer id, String email) {
        User user = getUserByEmail(email);

        PaymentMethod pm = paymentMethodRepository.findByIdForUpdate(id)
                .filter(method -> method.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new AppException("Medio de pago no encontrado", HttpStatus.NOT_FOUND));

        if (checkCommitmentRepository.existsByPaymentMethodId(id)) {
            throw new AppException("El cheque tiene importes comprometidos", HttpStatus.CONFLICT);
        }
        paymentMethodRepository.delete(pm);
    }

    // =========================
    // Helper
    // =========================
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}

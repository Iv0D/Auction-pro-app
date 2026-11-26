package com.example.tpoDA.services;

import com.example.tpoDA.dtos.live.*;
import com.example.tpoDA.entities.*;
import com.example.tpoDA.exceptions.AppException;
import com.example.tpoDA.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveAuctionService {

    private static final String AUCTION_CURRENCY = "ARS";

    private final UserRepository               userRepository;
    private final AuctionRepository            auctionRepository;
    private final AttendeeRepository           attendeeRepository;
    private final AttendeeSessionRepository    attendeeSessionRepository;
    private final CatalogItemRepository        catalogItemRepository;
    private final BidRepository                bidRepository;
    private final FineRepository               fineRepository;
    private final PaymentMethodRepository      paymentMethodRepository;
    private final AuctionRecordRepository      auctionRecordRepository;
    private final CheckCommitmentRepository    checkCommitmentRepository;
    private final EmailService                 emailService;
    private final NotificationTriggerService   notificationTrigger;
    private final SimpMessagingTemplate        messagingTemplate;
    private final OwnerRepository              ownerRepository;

    @Value("${app.streaming.base-url:}")
    private String streamingBaseUrl;

    @Value("${app.auction.shipping-fee:500}")
    private BigDecimal shippingFee;

    // ─── UNIRSE A LA SUBASTA ─────────────────────────────────────────────────

    @Transactional
    public JoinAuctionResponseDTO joinAuction(String email, Integer auctionId,
                                               JoinAuctionRequestDTO req) {
        User user = resolveUser(email);
        Client client = user.getClient();
        Auction auction = resolveAuction(auctionId);

        // 1. Validaciones de acceso
        validateCanJoin(client, auction);

        // 2. Un usuario no puede estar en más de una subasta a la vez
        Optional<AttendeeSession> existingSession = attendeeSessionRepository.findByUserId(user.getId());
        existingSession.ifPresent(existing -> {
            if (Boolean.TRUE.equals(existing.getActive())
                    && !existing.getAuction().getId().equals(auctionId)
                    && existing.getAuction().getStatus() == AuctionStatus.ABIERTA) {
                throw new AppException(
                    "Ya estás conectado a otra subasta. Salí primero de esa.",
                    HttpStatus.CONFLICT);
            }
        });

        // 3. Resolver/crear Attendee
        Attendee attendee = attendeeRepository
            .findByClientIdAndAuctionId(client.getId(), auctionId)
            .orElseGet(() -> {
                int bidderNum =
    attendeeRepository.countByAuctionId(auctionId) + 1;
                return attendeeRepository.save(Attendee.builder()
                    .client(client)
                    .auction(auction)
                    .bidderNumber(bidderNum)
                    .build());
            });

        // 4. Seleccionar medio de pago
        PaymentMethod pm = null;
        boolean canBid = false;
        if (req.getPaymentMethodId() != null) {
            pm = paymentMethodRepository.findById(req.getPaymentMethodId())
                .orElseThrow(() -> new AppException("Medio de pago no encontrado", HttpStatus.NOT_FOUND));
            if (!pm.getUser().getId().equals(user.getId()))
                throw new AppException("El medio de pago no te pertenece", HttpStatus.FORBIDDEN);
            if (!Boolean.TRUE.equals(pm.getVerificado()))
                throw new AppException("El medio de pago no está verificado", HttpStatus.BAD_REQUEST);
            validateCheckCurrency(pm);
            if (fineRepository.existsByClientIdAndStatus(client.getId(), "pendiente"))
                throw new AppException("Tenés multas pendientes. Regularizalas antes de pujar.",
                    HttpStatus.FORBIDDEN);
            canBid = true;
        }

        // 5. Guardar sesión activa
        PaymentMethod finalPm = pm;
        boolean firstEntry = existingSession.map(previous -> !previous.getAuction().getId().equals(auctionId))
            .orElse(true);
        AttendeeSession session = existingSession
            .map(s -> { s.setAuction(auction); s.setPaymentMethod(finalPm);
                        s.setActive(true); return s; })
            .orElse(AttendeeSession.builder()
                .user(user).auction(auction).paymentMethod(finalPm)
                .joinedAt(LocalDateTime.now()).active(true).build());
        attendeeSessionRepository.save(session);

        // 6. Ítem actual (primer ítem no subastado)
        CatalogItem currentItem = getCurrentItem(auctionId);
        BigDecimal currentBid = currentItem != null
            ? bidRepository.findTopBidByItemId(currentItem.getId())
                .map(Bid::getAmount).orElse(null)
            : null;

        String streamUrl = streamingLink(auctionId);
        if (streamUrl != null && firstEntry) {
            try {
                emailService.sendStreamingEmail(user.getEmail(), auction.getLocation(), streamUrl);
            } catch (Exception e) {
                log.warn("Falló el envío de un enlace de streaming ({})", e.getClass().getSimpleName());
            }
        }

        return JoinAuctionResponseDTO.builder()
            .auctionId(auctionId)
            .currentItemId(currentItem != null ? currentItem.getId() : null)
            .currentItemName(currentItem != null ? getProductName(currentItem.getProduct()) : null)
            .currentItemDescription(currentItem != null
                ? currentItem.getProduct().getCatalogDescription() : null)
            .basePrice(currentItem != null ? currentItem.getBasePrice() : null)
            .currentBid(currentBid)
            .bidderNumber(attendee.getBidderNumber())
            .canBid(canBid)
            .chequeDisponible(getChequeDisponible(pm))
            .streamingLink(streamUrl)
            .currency(AUCTION_CURRENCY)
            .build();
    }

    // ─── REALIZAR OFERTA ─────────────────────────────────────────────────────

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BidUpdateDTO placeBid(String email, PlaceBidRequestDTO req) {
        Auction auction = lockAuction(req.getAuctionId());
        CatalogItem item = requireOpenLot(auction, req.getItemId());
        User user = resolveUser(email);
        Client client = user.getClient();

        AttendeeSession session = attendeeSessionRepository.findByUserId(user.getId())
            .orElseThrow(() -> new AppException("No estás conectado a esta subasta", HttpStatus.FORBIDDEN));
        if (!Boolean.TRUE.equals(session.getActive()) || !session.getAuction().getId().equals(req.getAuctionId()))
            throw new AppException("No estás conectado a esta subasta", HttpStatus.FORBIDDEN);
        if (session.getPaymentMethod() == null)
            throw new AppException("No seleccionaste un medio de pago", HttpStatus.BAD_REQUEST);
        PaymentMethod paymentMethod = paymentMethodRepository.findByIdForUpdate(session.getPaymentMethod().getId())
            .orElseThrow(() -> new AppException("Medio de pago no encontrado", HttpStatus.NOT_FOUND));
        validateCheckCurrency(paymentMethod);
        if (fineRepository.existsByClientIdAndStatus(client.getId(), "pendiente"))
            throw new AppException("Tenés multas pendientes", HttpStatus.FORBIDDEN);

        Attendee attendee = attendeeRepository
            .findByClientIdAndAuctionId(client.getId(), req.getAuctionId())
            .orElseThrow(() -> new AppException("No sos asistente de esta subasta", HttpStatus.FORBIDDEN));

        // Validar límites de oferta
        BigDecimal basePrice = item.getBasePrice();
        Optional<Bid> topBidOpt = bidRepository.findTopBidByItemId(item.getId());
        BigDecimal currentTop = topBidOpt.map(Bid::getAmount).orElse(BigDecimal.ZERO);
        BigDecimal amount = req.getAmount();

        if (amount == null || amount.stripTrailingZeros().scale() > 2)
            throw new AppException("Ingresá un importe con hasta dos decimales", HttpStatus.BAD_REQUEST);
        if (amount.compareTo(currentTop) <= 0)
            throw new AppException("La oferta debe ser mayor a la oferta actual", HttpStatus.BAD_REQUEST);

        ClientCategory cat = auction.getCategory();
        boolean hasLimits = cat == ClientCategory.COMUN
            || cat == ClientCategory.ESPECIAL
            || cat == ClientCategory.PLATA;

        if (hasLimits) {
            BigDecimal minBid = currentTop.add(basePrice.movePointLeft(2)).setScale(2, RoundingMode.CEILING);
            BigDecimal maxBid = currentTop.add(basePrice.multiply(BigDecimal.valueOf(0.20))).setScale(2, RoundingMode.FLOOR);
            if (amount.compareTo(minBid) < 0)
                throw new AppException(
                    "Oferta mínima: $" + minBid.setScale(2, RoundingMode.HALF_UP), HttpStatus.BAD_REQUEST);
            if (amount.compareTo(maxBid) > 0)
                throw new AppException(
                    "Oferta máxima: $" + maxBid.setScale(2, RoundingMode.HALF_UP), HttpStatus.BAD_REQUEST);
        }

        if (isCertifiedCheck(paymentMethod)) {
            validateCheckCoverage(paymentMethod, item, amount);
        }

        // Marcar oferta anterior como superada
        topBidOpt.ifPresent(prev -> {
            prev.setWinner("no");
            bidRepository.save(prev);
        });

        // Registrar nueva oferta
        Bid bid = bidRepository.save(Bid.builder()
            .attendee(attendee)
            .item(item)
            .amount(amount)
            .winner("si")
            .build());

        if (isCertifiedCheck(paymentMethod)) {
            CheckCommitment commitment = checkCommitmentRepository
                .findByPaymentMethodIdAndItemId(paymentMethod.getId(), item.getId())
                .orElseGet(() -> CheckCommitment.builder().paymentMethod(paymentMethod).item(item).build());
            commitment.setAmount(amount);
            commitment.setBid(bid);
            checkCommitmentRepository.save(commitment);
        }

        // Calcular próximos límites
        BigDecimal nextMin = amount.add(basePrice.movePointLeft(2)).setScale(2, RoundingMode.CEILING);
        BigDecimal nextMax = hasLimits
            ? amount.add(basePrice.multiply(BigDecimal.valueOf(0.20))).setScale(2, RoundingMode.FLOOR) : null;

        BidUpdateDTO update = BidUpdateDTO.builder()
            .bidId(bid.getId())
            .itemId(item.getId())
            .auctionId(req.getAuctionId())
            .amount(amount)
            .bidderNumber(attendee.getBidderNumber())
            .timestamp(LocalDateTime.now())
            .minNextBid(nextMin)
            .maxNextBid(nextMax)
            .build();

        // Broadcast en tiempo real
        broadcastAfterCommit("/topic/auction/" + req.getAuctionId() + "/bids", update);

        return update;
    }

    // ─── CERRAR ÍTEM (rematador) ──────────────────────────────────────────────

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ItemResultDTO closeItem(Integer auctionId, Integer itemId) {
        Auction auction = lockAuction(auctionId);
        CatalogItem item = requireOpenLot(auction, itemId);

        Optional<Bid> winnerBidOpt = bidRepository.findTopBidByItemId(itemId);
        boolean sold = winnerBidOpt.isPresent();
        BigDecimal finalAmount = BigDecimal.ZERO;
        BigDecimal commission = BigDecimal.ZERO;
        BigDecimal shipping = BigDecimal.ZERO;
        Integer winnerBidderNumber = null;

        if (sold) {
            Bid winnerBid = winnerBidOpt.get();
            finalAmount = winnerBid.getAmount();
            winnerBidderNumber = winnerBid.getAttendee().getBidderNumber();
            Client buyer = winnerBid.getAttendee().getClient();

            checkCommitmentRepository.findByBidId(winnerBid.getId())
                .ifPresent(commitment -> commitment.setLocked(true));

            // Registrar venta
            commission = finalAmount.multiply(item.getCommission().movePointLeft(2))
                .setScale(2, RoundingMode.HALF_UP);
            shipping = shippingFee;

            auctionRecordRepository.save(AuctionRecord.builder()
                .auction(item.getCatalog().getAuction())
                .owner(item.getProduct().getOwner())
                .product(item.getProduct())
                .client(buyer)
                .amount(finalAmount)
                .commission(commission)
                .build());

            // Transferir propiedad
            Product product = item.getProduct();
            Person buyerPerson = buyer.getPerson();
            Owner newOwner = ownerRepository.findById(buyerPerson.getId())
                .orElseGet(() -> ownerRepository.save(Owner.builder().person(buyerPerson)
                    .country(buyer.getCountry()).verifier(buyer.getVerifier())
                    .financialVerification("si").judicialVerification("si").riskRating(1).build()));
            product.setOwner(newOwner);

            User winnerUser = userRepository.findByClientId(buyer.getId()).orElse(null);
            if (winnerUser != null) {
                notificationTrigger.notifyAuctionWon(winnerUser, auction, getProductName(product),
                    finalAmount.add(commission).add(shipping));
            }
        }

        checkCommitmentRepository.releaseUnlockedForItem(itemId);

        // Marcar ítem como subastado
        item.setAuctioned("si");
        catalogItemRepository.save(item);

        // Siguiente ítem
        CatalogItem nextItem = getNextItem(auctionId, itemId);
        boolean auctionFinished = nextItem == null;

        // Si terminó la subasta, marcarla como cerrada
        if (auctionFinished) {
            auction.setStatus(AuctionStatus.CERRADA);
            auctionRepository.save(auction);
        }

        ItemResultDTO result = ItemResultDTO.builder()
            .itemId(itemId)
            .auctionId(auctionId)
            .itemName(getProductName(item.getProduct()))
            .sold(sold)
            .winnerBidderNumber(winnerBidderNumber)
            .finalAmount(finalAmount)
            .commission(commission)
            .shippingCost(shipping)
            .nextItemId(nextItem != null ? nextItem.getId() : null)
            .nextItemName(nextItem != null ? getProductName(nextItem.getProduct()) : null)
            .nextBasePrice(nextItem != null ? nextItem.getBasePrice() : null)
            .auctionFinished(auctionFinished)
            .build();

        // Broadcast resultado
        broadcastAfterCommit("/topic/auction/" + auctionId + "/result", result);

        return result;
    }

    // ─── SALIR DE LA SUBASTA ─────────────────────────────────────────────────

    @Transactional
    public void leaveAuction(String email, Integer auctionId) {
        User user = resolveUser(email);
        attendeeSessionRepository.findByUserId(user.getId())
            .filter(session -> session.getAuction().getId().equals(auctionId))
            .ifPresent(session -> session.setActive(false));
    }

    // ─── ESTADO ACTUAL (para reconexión) ─────────────────────────────────────

    @Transactional(readOnly = true)
    public JoinAuctionResponseDTO getAuctionState(String email, Integer auctionId) {
        User user = resolveUser(email);
        Client client = user.getClient();

        AttendeeSession session = attendeeSessionRepository.findByUserId(user.getId())
            .filter(s -> s.getAuction().getId().equals(auctionId))
            .orElseThrow(() -> new AppException("No estás conectado a esta subasta", HttpStatus.FORBIDDEN));

        Attendee attendee = attendeeRepository
            .findByClientIdAndAuctionId(client.getId(), auctionId)
            .orElseThrow(() -> new AppException("No sos asistente", HttpStatus.FORBIDDEN));

        CatalogItem currentItem = getCurrentItem(auctionId);
        BigDecimal currentBid = currentItem != null
            ? bidRepository.findTopBidByItemId(currentItem.getId())
                .map(Bid::getAmount).orElse(null)
            : null;

        return JoinAuctionResponseDTO.builder()
            .auctionId(auctionId)
            .currentItemId(currentItem != null ? currentItem.getId() : null)
            .currentItemName(currentItem != null ? getProductName(currentItem.getProduct()) : null)
            .currentItemDescription(currentItem != null
                ? currentItem.getProduct().getCatalogDescription() : null)
            .basePrice(currentItem != null ? currentItem.getBasePrice() : null)
            .currentBid(currentBid)
            .bidderNumber(attendee.getBidderNumber())
            .canBid(Boolean.TRUE.equals(session.getActive()) && session.getPaymentMethod() != null)
            .chequeDisponible(getChequeDisponible(session.getPaymentMethod()))
            .streamingLink(streamingLink(auctionId))
            .currency(AUCTION_CURRENCY)
            .build();
    }

    // ─── HISTORIAL DE PUJAS DEL ÍTEM ─────────────────────────────────────────

    public List<BidUpdateDTO> getItemBidHistory(Integer itemId) {
        return bidRepository.findByItemIdOrderByIdAsc(itemId).stream().map(b ->
            BidUpdateDTO.builder()
                .bidId(b.getId())
                .itemId(b.getItem().getId())
                .auctionId(b.getItem().getCatalog().getAuction().getId())
                .amount(b.getAmount())
                .bidderNumber(b.getAttendee().getBidderNumber())
                .timestamp(LocalDateTime.now())
                .build()
        ).toList();
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private Auction lockAuction(Integer auctionId) {
        return auctionRepository.findByIdForUpdate(auctionId)
            .orElseThrow(() -> new AppException("Subasta no encontrada", HttpStatus.NOT_FOUND));
    }

    private CatalogItem requireOpenLot(Auction auction, Integer itemId) {
        CatalogItem item = catalogItemRepository.findById(itemId)
            .filter(lot -> lot.getCatalog().getAuction().getId().equals(auction.getId()))
            .orElseThrow(() -> new AppException("Ítem no encontrado en esta subasta", HttpStatus.NOT_FOUND));
        if ("si".equals(item.getAuctioned()))
            throw new AppException("Este artículo ya fue subastado", HttpStatus.CONFLICT);
        if (auction.getStatus() != AuctionStatus.ABIERTA)
            throw new AppException("La subasta no está activa", HttpStatus.BAD_REQUEST);
        CatalogItem currentItem = getCurrentItem(auction.getId());
        if (currentItem == null || !currentItem.getId().equals(itemId))
            throw new AppException("Este lote todavía no está en remate", HttpStatus.CONFLICT);
        return item;
    }

    private String streamingLink(Integer auctionId) {
        return streamingBaseUrl.isBlank() ? null : streamingBaseUrl.replaceFirst("/+$", "") + "/" + auctionId;
    }

    private boolean isCertifiedCheck(PaymentMethod method) {
        return method != null && method.getTipo() == PaymentMethodTipo.CHEQUE_CERTIFICADO;
    }

    private void validateCheckCurrency(PaymentMethod method) {
        if (isCertifiedCheck(method) && method.getMoneda() != null
                && !AUCTION_CURRENCY.equalsIgnoreCase(method.getMoneda())) {
            throw new AppException("La moneda del cheque debe ser " + AUCTION_CURRENCY, HttpStatus.BAD_REQUEST);
        }
    }

    private BigDecimal checkGuarantee(PaymentMethod method) {
        return method.getMontoGarantizado() != null ? method.getMontoGarantizado() : BigDecimal.ZERO;
    }

    private BigDecimal getChequeDisponible(PaymentMethod method) {
        if (!isCertifiedCheck(method)) return null;
        return checkGuarantee(method)
            .subtract(checkCommitmentRepository.sumCommittedByPaymentMethodId(method.getId()));
    }

    private void validateCheckCoverage(PaymentMethod method, CatalogItem item, BigDecimal amount) {
        BigDecimal available = checkGuarantee(method)
            .subtract(checkCommitmentRepository.sumCommittedExcludingItem(method.getId(), item.getId()));
        if (amount.compareTo(available) > 0) {
            throw new AppException("El cheque certificado no cubre esta oferta. Disponible: $"
                + available.toPlainString(), HttpStatus.BAD_REQUEST);
        }
    }

    private void broadcastAfterCommit(String topic, Object payload) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    messagingTemplate.convertAndSend(topic, payload);
                } catch (RuntimeException error) {
                    log.warn("No se pudo publicar una actualización en {}", topic, error);
                }
            }
        });
    }

    private void validateCanJoin(Client client, Auction auction) {
        if (!"si".equalsIgnoreCase(client.getAdmitted()))
            throw new AppException("Tu cuenta no está aprobada por la empresa", HttpStatus.FORBIDDEN);

        ClientCategory[] order = ClientCategory.values();
        int userOrd = client.getCategory() != null
            ? client.getCategory().ordinal() : 0;
        int auctionOrd = auction.getCategory() != null
            ? auction.getCategory().ordinal() : 0;

        if (userOrd < auctionOrd)
            throw new AppException(
                "Tu categoría no es suficiente para esta subasta. Requiere: "
                    + auction.getCategory().name(), HttpStatus.FORBIDDEN);

        if (auction.getStatus() != AuctionStatus.ABIERTA)
            throw new AppException("La subasta no está activa", HttpStatus.BAD_REQUEST);
    }

    private CatalogItem getCurrentItem(Integer auctionId) {
        return catalogItemRepository.findByAuctionId(auctionId).stream()
            .filter(ci -> !"si".equals(ci.getAuctioned()))
            .findFirst().orElse(null);
    }

    private CatalogItem getNextItem(Integer auctionId, Integer currentItemId) {
        List<CatalogItem> items = catalogItemRepository.findByAuctionId(auctionId);
        boolean found = false;
        for (CatalogItem ci : items) {
            if (found && !"si".equals(ci.getAuctioned())) return ci;
            if (ci.getId().equals(currentItemId)) found = true;
        }
        return null;
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));
    }

    private Auction resolveAuction(Integer id) {
        return auctionRepository.findById(id)
            .orElseThrow(() -> new AppException("Subasta no encontrada", HttpStatus.NOT_FOUND));
    }

    private String getProductName(Product p) {
        if (p instanceof NormalProduct np) return np.getName();
        if (p instanceof ArtProduct ap)    return ap.getName();
        return "Producto #" + p.getId();
    }
}

package com.figurestore.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.figurestore.dto.request.CreateOrderRequest;
import com.figurestore.dto.request.UpdateOrderStatusRequest;
import com.figurestore.dto.response.OrderItemResponse;
import com.figurestore.dto.response.OrderResponse;
import com.figurestore.dto.response.PaymentTransactionResponse;
import com.figurestore.dto.response.PaymentUrlResponse;
import com.figurestore.dto.response.ZaloPayQueryResponse;
import com.figurestore.entity.Address;
import com.figurestore.entity.Cart;
import com.figurestore.entity.CartItem;
import com.figurestore.entity.Order;
import com.figurestore.entity.OrderItem;
import com.figurestore.entity.PaymentTransaction;
import com.figurestore.entity.Product;
import com.figurestore.entity.User;
import com.figurestore.enums.OrderStatus;
import com.figurestore.enums.PaymentMethod;
import com.figurestore.enums.PaymentStatus;
import com.figurestore.enums.ProductStatus;
import com.figurestore.exception.AppException;
import com.figurestore.repository.AddressRepository;
import com.figurestore.repository.CartItemRepository;
import com.figurestore.repository.CartRepository;
import com.figurestore.repository.OrderRepository;
import com.figurestore.repository.PaymentTransactionRepository;
import com.figurestore.repository.ProductRepository;
import com.figurestore.repository.UserRepository;
import com.figurestore.service.ZaloPayService;
import com.figurestore.service.interfaces.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

 private static final DateTimeFormatter ORDER_CODE_FORMAT =
         DateTimeFormatter.ofPattern("yyMMddHHmmss");

 private static final DateTimeFormatter VNPAY_DATE_FORMAT =
         DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

 private final UserRepository userRepository;
 private final AddressRepository addressRepository;
 private final CartRepository cartRepository;
 private final CartItemRepository cartItemRepository;
 private final ProductRepository productRepository;
 private final OrderRepository orderRepository;
 private final PaymentTransactionRepository paymentTransactionRepository;
 private final ZaloPayService zaloPayService;
 private final ObjectMapper objectMapper;

 @Value("${app.frontend-url:http://localhost:5173}")
 private String frontendUrl;

 @Value("${payment.vnpay.tmn-code:}")
 private String vnpayTmnCode;

 @Value("${payment.vnpay.hash-secret:}")
 private String vnpayHashSecret;

 @Value("${payment.vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
 private String vnpayUrl;

 @Value("${payment.vnpay.return-url:http://localhost:8080/api/payments/vnpay/return}")
 private String vnpayReturnUrl;

 @Override
 @Transactional
 public OrderResponse create(
         String email,
         CreateOrderRequest request
 ) {
  User user = userRepository
          .findByEmailIgnoreCase(email)
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy tài khoản"
          ));

  Address address = addressRepository
          .findByIdAndUserEmailIgnoreCase(
                  request.addressId(),
                  email
          )
          .orElseThrow(() -> new AppException(
                  HttpStatus.BAD_REQUEST,
                  "Địa chỉ không thuộc tài khoản"
          ));

  Cart cart = cartRepository
          .findWithItemsByUserEmailIgnoreCase(email)
          .orElseThrow(() -> new AppException(
                  HttpStatus.BAD_REQUEST,
                  "Giỏ hàng đang trống"
          ));

  if (cart.getItems() == null
          || cart.getItems().isEmpty()) {

   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Giỏ hàng đang trống"
   );
  }

  PaymentMethod paymentMethod =
          request.paymentMethod();

  if (paymentMethod == null) {
   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Vui lòng chọn phương thức thanh toán"
   );
  }

  boolean isCod =
          paymentMethod == PaymentMethod.COD;

  Order order = Order.builder()
          .orderCode(generateOrderCode())
          .user(user)
          .recipientName(
                  address.getRecipientName()
          )
          .recipientPhone(
                  address.getPhone()
          )
          .shippingAddress(
                  buildShippingAddress(address)
          )
          .note(
                  normalizeNote(request.note())
          )
          .shippingFee(BigDecimal.ZERO)
          .paymentMethod(paymentMethod)
          .paymentStatus(
                  isCod
                          ? PaymentStatus.UNPAID
                          : PaymentStatus.PENDING
          )
          .status(
                  isCod
                          ? OrderStatus.PENDING
                          : OrderStatus.PENDING_PAYMENT
          )
          .build();

  BigDecimal subtotal =
          BigDecimal.ZERO;

  List<CartItem> currentCartItems =
          new ArrayList<>(cart.getItems());

  for (CartItem cartItem : currentCartItems) {
   validateCartItem(cartItem);

   Product product = productRepository
           .findById(
                   cartItem.getProduct().getId()
           )
           .orElseThrow(() -> new AppException(
                   HttpStatus.BAD_REQUEST,
                   "Sản phẩm không còn tồn tại"
           ));

   validateProductForOrder(
           product,
           cartItem.getQuantity()
   );

   BigDecimal unitPrice =
           getEffectivePrice(product);

   BigDecimal itemSubtotal =
           unitPrice.multiply(
                   BigDecimal.valueOf(
                           cartItem.getQuantity()
                   )
           );

   int currentSoldQuantity =
           product.getSoldQuantity() == null
                   ? 0
                   : product.getSoldQuantity();

   product.setStockQuantity(
           product.getStockQuantity()
                   - cartItem.getQuantity()
   );

   product.setSoldQuantity(
           currentSoldQuantity
                   + cartItem.getQuantity()
   );

   OrderItem orderItem =
           OrderItem.builder()
                   .productId(
                           product.getId()
                   )
                   .productName(
                           product.getName()
                   )
                   .thumbnailUrl(
                           product.getThumbnailUrl()
                   )
                   .unitPrice(unitPrice)
                   .quantity(
                           cartItem.getQuantity()
                   )
                   .subtotal(itemSubtotal)
                   .build();

   order.addItem(orderItem);

   subtotal =
           subtotal.add(itemSubtotal);
  }

  order.setSubtotal(subtotal);

  order.setTotalAmount(
          subtotal.add(
                  order.getShippingFee()
          )
  );

  Order savedOrder =
          orderRepository.save(order);

  cartItemRepository.deleteAll(
          currentCartItems
  );

  cart.getItems().clear();

  return mapToResponse(savedOrder);
 }

 @Override
 @Transactional(readOnly = true)
 public List<OrderResponse> mine(
         String email
 ) {
  return orderRepository
          .findAllByUserEmailIgnoreCaseOrderByCreatedAtDesc(
                  email
          )
          .stream()
          .map(this::mapToResponse)
          .toList();
 }

 @Override
 @Transactional(readOnly = true)
 public OrderResponse detail(
         String email,
         Long id
 ) {
  Order order = orderRepository
          .findByIdAndUserEmailIgnoreCase(
                  id,
                  email
          )
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy đơn hàng"
          ));

  return mapToResponse(order);
 }

 @Override
 @Transactional
 public OrderResponse cancel(
         String email,
         Long id,
         String reason
 ) {
  Order order = orderRepository
          .findByIdAndUserEmailIgnoreCase(
                  id,
                  email
          )
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy đơn hàng"
          ));

  boolean canCancel =
          order.getStatus() == OrderStatus.PENDING
                  || order.getStatus()
                  == OrderStatus.PENDING_PAYMENT;

  if (!canCancel) {
   throw new AppException(
           HttpStatus.CONFLICT,
           "Đơn hàng ở trạng thái hiện tại không thể hủy"
   );
  }

  if (order.getPaymentStatus()
          == PaymentStatus.PAID) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Đơn hàng đã thanh toán, cần thực hiện hoàn tiền trước"
   );
  }

  restoreProductStock(order);

  order.setStatus(
          OrderStatus.CANCELLED
  );

  order.setCancelledAt(
          LocalDateTime.now()
  );

  order.setCancelReason(
          reason == null || reason.isBlank()
                  ? "Khách hàng hủy đơn"
                  : reason.trim()
  );

  updateLatestPendingTransaction(
          order,
          null,
          PaymentStatus.FAILED,
          "Khách hàng hủy đơn hàng"
  );

  return mapToResponse(
          orderRepository.save(order)
  );
 }

 @Override
 @Transactional(readOnly = true)
 public List<OrderResponse> all() {
  return orderRepository
          .findAllByOrderByCreatedAtDesc()
          .stream()
          .map(this::mapToResponse)
          .toList();
 }

 @Override
 @Transactional
 public OrderResponse updateStatus(
         Long id,
         UpdateOrderStatusRequest request
 ) {
  Order order = orderRepository
          .findById(id)
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy đơn hàng"
          ));

  OrderStatus currentStatus =
          order.getStatus();

  OrderStatus nextStatus =
          request.status();

  if (nextStatus == null) {
   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Trạng thái đơn hàng không được để trống"
   );
  }

  if (!isValidStatusTransition(
          currentStatus,
          nextStatus
  )) {
   throw new AppException(
           HttpStatus.CONFLICT,
           "Không thể chuyển trạng thái "
                   + currentStatus
                   + " → "
                   + nextStatus
   );
  }

  if (nextStatus == OrderStatus.CONFIRMED
          && order.getPaymentMethod()
          != PaymentMethod.COD
          && order.getPaymentStatus()
          != PaymentStatus.PAID) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Đơn hàng online chưa được thanh toán"
   );
  }

  if (nextStatus == OrderStatus.CANCELLED) {
   if (order.getPaymentStatus()
           == PaymentStatus.PAID) {

    throw new AppException(
            HttpStatus.CONFLICT,
            "Đơn hàng đã thanh toán, cần hoàn tiền trước khi hủy"
    );
   }

   restoreProductStock(order);

   order.setCancelledAt(
           LocalDateTime.now()
   );

   order.setCancelReason(
           "Admin hủy đơn"
   );

   updateLatestPendingTransaction(
           order,
           null,
           PaymentStatus.FAILED,
           "Admin hủy đơn"
   );
  }

  LocalDateTime statusChangedAt = LocalDateTime.now();

  if (nextStatus == OrderStatus.CONFIRMED
          && order.getConfirmedAt() == null) {
   order.setConfirmedAt(statusChangedAt);
  }

  if (nextStatus == OrderStatus.SHIPPING
          && order.getShippingAt() == null) {
   order.setShippingAt(statusChangedAt);
  }

  if (nextStatus == OrderStatus.DELIVERED
          && order.getDeliveredAt() == null) {
   order.setDeliveredAt(statusChangedAt);
  }

  if (nextStatus == OrderStatus.DELIVERED
          && order.getPaymentMethod()
          == PaymentMethod.COD) {

   order.setPaymentStatus(
           PaymentStatus.PAID
   );

   if (order.getPaidAt() == null) {
    order.setPaidAt(
            LocalDateTime.now()
    );
   }

   createCodPaymentTransactionIfMissing(
           order
   );
  }

  order.setStatus(nextStatus);

  return mapToResponse(
          orderRepository.save(order)
  );
 }

 @Override
 @Transactional
 public PaymentUrlResponse createPayment(
         String email,
         Long orderId,
         String clientIp
 ) {
  Order order = orderRepository
          .findByIdAndUserEmailIgnoreCase(
                  orderId,
                  email
          )
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy đơn hàng"
          ));

  if (order.getStatus()
          != OrderStatus.PENDING_PAYMENT) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Đơn hàng không ở trạng thái chờ thanh toán"
   );
  }

  if (order.getPaymentStatus()
          == PaymentStatus.PAID) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Đơn hàng đã được thanh toán"
   );
  }

  if (order.getPaymentMethod()
          == PaymentMethod.COD) {

   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Đơn COD không cần tạo liên kết thanh toán"
   );
  }

  if (order.getPaymentMethod()
          == PaymentMethod.ZALOPAY) {

   String appTransId =
           zaloPayService.generateAppTransId(
                   order
           );

   PaymentTransaction transaction =
           PaymentTransaction.builder()
                   .order(order)
                   .provider(
                           PaymentMethod.ZALOPAY
                   )
                   .requestId(appTransId)
                   .amount(
                           order.getTotalAmount()
                   )
                   .status(
                           PaymentStatus.PENDING
                   )
                   .build();

   paymentTransactionRepository.save(
           transaction
   );

   return zaloPayService.createPaymentUrl(
           order,
           email,
           appTransId
   );
  }

  PaymentTransaction existingPending =
          paymentTransactionRepository
                  .findTopByOrderIdAndProviderAndStatusOrderByCreatedAtDesc(
                          order.getId(),
                          order.getPaymentMethod(),
                          PaymentStatus.PENDING
                  )
                  .orElse(null);

  String requestId;

  if (existingPending != null) {
   requestId =
           existingPending.getRequestId();

  } else {
   requestId =
           UUID.randomUUID().toString();

   PaymentTransaction transaction =
           PaymentTransaction.builder()
                   .order(order)
                   .provider(
                           order.getPaymentMethod()
                   )
                   .requestId(requestId)
                   .amount(
                           order.getTotalAmount()
                   )
                   .status(
                           PaymentStatus.PENDING
                   )
                   .build();

   paymentTransactionRepository.save(
           transaction
   );
  }

  if (order.getPaymentMethod()
          == PaymentMethod.MOCK) {

   String paymentUrl =
           frontendUrl
                   + "/payment/mock?order="
                   + encode(
                   order.getOrderCode()
           )
                   + "&requestId="
                   + encode(requestId);

   return new PaymentUrlResponse(
           order.getOrderCode(),
           paymentUrl,
           "MOCK",
           "Thanh toán mô phỏng"
   );
  }

  if (order.getPaymentMethod()
          == PaymentMethod.VNPAY) {

   return new PaymentUrlResponse(
           order.getOrderCode(),
           createVnpayUrl(
                   order,
                   clientIp
           ),
           "VNPAY",
           "Chuyển đến VNPay Sandbox"
   );
  }

  throw new AppException(
          HttpStatus.BAD_REQUEST,
          "Phương thức thanh toán không hợp lệ"
  );
 }

 @Override
 @Transactional
 public OrderResponse verifyZaloPayPayment(
         String email,
         String orderCode
 ) {
  if (orderCode == null
          || orderCode.isBlank()) {

   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Mã đơn hàng không hợp lệ"
   );
  }

  Order order = orderRepository
          .findByOrderCode(
                  orderCode.trim()
          )
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy đơn hàng"
          ));

  if (order.getUser() == null
          || order.getUser().getEmail() == null
          || !order.getUser()
          .getEmail()
          .equalsIgnoreCase(email)) {

   throw new AppException(
           HttpStatus.FORBIDDEN,
           "Bạn không có quyền kiểm tra đơn hàng này"
   );
  }

  if (order.getPaymentMethod()
          != PaymentMethod.ZALOPAY) {

   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Đơn hàng không thanh toán bằng ZaloPay"
   );
  }

  if (order.getPaymentStatus()
          == PaymentStatus.PAID) {

   return mapToResponse(order);
  }

  PaymentTransaction transaction =
          paymentTransactionRepository
                  .findTopByOrderIdAndProviderAndStatusOrderByCreatedAtDesc(
                          order.getId(),
                          PaymentMethod.ZALOPAY,
                          PaymentStatus.PENDING
                  )
                  .orElseThrow(() -> new AppException(
                          HttpStatus.NOT_FOUND,
                          "Không tìm thấy giao dịch ZaloPay"
                  ));

  ZaloPayQueryResponse response =
          zaloPayService.queryOrder(
                  transaction.getRequestId()
          );

  transaction.setRawResponse(
          toJsonString(response)
  );

  if (Integer.valueOf(1)
          .equals(response.returnCode())) {

   if (response.zpTransId() == null) {
    throw new AppException(
            HttpStatus.BAD_GATEWAY,
            "ZaloPay không trả về mã giao dịch"
    );
   }

   long expectedAmount =
           order.getTotalAmount()
                   .longValueExact();

   if (response.amount() == null
           || response.amount().longValue()
           != expectedAmount) {

    throw new AppException(
            HttpStatus.CONFLICT,
            "Số tiền thanh toán không khớp"
    );
   }

   transaction.setProviderTransactionId(
           String.valueOf(
                   response.zpTransId()
           )
   );

   transaction.setStatus(
           PaymentStatus.PAID
   );

   paymentTransactionRepository.save(
           transaction
   );

   order.setPaymentStatus(
           PaymentStatus.PAID
   );

   order.setStatus(
           OrderStatus.PENDING
   );

   order.setPaidAt(
           LocalDateTime.now()
   );

   return mapToResponse(
           orderRepository.save(order)
   );
  }

  paymentTransactionRepository.save(
          transaction
  );

  return mapToResponse(order);
 }

 @Override
 @Transactional
 public OrderResponse markPaidFromProvider(
         String orderCode,
         String providerTransactionId,
         String rawResponse
 ) {
  if (orderCode == null
          || orderCode.isBlank()) {

   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Mã đơn hàng không hợp lệ"
   );
  }

  if (providerTransactionId == null
          || providerTransactionId.isBlank()) {

   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Mã giao dịch không hợp lệ"
   );
  }

  String normalizedTransactionId =
          providerTransactionId.trim();

  Order order = orderRepository
          .findByOrderCode(
                  orderCode.trim()
          )
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy đơn hàng"
          ));

  if (order.getPaymentStatus()
          == PaymentStatus.PAID) {

   return mapToResponse(order);
  }

  if (order.getStatus()
          != OrderStatus.PENDING_PAYMENT) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Đơn hàng không ở trạng thái chờ thanh toán"
   );
  }

  paymentTransactionRepository
          .findByProviderTransactionId(
                  normalizedTransactionId
          )
          .ifPresent(existing -> {
           if (!existing
                   .getOrder()
                   .getId()
                   .equals(order.getId())) {

            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Mã giao dịch đã được sử dụng cho đơn hàng khác"
            );
           }
          });

  PaymentTransaction transaction =
          paymentTransactionRepository
                  .findTopByOrderIdAndProviderAndStatusOrderByCreatedAtDesc(
                          order.getId(),
                          order.getPaymentMethod(),
                          PaymentStatus.PENDING
                  )
                  .orElse(null);

  if (transaction == null) {
   transaction =
           paymentTransactionRepository
                   .findByProviderTransactionId(
                           normalizedTransactionId
                   )
                   .orElse(null);
  }

  if (transaction == null) {
   transaction =
           PaymentTransaction.builder()
                   .order(order)
                   .provider(
                           order.getPaymentMethod()
                   )
                   .requestId(
                           UUID.randomUUID()
                                   .toString()
                   )
                   .amount(
                           order.getTotalAmount()
                   )
                   .build();
  }

  transaction.setProviderTransactionId(
          normalizedTransactionId
  );

  transaction.setStatus(
          PaymentStatus.PAID
  );

  transaction.setRawResponse(
          rawResponse
  );

  paymentTransactionRepository.save(
          transaction
  );

  order.setPaymentStatus(
          PaymentStatus.PAID
  );

  order.setStatus(
          OrderStatus.PENDING
  );

  order.setPaidAt(
          LocalDateTime.now()
  );

  return mapToResponse(
          orderRepository.save(order)
  );
 }

 @Override
 @Transactional
 public OrderResponse markPaymentFailed(
         String orderCode,
         String providerTransactionId,
         String reason,
         String rawResponse
 ) {
  Order order = orderRepository
          .findByOrderCode(orderCode)
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy đơn hàng"
          ));

  if (order.getPaymentStatus()
          == PaymentStatus.PAID) {

   return mapToResponse(order);
  }

  if (order.getStatus()
          == OrderStatus.CANCELLED) {

   return mapToResponse(order);
  }

  if (order.getStatus()
          != OrderStatus.PENDING_PAYMENT) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Đơn hàng không ở trạng thái chờ thanh toán"
   );
  }

  restoreProductStock(order);

  order.setPaymentStatus(
          PaymentStatus.FAILED
  );

  order.setStatus(
          OrderStatus.CANCELLED
  );

  order.setCancelledAt(
          LocalDateTime.now()
  );

  order.setCancelReason(
          reason == null || reason.isBlank()
                  ? "Thanh toán thất bại hoặc đã bị hủy"
                  : reason.trim()
  );

  updateLatestPendingTransaction(
          order,
          providerTransactionId,
          PaymentStatus.FAILED,
          rawResponse
  );

  return mapToResponse(
          orderRepository.save(order)
  );
 }

 private void createCodPaymentTransactionIfMissing(
         Order order
 ) {
  boolean exists =
          paymentTransactionRepository
                  .findAllByOrderIdOrderByCreatedAtDesc(
                          order.getId()
                  )
                  .stream()
                  .anyMatch(transaction ->
                          transaction.getProvider()
                                  == PaymentMethod.COD
                                  && transaction.getStatus()
                                  == PaymentStatus.PAID
                  );

  if (exists) {
   return;
  }

  PaymentTransaction transaction =
          PaymentTransaction.builder()
                  .order(order)
                  .provider(PaymentMethod.COD)
                  .providerTransactionId(
                          "COD-"
                                  + order.getOrderCode()
                  )
                  .requestId(
                          UUID.randomUUID()
                                  .toString()
                  )
                  .amount(
                          order.getTotalAmount()
                  )
                  .status(
                          PaymentStatus.PAID
                  )
                  .rawResponse(
                          "Admin xác nhận đã giao hàng và đã thu tiền COD"
                  )
                  .build();

  paymentTransactionRepository.save(
          transaction
  );
 }

 private void updateLatestPendingTransaction(
         Order order,
         String providerTransactionId,
         PaymentStatus status,
         String rawResponse
 ) {
  PaymentTransaction transaction =
          paymentTransactionRepository
                  .findTopByOrderIdAndProviderAndStatusOrderByCreatedAtDesc(
                          order.getId(),
                          order.getPaymentMethod(),
                          PaymentStatus.PENDING
                  )
                  .orElse(null);

  if (transaction == null
          && providerTransactionId != null
          && !providerTransactionId.isBlank()) {

   transaction =
           paymentTransactionRepository
                   .findByProviderTransactionId(
                           providerTransactionId.trim()
                   )
                   .orElse(null);
  }

  if (transaction == null) {
   transaction =
           PaymentTransaction.builder()
                   .order(order)
                   .provider(
                           order.getPaymentMethod()
                   )
                   .requestId(
                           UUID.randomUUID()
                                   .toString()
                   )
                   .amount(
                           order.getTotalAmount()
                   )
                   .build();
  }

  if (providerTransactionId != null
          && !providerTransactionId.isBlank()) {

   transaction.setProviderTransactionId(
           providerTransactionId.trim()
   );
  }

  transaction.setStatus(status);
  transaction.setRawResponse(rawResponse);

  paymentTransactionRepository.save(
          transaction
  );
 }

 private void validateCartItem(
         CartItem cartItem
 ) {
  if (cartItem.getProduct() == null) {
   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Giỏ hàng chứa sản phẩm không hợp lệ"
   );
  }

  if (cartItem.getQuantity() == null
          || cartItem.getQuantity() <= 0) {

   throw new AppException(
           HttpStatus.BAD_REQUEST,
           "Số lượng sản phẩm trong giỏ hàng không hợp lệ"
   );
  }
 }

 private void validateProductForOrder(
         Product product,
         int quantity
 ) {
  if (product.getStatus()
          == ProductStatus.INACTIVE) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Sản phẩm '"
                   + product.getName()
                   + "' đã ngừng bán"
   );
  }

  if (product.getStockQuantity() == null
          || product.getStockQuantity()
          < quantity) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Sản phẩm '"
                   + product.getName()
                   + "' không đủ tồn kho"
   );
  }

  BigDecimal effectivePrice =
          getEffectivePrice(product);

  if (effectivePrice.compareTo(
          BigDecimal.ZERO
  ) <= 0) {

   throw new AppException(
           HttpStatus.CONFLICT,
           "Giá sản phẩm '"
                   + product.getName()
                   + "' không hợp lệ"
   );
  }
 }

 private BigDecimal getEffectivePrice(
         Product product
 ) {
  if (product.getDiscountPrice() != null
          && product.getDiscountPrice()
          .compareTo(BigDecimal.ZERO) > 0) {

   return product.getDiscountPrice();
  }

  if (product.getPrice() == null) {
   throw new AppException(
           HttpStatus.CONFLICT,
           "Sản phẩm chưa có giá bán"
   );
  }

  return product.getPrice();
 }

 private boolean isValidStatusTransition(
         OrderStatus currentStatus,
         OrderStatus nextStatus
 ) {
  if (currentStatus == nextStatus) {
   return false;
  }

  return switch (currentStatus) {
   case PENDING_PAYMENT ->
           nextStatus == OrderStatus.CANCELLED;

   case PENDING ->
           nextStatus == OrderStatus.CONFIRMED
                   || nextStatus
                   == OrderStatus.CANCELLED;

   case CONFIRMED ->
           nextStatus == OrderStatus.SHIPPING
                   || nextStatus
                   == OrderStatus.CANCELLED;

   case SHIPPING ->
           nextStatus == OrderStatus.DELIVERED;

   case DELIVERED, CANCELLED ->
           false;
  };
 }

 private void restoreProductStock(
         Order order
 ) {
  if (order.getItems() == null) {
   return;
  }

  for (OrderItem orderItem : order.getItems()) {
   productRepository
           .findById(
                   orderItem.getProductId()
           )
           .ifPresent(product -> {
            int currentStock =
                    product.getStockQuantity() == null
                            ? 0
                            : product.getStockQuantity();

            int currentSold =
                    product.getSoldQuantity() == null
                            ? 0
                            : product.getSoldQuantity();

            product.setStockQuantity(
                    currentStock
                            + orderItem.getQuantity()
            );

            product.setSoldQuantity(
                    Math.max(
                            0,
                            currentSold
                                    - orderItem.getQuantity()
                    )
            );
           });
  }
 }

 private String createVnpayUrl(
         Order order,
         String clientIp
 ) {
  if (vnpayTmnCode == null
          || vnpayTmnCode.isBlank()
          || vnpayHashSecret == null
          || vnpayHashSecret.isBlank()) {

   throw new AppException(
           HttpStatus.SERVICE_UNAVAILABLE,
           "Chưa cấu hình VNPay TMN Code hoặc Hash Secret"
   );
  }

  Map<String, String> parameters =
          new TreeMap<>();

  parameters.put(
          "vnp_Version",
          "2.1.0"
  );

  parameters.put(
          "vnp_Command",
          "pay"
  );

  parameters.put(
          "vnp_TmnCode",
          vnpayTmnCode
  );

  parameters.put(
          "vnp_Amount",
          order.getTotalAmount()
                  .multiply(
                          BigDecimal.valueOf(100)
                  )
                  .toBigInteger()
                  .toString()
  );

  parameters.put(
          "vnp_CurrCode",
          "VND"
  );

  parameters.put(
          "vnp_TxnRef",
          order.getOrderCode()
  );

  parameters.put(
          "vnp_OrderInfo",
          "Thanh toan don hang "
                  + order.getOrderCode()
  );

  parameters.put(
          "vnp_OrderType",
          "other"
  );

  parameters.put(
          "vnp_Locale",
          "vn"
  );

  parameters.put(
          "vnp_ReturnUrl",
          vnpayReturnUrl
  );

  parameters.put(
          "vnp_IpAddr",
          normalizeClientIp(clientIp)
  );

  parameters.put(
          "vnp_CreateDate",
          LocalDateTime.now()
                  .format(
                          VNPAY_DATE_FORMAT
                  )
  );

  String queryString =
          parameters
                  .entrySet()
                  .stream()
                  .map(entry ->
                          encode(
                                  entry.getKey()
                          )
                                  + "="
                                  + encode(
                                  entry.getValue()
                          )
                  )
                  .reduce(
                          (first, second) ->
                                  first
                                          + "&"
                                          + second
                  )
                  .orElse("");

  String secureHash =
          hmacSha512(
                  vnpayHashSecret,
                  queryString
          );

  return vnpayUrl
          + "?"
          + queryString
          + "&vnp_SecureHash="
          + secureHash;
 }

 private String generateOrderCode() {
  String timePart =
          LocalDateTime.now()
                  .format(
                          ORDER_CODE_FORMAT
                  );

  int randomNumber =
          ThreadLocalRandom
                  .current()
                  .nextInt(1000);

  return "FS"
          + timePart
          + String.format(
          "%03d",
          randomNumber
  );
 }

 private String buildShippingAddress(
         Address address
 ) {
  return java.util.stream.Stream.of(
                  address.getDetailAddress(),
                  address.getWard(),
                  address.getDistrict(),
                  address.getProvince()
          )
          .filter(value ->
                  value != null
                          && !value.isBlank()
          )
          .collect(
                  java.util.stream.Collectors
                          .joining(", ")
          );
 }

 private String normalizeNote(
         String note
 ) {
  if (note == null
          || note.isBlank()) {

   return null;
  }

  return note.trim();
 }

 private String normalizeClientIp(
         String clientIp
 ) {
  if (clientIp == null
          || clientIp.isBlank()) {

   return "127.0.0.1";
  }

  if (clientIp.contains(",")) {
   return clientIp
           .split(",")[0]
           .trim();
  }

  return clientIp.trim();
 }

 private String encode(
         String value
 ) {
  return URLEncoder
          .encode(
                  value,
                  StandardCharsets.US_ASCII
          )
          .replace(
                  "+",
                  "%20"
          );
 }

 private String hmacSha512(
         String secretKey,
         String data
 ) {
  try {
   Mac mac =
           Mac.getInstance(
                   "HmacSHA512"
           );

   SecretKeySpec secretKeySpec =
           new SecretKeySpec(
                   secretKey.getBytes(
                           StandardCharsets.UTF_8
                   ),
                   "HmacSHA512"
           );

   mac.init(secretKeySpec);

   byte[] hash =
           mac.doFinal(
                   data.getBytes(
                           StandardCharsets.UTF_8
                   )
           );

   return HexFormat
           .of()
           .formatHex(hash);

  } catch (Exception exception) {
   throw new IllegalStateException(
           "Không thể tạo chữ ký VNPay",
           exception
   );
  }
 }

 private String toJsonString(
         Object value
 ) {
  try {
   return objectMapper
           .writeValueAsString(value);

  } catch (Exception exception) {
   return String.valueOf(value);
  }
 }

 private OrderResponse mapToResponse(
         Order order
 ) {
  List<OrderItemResponse> items =
          order.getItems() == null
                  ? List.of()
                  : order.getItems()
                  .stream()
                  .map(item ->
                          new OrderItemResponse(
                                  item.getId(),
                                  item.getProductId(),
                                  item.getProductName(),
                                  item.getThumbnailUrl(),
                                  item.getUnitPrice(),
                                  item.getQuantity(),
                                  item.getSubtotal()
                          )
                  )
                  .toList();

  List<PaymentTransactionResponse> payments =
          paymentTransactionRepository
                  .findAllByOrderIdOrderByCreatedAtDesc(
                          order.getId()
                  )
                  .stream()
                  .map(transaction ->
                          new PaymentTransactionResponse(
                                  transaction.getId(),
                                  transaction.getProvider(),
                                  transaction.getProviderTransactionId(),
                                  transaction.getRequestId(),
                                  transaction.getAmount(),
                                  transaction.getStatus(),
                                  transaction.getCreatedAt(),
                                  transaction.getUpdatedAt()
                          )
                  )
                  .toList();

  return new OrderResponse(
          order.getId(),
          order.getOrderCode(),
          order.getRecipientName(),
          order.getRecipientPhone(),
          order.getShippingAddress(),
          order.getNote(),
          order.getSubtotal(),
          order.getShippingFee(),
          order.getTotalAmount(),
          order.getStatus(),
          order.getPaymentMethod(),
          order.getPaymentStatus(),
          order.getPaidAt(),
          order.getConfirmedAt(),
          order.getShippingAt(),
          order.getDeliveredAt(),
          order.getCancelledAt(),
          order.getCancelReason(),
          order.getCreatedAt(),
          items,
          payments
  );
 }
}
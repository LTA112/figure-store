package com.figurestore.controller;

import com.figurestore.entity.Order;
import com.figurestore.exception.AppException;
import com.figurestore.repository.OrderRepository;
import com.figurestore.service.interfaces.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

 private final OrderService orderService;
 private final OrderRepository orderRepository;

 @Value("${payment.vnpay.hash-secret:}")
 private String vnpayHashSecret;

 @Value("${app.frontend-url:http://localhost:5173}")
 private String frontendUrl;

 @GetMapping("/vnpay/return")
 public RedirectView handleVnpayReturn(
         @RequestParam Map<String, String> parameters
 ) {
  String orderCode = parameters.get("vnp_TxnRef");
  String responseCode = parameters.get("vnp_ResponseCode");
  String transactionStatus =
          parameters.get("vnp_TransactionStatus");

  String transactionNo =
          parameters.get("vnp_TransactionNo");

  String suppliedSecureHash =
          parameters.get("vnp_SecureHash");

  String rawResponse = parameters.toString();

  boolean validSignature =
          verifyVnpaySignature(
                  parameters,
                  suppliedSecureHash
          );

  /*
   * Chữ ký không hợp lệ:
   * không được cập nhật Order và không được hoàn kho.
   */
  if (!validSignature) {
   return redirectToResult(
           orderCode,
           false,
           "Chữ ký VNPay không hợp lệ"
   );
  }

  if (orderCode == null || orderCode.isBlank()) {
   return redirectToResult(
           null,
           false,
           "Không nhận được mã đơn hàng"
   );
  }

  Order order = orderRepository
          .findByOrderCode(orderCode)
          .orElse(null);

  if (order == null) {
   return redirectToResult(
           orderCode,
           false,
           "Không tìm thấy đơn hàng"
   );
  }

  if (!isValidAmount(order, parameters.get("vnp_Amount"))) {
   return redirectToResult(
           orderCode,
           false,
           "Số tiền thanh toán không khớp"
   );
  }

  boolean paymentSuccess =
          "00".equals(responseCode)
                  && (
                  transactionStatus == null
                          || "00".equals(transactionStatus)
          );

  try {
   if (paymentSuccess) {
    String safeTransactionNo =
            transactionNo == null
                    || transactionNo.isBlank()
                    ? UUID.randomUUID().toString()
                    : transactionNo;

    orderService.markPaidFromProvider(
            orderCode,
            safeTransactionNo,
            rawResponse
    );

    return redirectToResult(
            orderCode,
            true,
            "Thanh toán VNPay thành công"
    );
   }

   /*
    * Chữ ký hợp lệ nhưng giao dịch thất bại hoặc bị hủy.
    * Hàm này sẽ:
    * - chuyển paymentStatus thành FAILED;
    * - chuyển Order thành CANCELLED;
    * - hoàn lại tồn kho;
    * - chống hoàn tồn kho nhiều lần.
    */
   orderService.markPaymentFailed(
           orderCode,
           normalizeTransactionNo(transactionNo),
           getFailureReason(responseCode),
           rawResponse
   );

   return redirectToResult(
           orderCode,
           false,
           getFailureReason(responseCode)
   );

  } catch (AppException exception) {
   return redirectToResult(
           orderCode,
           false,
           exception.getMessage()
   );

  } catch (Exception exception) {
   return redirectToResult(
           orderCode,
           false,
           "Không thể xử lý kết quả thanh toán"
   );
  }
 }

 @PostMapping("/mock/{orderCode}/success")
 public ResponseEntity<?> markMockPaymentSuccess(
         @PathVariable String orderCode,
         @RequestParam String transactionId
 ) {
  return ResponseEntity.ok(
          orderService.markPaidFromProvider(
                  orderCode,
                  transactionId,
                  "MOCK_SUCCESS"
          )
  );
 }

 private boolean verifyVnpaySignature(
         Map<String, String> parameters,
         String suppliedSecureHash
 ) {
  if (vnpayHashSecret == null
          || vnpayHashSecret.isBlank()
          || suppliedSecureHash == null
          || suppliedSecureHash.isBlank()) {
   return false;
  }

  Map<String, String> signedParameters =
          new TreeMap<>(parameters);

  signedParameters.remove("vnp_SecureHash");
  signedParameters.remove("vnp_SecureHashType");

  String hashData = signedParameters
          .entrySet()
          .stream()
          .filter(entry ->
                  entry.getValue() != null
                          && !entry.getValue().isBlank()
          )
          .map(entry ->
                  encode(entry.getKey())
                          + "="
                          + encode(entry.getValue())
          )
          .reduce(
                  (first, second) ->
                          first + "&" + second
          )
          .orElse("");

  String expectedSecureHash =
          hmacSha512(
                  vnpayHashSecret,
                  hashData
          );

  return constantTimeEquals(
          suppliedSecureHash,
          expectedSecureHash
  );
 }

 private boolean isValidAmount(
         Order order,
         String vnpayAmount
 ) {
  if (vnpayAmount == null || vnpayAmount.isBlank()) {
   return false;
  }

  try {
   BigDecimal callbackAmount =
           new BigDecimal(vnpayAmount);

   BigDecimal expectedAmount =
           order.getTotalAmount()
                   .multiply(BigDecimal.valueOf(100));

   return callbackAmount.compareTo(expectedAmount) == 0;

  } catch (NumberFormatException exception) {
   return false;
  }
 }

 private String normalizeTransactionNo(
         String transactionNo
 ) {
  if (transactionNo == null
          || transactionNo.isBlank()
          || "0".equals(transactionNo)) {
   return null;
  }

  return transactionNo.trim();
 }

 private String getFailureReason(String responseCode) {
  if (responseCode == null || responseCode.isBlank()) {
   return "Không nhận được kết quả thanh toán từ VNPay";
  }

  return switch (responseCode) {
   case "07" ->
           "Giao dịch có dấu hiệu bất thường";

   case "09" ->
           "Tài khoản chưa đăng ký Internet Banking";

   case "10" ->
           "Thông tin tài khoản không chính xác";

   case "11" ->
           "Giao dịch đã hết thời gian thanh toán";

   case "12" ->
           "Tài khoản hoặc thẻ đã bị khóa";

   case "13" ->
           "Mã OTP không chính xác";

   case "24" ->
           "Khách hàng đã hủy giao dịch";

   case "51" ->
           "Tài khoản không đủ số dư";

   case "65" ->
           "Tài khoản đã vượt quá hạn mức giao dịch";

   case "75" ->
           "Ngân hàng đang bảo trì";

   case "79" ->
           "Nhập sai mật khẩu thanh toán quá số lần cho phép";

   case "99" ->
           "Thanh toán VNPay không thành công";

   default ->
           "Thanh toán VNPay thất bại, mã lỗi: "
                   + responseCode;
  };
 }

 private RedirectView redirectToResult(
         String orderCode,
         boolean success,
         String message
 ) {
  String safeOrderCode =
          orderCode == null ? "" : orderCode;

  String safeMessage =
          message == null ? "" : message;

  String redirectUrl =
          frontendUrl
                  + "/payment/result"
                  + "?provider=VNPAY"
                  + "&order="
                  + encode(safeOrderCode)
                  + "&success="
                  + success
                  + "&message="
                  + encode(safeMessage);

  return new RedirectView(redirectUrl);
 }

 private String encode(String value) {
  return URLEncoder
          .encode(
                  value,
                  StandardCharsets.US_ASCII
          )
          .replace("+", "%20");
 }

 private String hmacSha512(
         String secretKey,
         String data
 ) {
  try {
   Mac mac = Mac.getInstance("HmacSHA512");

   SecretKeySpec secretKeySpec =
           new SecretKeySpec(
                   secretKey.getBytes(
                           StandardCharsets.UTF_8
                   ),
                   "HmacSHA512"
           );

   mac.init(secretKeySpec);

   byte[] hash = mac.doFinal(
           data.getBytes(StandardCharsets.UTF_8)
   );

   return HexFormat.of().formatHex(hash);

  } catch (Exception exception) {
   throw new IllegalStateException(
           "Không thể xác minh chữ ký VNPay",
           exception
   );
  }
 }

 private boolean constantTimeEquals(
         String first,
         String second
 ) {
  if (first == null || second == null) {
   return false;
  }

  return MessageDigest.isEqual(
          first.toLowerCase()
                  .getBytes(StandardCharsets.UTF_8),
          second.toLowerCase()
                  .getBytes(StandardCharsets.UTF_8)
  );
 }
}
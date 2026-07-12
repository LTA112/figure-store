package com.figurestore.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.figurestore.dto.response.PaymentUrlResponse;
import com.figurestore.dto.response.ZaloPayCreateOrderResponse;
import com.figurestore.entity.Order;
import com.figurestore.entity.OrderItem;
import com.figurestore.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ZaloPayService {

    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter TRANS_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyMMdd");

    private final ObjectMapper objectMapper;

    @Value("${payment.zalopay.app-id:}")
    private String appId;

    @Value("${payment.zalopay.key1:}")
    private String key1;

    @Value("${payment.zalopay.key2:}")
    private String key2;

    @Value("${payment.zalopay.create-url}")
    private String createUrl;

    @Value("${payment.zalopay.redirect-url}")
    private String redirectUrl;

    public PaymentUrlResponse createPaymentUrl(
            Order order,
            String userEmail
    ) {
        validateConfiguration();

        String appTransId = generateAppTransId(order);

        long appTime = System.currentTimeMillis();

        long amount = toZaloPayAmount(order.getTotalAmount());

        String appUser =
                userEmail == null || userEmail.isBlank()
                        ? "figure-store-user"
                        : userEmail;

        String embedData = toJson(
                Map.of(
                        "redirecturl",
                        redirectUrl
                                + "?provider=ZALOPAY"
                                + "&order="
                                + order.getOrderCode()
                )
        );

        String item = buildItemsJson(order.getItems());

        String macInput = String.join(
                "|",
                appId,
                appTransId,
                appUser,
                String.valueOf(amount),
                String.valueOf(appTime),
                embedData,
                item
        );

        String mac = hmacSha256(key1, macInput);

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add("appid", appId);
        form.add("apptransid", appTransId);
        form.add("appuser", appUser);
        form.add("apptime", String.valueOf(appTime));
        form.add("amount", String.valueOf(amount));
        form.add("embeddata", embedData);
        form.add("item", item);
        form.add(
                "description",
                "Figure Store - Thanh toan don hang "
                        + order.getOrderCode()
        );
        form.add("bankcode", "zalopayapp");
        form.add("mac", mac);

        ZaloPayCreateOrderResponse response;

        try {
            response = RestClient
                    .create()
                    .post()
                    .uri(createUrl)
                    .contentType(
                            MediaType.APPLICATION_FORM_URLENCODED
                    )
                    .body(form)
                    .retrieve()
                    .body(ZaloPayCreateOrderResponse.class);
        } catch (Exception exception) {
            throw new AppException(
                    HttpStatus.BAD_GATEWAY,
                    "Không thể kết nối đến ZaloPay Sandbox"
            );
        }

        if (response == null) {
            throw new AppException(
                    HttpStatus.BAD_GATEWAY,
                    "ZaloPay không trả về dữ liệu"
            );
        }

        if (!Integer.valueOf(1).equals(response.returnCode())) {
            throw new AppException(
                    HttpStatus.BAD_GATEWAY,
                    "ZaloPay từ chối tạo giao dịch: "
                            + response.returnMessage()
            );
        }

        if (response.orderUrl() == null
                || response.orderUrl().isBlank()) {
            throw new AppException(
                    HttpStatus.BAD_GATEWAY,
                    "ZaloPay không trả về đường dẫn thanh toán"
            );
        }

        return new PaymentUrlResponse(
                order.getOrderCode(),
                response.orderUrl(),
                "ZALOPAY",
                "Chuyển đến ZaloPay Sandbox"
        );
    }

    public boolean verifyCallback(
            String data,
            String requestMac
    ) {
        if (data == null
                || data.isBlank()
                || requestMac == null
                || requestMac.isBlank()) {
            return false;
        }

        String expectedMac = hmacSha256(key2, data);

        return constantTimeEquals(
                expectedMac,
                requestMac
        );
    }

    public String getKey2() {
        return key2;
    }

    private String generateAppTransId(Order order) {
        String date = LocalDate
                .now(VIETNAM_ZONE)
                .format(TRANS_DATE_FORMAT);

        String randomPart = UUID
                .randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10);

        /*
         * ZaloPay v1 bắt buộc apptransid bắt đầu bằng yyMMdd_.
         * Không dùng nguyên orderCode nếu orderCode không có format này.
         */
        return date
                + "_"
                + order.getId()
                + "_"
                + randomPart;
    }

    private long toZaloPayAmount(BigDecimal amount) {
        if (amount == null
                || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền thanh toán không hợp lệ"
            );
        }

        try {
            return amount.longValueExact();
        } catch (ArithmeticException exception) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "ZaloPay chỉ chấp nhận số tiền VND nguyên"
            );
        }
    }

    private String buildItemsJson(List<OrderItem> orderItems) {
        if (orderItems == null || orderItems.isEmpty()) {
            return "[]";
        }

        List<Map<String, Object>> items = orderItems
                .stream()
                .map(orderItem ->
                        Map.<String, Object>of(
                                "itemid",
                                orderItem.getProductId(),
                                "itemname",
                                orderItem.getProductName(),
                                "itemprice",
                                orderItem.getUnitPrice().longValue(),
                                "itemquantity",
                                orderItem.getQuantity()
                        )
                )
                .toList();

        return toJson(items);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new AppException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể tạo dữ liệu thanh toán ZaloPay"
            );
        }
    }

    private String hmacSha256(
            String secret,
            String data
    ) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(
                    new SecretKeySpec(
                            secret.getBytes(StandardCharsets.UTF_8),
                            "HmacSHA256"
                    )
            );

            return HexFormat
                    .of()
                    .formatHex(
                            mac.doFinal(
                                    data.getBytes(StandardCharsets.UTF_8)
                            )
                    );
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Không thể tạo chữ ký ZaloPay",
                    exception
            );
        }
    }

    private boolean constantTimeEquals(
            String expected,
            String actual
    ) {
        return java.security.MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private void validateConfiguration() {
        if (appId == null || appId.isBlank()) {
            throw new AppException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình ZALOPAY_APP_ID"
            );
        }

        if (key1 == null || key1.isBlank()) {
            throw new AppException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình ZALOPAY_KEY1"
            );
        }

        if (key2 == null || key2.isBlank()) {
            throw new AppException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình ZALOPAY_KEY2"
            );
        }
    }
}
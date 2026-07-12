package com.figurestore.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.figurestore.dto.request.ZaloPayCallbackRequest;
import com.figurestore.dto.response.ZaloPayCallbackResponse;
import com.figurestore.entity.Order;
import com.figurestore.exception.AppException;
import com.figurestore.repository.OrderRepository;
import com.figurestore.service.ZaloPayService;
import com.figurestore.service.interfaces.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/zalopay")
@RequiredArgsConstructor
public class PaymentCallbackController {

    private final ZaloPayService zaloPayService;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    @PostMapping("/callback")
    public ZaloPayCallbackResponse callback(
            @RequestBody ZaloPayCallbackRequest request
    ) {
        try {
            boolean valid = zaloPayService.verifyCallback(
                    request.data(),
                    request.mac()
            );

            if (!valid) {
                return new ZaloPayCallbackResponse(
                        -1,
                        "MAC không hợp lệ"
                );
            }

            JsonNode data =
                    objectMapper.readTree(request.data());

            String appTransId =
                    data.path("apptransid").asText();

            String zpTransId =
                    data.path("zptransid").asText();

            long callbackAmount =
                    data.path("amount").asLong();

            /*
             * Vì apptransid được tạo từ:
             * yyMMdd_orderId_random
             */
            Long orderId = extractOrderId(appTransId);

            Order order = orderRepository
                    .findById(orderId)
                    .orElseThrow(() -> new AppException(
                            HttpStatus.NOT_FOUND,
                            "Không tìm thấy đơn hàng"
                    ));

            long expectedAmount =
                    order.getTotalAmount().longValueExact();

            if (callbackAmount != expectedAmount) {
                return new ZaloPayCallbackResponse(
                        -2,
                        "Số tiền callback không khớp"
                );
            }

            orderService.markPaidFromProvider(
                    order.getOrderCode(),
                    zpTransId,
                    request.data()
            );

            return new ZaloPayCallbackResponse(
                    1,
                    "Thanh toán thành công"
            );
        } catch (AppException exception) {
            return new ZaloPayCallbackResponse(
                    0,
                    exception.getMessage()
            );
        } catch (Exception exception) {
            return new ZaloPayCallbackResponse(
                    0,
                    "Xử lý callback thất bại"
            );
        }
    }

    private Long extractOrderId(String appTransId) {
        if (appTransId == null || appTransId.isBlank()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "apptransid không hợp lệ"
            );
        }

        String[] parts = appTransId.split("_");

        if (parts.length < 3) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Định dạng apptransid không hợp lệ"
            );
        }

        try {
            return Long.valueOf(parts[1]);
        } catch (NumberFormatException exception) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Order ID trong apptransid không hợp lệ"
            );
        }
    }
}
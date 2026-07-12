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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
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
            if (!zaloPayService.verifyCallback(
                    request.data(),
                    request.mac()
            )) {
                return new ZaloPayCallbackResponse(
                        2,
                        "Invalid"
                );
            }

            JsonNode data = objectMapper.readTree(
                    request.data()
            );

            String appTransId =
                    data.path("app_trans_id")
                            .asText();

            String zpTransId =
                    data.path("zp_trans_id")
                            .asText();

            long callbackAmount =
                    data.path("amount")
                            .asLong(-1);

            if (appTransId.isBlank()
                    || zpTransId.isBlank()
                    || callbackAmount <= 0) {

                return new ZaloPayCallbackResponse(
                        2,
                        "Invalid"
                );
            }

            Long orderId = extractOrderId(
                    appTransId
            );

            Order order = orderRepository
                    .findById(orderId)
                    .orElseThrow(() ->
                            new AppException(
                                    HttpStatus.NOT_FOUND,
                                    "Không tìm thấy đơn hàng"
                            )
                    );

            long expectedAmount =
                    order.getTotalAmount()
                            .longValueExact();

            if (callbackAmount != expectedAmount) {
                log.warn(
                        "Sai số tiền callback. Order: {}, expected: {}, actual: {}",
                        order.getOrderCode(),
                        expectedAmount,
                        callbackAmount
                );

                return new ZaloPayCallbackResponse(
                        2,
                        "Invalid"
                );
            }

            orderService.markPaidFromProvider(
                    order.getOrderCode(),
                    zpTransId,
                    request.data()
            );

            log.info(
                    "ZaloPay callback thành công. Order: {}, transaction: {}",
                    order.getOrderCode(),
                    zpTransId
            );

            return new ZaloPayCallbackResponse(
                    1,
                    "Success"
            );

        } catch (Exception exception) {
            log.error(
                    "Lỗi xử lý callback ZaloPay",
                    exception
            );

            return new ZaloPayCallbackResponse(
                    2,
                    "Invalid"
            );
        }
    }

    private Long extractOrderId(
            String appTransId
    ) {
        String[] parts = appTransId.split("_");

        if (parts.length < 3) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "app_trans_id không hợp lệ"
            );
        }

        try {
            return Long.valueOf(parts[1]);

        } catch (NumberFormatException exception) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Order ID không hợp lệ"
            );
        }
    }
}
package com.figurestore.controller;

import com.figurestore.dto.request.AddCartItemRequest;
import com.figurestore.dto.request.UpdateCartItemRequest;
import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.CartResponse;
import com.figurestore.service.interfaces.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<
            ApiResponse<CartResponse>
            > getCart(
            Authentication authentication
    ) {
        CartResponse result =
                cartService.getCart(
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy giỏ hàng thành công",
                        result
                )
        );
    }

    @PostMapping("/items")
    public ResponseEntity<
            ApiResponse<CartResponse>
            > addItem(
            Authentication authentication,
            @Valid
            @RequestBody
            AddCartItemRequest request
    ) {
        CartResponse result =
                cartService.addItem(
                        authentication.getName(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Đã thêm sản phẩm vào giỏ hàng",
                                result
                        )
                );
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<
            ApiResponse<CartResponse>
            > updateItem(
            Authentication authentication,
            @PathVariable Long itemId,
            @Valid
            @RequestBody
            UpdateCartItemRequest request
    ) {
        CartResponse result =
                cartService.updateItem(
                        authentication.getName(),
                        itemId,
                        request
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật giỏ hàng thành công",
                        result
                )
        );
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<
            ApiResponse<CartResponse>
            > removeItem(
            Authentication authentication,
            @PathVariable Long itemId
    ) {
        CartResponse result =
                cartService.removeItem(
                        authentication.getName(),
                        itemId
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Đã xóa sản phẩm khỏi giỏ hàng",
                        result
                )
        );
    }

    @DeleteMapping
    public ResponseEntity<
            ApiResponse<Void>
            > clearCart(
            Authentication authentication
    ) {
        cartService.clearCart(
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Đã xóa toàn bộ giỏ hàng",
                        null
                )
        );
    }
}
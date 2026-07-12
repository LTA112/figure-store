package com.figurestore.service.interfaces;

import com.figurestore.dto.request.AddCartItemRequest;
import com.figurestore.dto.request.MergeCartRequest;
import com.figurestore.dto.request.UpdateCartItemRequest;
import com.figurestore.dto.response.CartResponse;

public interface CartService {

    CartResponse getCart(
            String email
    );

    CartResponse addItem(
            String email,
            AddCartItemRequest request
    );

    CartResponse mergeCart(
            String email,
            MergeCartRequest request
    );

    CartResponse updateItem(
            String email,
            Long itemId,
            UpdateCartItemRequest request
    );

    CartResponse removeItem(
            String email,
            Long itemId
    );

    void clearCart(
            String email
    );
}